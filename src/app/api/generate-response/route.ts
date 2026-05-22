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
  } catch (error: unknown) {
    let message = "Failed to generate AI responses";
    let status = 500;

    if (error instanceof Error) {
      // Gemini quota / rate limit
      if (
        error.message.includes("429") ||
        error.message.includes("RESOURCE_EXHAUSTED")
      ) {
        message = "AI quota exceeded. Please try again later.";
        status = 429;
      } else {
        message = error.message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status,
      },
    );
  }
}
