"use client";

import { useEffect, useState } from "react";

// Define the shape of the review based on your Supabase table schema
interface DBReview {
  id: string;
  place_id: string;
  author_name: string | null;
  rating: number | null;
  review_text: string;
  status: "pending" | "resolved";
  created_at: string;
  review_date: string; // Added review_date to match your dataset schema
}

interface ApiResponse {
  placeName?: string;
  placeType?: string;
  reviews?: DBReview[];
  error?: string;
  message?: string;
}

export default function HotelReviews({ placeId }: { placeId: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId) return;

    async function fetchAndSaveReviews() {
      try {
        setLoading(true);
        setError(null);
        // Call Next.js route handler
        const res = await fetch(`/api/reviews?placeId=${placeId}`);
        const result: ApiResponse = await res.json();

        if (!res.ok) {
          // Captures 400, 422 (Not a Hotel), and 500 errors
          throw new Error(
            result.message || result.error || "Failed to fetch reviews",
          );
        }

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAndSaveReviews();
  }, [placeId]);

  if (loading)
    return (
      <div className="p-4 text-gray-500">
        Fetching and saving latest reviews...
      </div>
    );
  if (error)
    return <div className="p-4 text-red-500 font-medium">Error: {error}</div>;
  if (!data || !data.reviews || data.reviews.length === 0)
    return <div className="p-4 text-gray-500">No reviews found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{data.placeName}</h2>
        <p className="text-sm text-gray-500 capitalize">
          Category: {data.placeType || "hotel"}
        </p>
        <span className="inline-block mt-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-semibold">
          Saved to Database Successfully
        </span>
      </div>

      <div className="space-y-4">
        {data.reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition"
          >
            <div className="flex justify-between items-center mb-2">
              <strong className="text-gray-900">
                {review.author_name || "Anonymous"}
              </strong>
              {/* timestamp with the genuine SerpApi review_date */}
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                {review.review_date}
              </span>
            </div>

            <div className="flex items-center mb-2">
              <span className="text-yellow-500 font-bold mr-1">
                {"★".repeat(review.rating || 0)}
              </span>
              <span className="text-gray-300">
                {"★".repeat(5 - (review.rating || 0))}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                ({review.rating}/5)
              </span>
            </div>

            <p className="text-gray-700 text-sm whitespace-pre-line">
              {review.review_text}
            </p>

            <div className="mt-3 flex items-center">
              <span className="text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Status: {review.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
