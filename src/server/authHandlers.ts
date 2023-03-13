import { NextApiRequest, NextApiResponse } from "next"
import { SessionData } from "@/utils/validators/sessionData"
import * as jose from "jose"
import { env } from "@/env.mjs"
import { Session, User } from "@prisma/client"
import { prisma } from "@/server/db"

const JWT_SECRET = Buffer.from(env.JWT_SECRET)

/**
 * Get session
 */
export async function getSessionData(
	cookies: Partial<{
		[key: string]: string
	}>
): Promise<null | SessionData> {
	const cookie = cookies[env.COOKIE_NAME]
	if (!cookie) return null
	if (!cookie.startsWith("Bearer ")) return null

	let valid: jose.JWTVerifyResult
	try {
		// get cookie without "Bearer " prefix and validate it
		valid = await jose.jwtVerify(cookie.substring(7), JWT_SECRET)
	} catch {
		return null
	}

	// get the saved data from the database
	const saved = await prisma.session.findFirst({
		where: {
			jti: valid.payload.jti,
		},
	})
	if (!saved) return null

	// check if the session is still valid
	// session.exp is in seconds, Date.now() is in milliseconds
	if (saved.exp * 1000 < Date.now()) {
		// the session is expired, so delete it from the database
		// this most likely won't occur since expired cookies are not sent by the browser
		// should happen only if there is a timezone issue between the client and server
		await prisma.session.delete({
			where: {
				jti: saved.jti,
			},
		})
		return null
	}

	const user = await prisma.user.findFirst({
		where: {
			id: saved.aud,
		},
	})

	// parse the data from the database and return it
	const session = SessionData.safeParse({
		...saved,
		user,
	})
	return session.success ? session.data : null
}

/**
 * Save session data to the database and send it to the client as a cookie
 */
export async function saveSessionData(
	res: NextApiResponse,
	user: User,
	prevSession: SessionData | null
): Promise<{
	/**
	 * The cookie data itself
	 */
	cookie: string
	/**
	 * ID of the JWT
	 */
	jti: string
}> {
	// expire in a year (1000ms * 60s * 60m * 24h * 365d)
	const expiryDate = Math.floor(
		new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).valueOf() / 1000
	)

	// save the session data to the database
	let saved: Session
	if (prevSession) {
		saved = await prisma.session.upsert({
			where: {
				jti: prevSession.jti,
			},
			create: {
				iat: Math.floor(Date.now() / 1000),
				aud: user.id,
				exp: expiryDate,
			},
			update: {
				exp: expiryDate,
			},
		})
	} else {
		saved = await prisma.session.create({
			data: {
				iat: Math.floor(Date.now() / 1000),
				aud: user.id,
				exp: expiryDate,
			},
		})
	}

	// sign the session data with the JWT secret and return it
	const cookie = await new jose.SignJWT({})
		.setExpirationTime(saved.exp)
		.setJti(saved.jti)
		.setAudience(saved.aud.toString())
		.setIssuedAt(saved.iat)
		.setProtectedHeader({ alg: "HS256" })
		.sign(JWT_SECRET)

	// set the cookie in response headers
	// the cookie should expire in (expiry timestamp - issued at timestamp) seconds as defined by the Max-Age header
	res.setHeader(
		"Set-Cookie",
		`${env.COOKIE_NAME}=Bearer ${cookie}; HttpOnly; Max-Age=${
			saved.exp - saved.iat
		}; Path=/; Secure`
	)

	return {
		cookie: `Bearer ${cookie}`,
		jti: saved.jti,
	}
}

/**
 * Expire session data
 */
export async function clearSessionData(
	req: NextApiRequest,
	res: NextApiResponse
) {
	// first we delete the cookie
	res.setHeader(
		"Set-Cookie",
		`${env.COOKIE_NAME}=1; HttpOnly; Max-Age=1; Path=/; Secure`
	)

	// next we need to delete the session data from the database
	const cookie = req.cookies[env.COOKIE_NAME]
	if (!cookie) return
	let valid: jose.JWTVerifyResult
	try {
		// get cookie without "Bearer " prefix and validate it
		valid = await jose.jwtVerify(cookie.substring(7), JWT_SECRET)
	} catch {
		return null
	}

	await prisma.session
		.delete({
			where: {
				jti: valid.payload.jti,
			},
		})
		.catch()
}
