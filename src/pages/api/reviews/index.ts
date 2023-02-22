import { validate } from "@/middleware/apiValidation";
import { ApiRequest, ApiResponse, PopulatedApiRequest } from "@/utils/types";
import { NextApiResponse } from "next";
import nc from "next-connect";
import { GET_Base_query, GET_ISBN_UserId_params } from "./index.types";
import { db } from "@/utils/db";

const handler = nc<ApiRequest, NextApiResponse>();

// GET /api/reviews
handler.get<ApiRequest<GET_Base_query>>(
  validate({ query: GET_Base_query }),
  async (req, res) => {
    const { page, amountPerPage } = req.query;

    const reviews = await db.review.findMany({
      skip: page * amountPerPage,
      take: amountPerPage,
    });

    return res.status(200).json({
      status: "success",
      data: {
        length: reviews.length,
        reviews,
      },
    });
  }
);

export default handler;