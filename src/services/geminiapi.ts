import { GoogleGenAI } from "@google/genai";
import * as z from "zod";

const responseSchemaJson = {
  type: "object",
  properties: {
    standard: {
      type: "string",
      description: "Professional and standard business response",
    },
    friendly: {
      type: "string",
      description: "Warm and friendly response",
    },
    recovery: {
      type: "string",
      description:
        "Apology and recovery-focused response for negative experiences",
    },
  },
  required: ["standard", "friendly", "recovery"],
};

const responseSchema = z.object({
  standard: z.string(),
  friendly: z.string(),
  recovery: z.string(),
});

const client = new GoogleGenAI({
  apiKey: process.env.GEM_API_KEY!,
});

interface GenerateReviewParams {
  reviewText: string;
  authorName?: string | null;
  rating?: number | null;
  hotelName?: string;
}

export async function generateReviewResponses({
  reviewText,
  authorName,
  rating,
  hotelName,
}: GenerateReviewParams) {
  const prompt = `
Generate 3 different responses to this customer review.

Hotel name: ${hotelName || "Hotel"}

Customer name: ${authorName || "Guest"}

Rating: ${rating || "Unknown"}/5

Review:
"""
${reviewText || "no review improvise"}
"""

Rules:
- Sound natural and professional
- fast
`;

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchemaJson,
    },
  });

  const parsed = JSON.parse(response.text || "{}");

  return responseSchema.parse(parsed);
}
