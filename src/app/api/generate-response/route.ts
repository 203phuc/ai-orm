import { generateReviewResponses } from "@/services/geminiapi";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await generateReviewResponses({
      reviewText: body.reviewText,
      authorName: body.authorName,
      rating: body.rating,
      hotelName: body.hotelName,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to generate AI responses",
      },
      {
        status: 500,
      },
    );
  }
}
