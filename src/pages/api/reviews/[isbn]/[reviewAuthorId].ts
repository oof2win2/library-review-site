import { apiValidation } from "@/middleware"
import { ApiRequest, ApiResponse, PopulatedApiRequest } from "@/utils/types"
import { NextApiResponse } from "next"
import nc from "next-connect"
import { GET_ISBN_UserId_params } from "../index.types"
import { db } from "@/utils/db"

const handler = nc<ApiRequest, NextApiResponse>()

// GET /api/reviews/:isbn/:userId
handler.get<ApiRequest<{ Query: GET_ISBN_UserId_params }>>(
	apiValidation({ query: GET_ISBN_UserId_params }),
	async (req, res) => {
		const { isbn, reviewAuthorId } = req.query

		const review = await db.review.findUnique({
			where: {
				isbn_reviewAuthorId: {
					isbn: isbn.toString(),
					reviewAuthorId,
				},
			},
		})

		return res.status(200).json({
			status: "success",
			data: {
				review,
			},
		})
	}
)

export default handler
