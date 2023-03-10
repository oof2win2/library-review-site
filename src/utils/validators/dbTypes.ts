import { z } from "zod"

export const Post = z.object({
	id: z.number(),
	isbn: z.string().length(13),
	title: z.string().max(255),
	postPublished: z.boolean(),
	publishedYear: z.number().optional(),
	publisher: z.string().optional(),
	authors: z.string().optional(),
	smallThumbnail: z.string().optional(),
	largeThumbnail: z.string().optional(),
	postAuthorId: z.number(),
	createdAt: z.date(),
	updatedAt: z.date(),
})
export type Post = z.infer<typeof Post>

// a single user that has registered. don't need to be a delegate or anything
export const User = z.object({
	id: z.number(),
	email: z.string().email(),
	password: z.string(),

	name: z.string(),
	reviewAmount: z.number(),
	authLevel: z.number(),
})
export type User = z.infer<typeof User>

export const Session = z.object({
	jti: z.string(),
	iat: z.number(),
	exp: z.number(),
	aud: z.number(),
})
export type Session = z.infer<typeof Session>
