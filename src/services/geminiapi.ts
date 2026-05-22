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

`;

  const response = await client.models
    .generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchemaJson,
      },
    })
    .catch((e) => {
      const data = JSON.parse(e.message);
      // console.error("error name: ", e.name);
      // console.error("error message: ", data.error.message);
      // console.error("error status: ", e.status);
      const err = new Error(data.error.message);
      (err as any).status = data.error.status;
      throw err;
    });

  const parsed = JSON.parse(response.text || "{}");

  return responseSchema.parse(parsed);
}
