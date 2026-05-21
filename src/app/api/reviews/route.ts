import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/database/dbconnect"; // Adjust this import path to match your project layout

interface SerpApiPlaceInfo {
  title?: string;
  type?: string;
}

interface SerpApiReview {
  user?: {
    name?: string;
  };
  rating?: number;
  snippet?: string;
  text?: string;
}

interface SerpApiResponse {
  place_info?: SerpApiPlaceInfo;
  reviews?: SerpApiReview[];
  error?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json(
      { error: "placeId parameter is required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    console.error("Missing SERPAPI_API_KEY in environment variables.");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const serpApiUrl = `https://serpapi.com/search.json?engine=google_maps_reviews&place_id=${placeId}&sort_by=newestFirst&api_key=${apiKey}`;

  try {
    const response = await fetch(serpApiUrl);
    if (!response.ok) {
      throw new Error(`SerpApi error status: ${response.status}`);
    }

    const data: SerpApiResponse = await response.json();

    // 1. Validate if the place is a hotel
    const placeInfo = data.place_info || {};
    const placeType = placeInfo.type || "";
    const isHotel =
      placeType.toLowerCase().includes("hotel") ||
      placeType.toLowerCase().includes("resort");

    if (!isHotel) {
      return NextResponse.json(
        {
          error: "Validation Failed",
          message: `The provided Place ID belongs to a "${placeType}", not a hotel.`,
        },
        { status: 422 },
      );
    }

    // 2. Get the top 5 newest reviews
    const rawReviews = data.reviews || [];
    const topFiveReviews = rawReviews.slice(0, 5);

    // 3. Map SerpApi fields to match your Supabase database schema
    // Your DB requires 'review_text' to be NOT NULL, so we use a fallback if empty
    const reviewsToInsert = topFiveReviews.map((review) => ({
      place_id: placeId,
      author_name: review.user?.name || "Anonymous",
      rating: review.rating || 0,
      review_text: review.text || review.snippet || "No review text provided.",
      status: "pending", // Matches your default/check constraint
    }));

    if (reviewsToInsert.length === 0) {
      return NextResponse.json({
        placeName: placeInfo.title,
        placeType: placeType,
        reviews: [],
      });
    }

    // 4. Save reviews to Supabase
    // .select() returns the fully created rows containing generated UUIDs and created_at timestamps
    const { data: savedReviews, error: supabaseError } = await supabase
      .from("reviews")
      .insert(reviewsToInsert)
      .select();

    if (supabaseError) {
      throw new Error(`Supabase Insert Error: ${supabaseError.message}`);
    }

    // 5. Return the saved data from your database straight to the frontend
    return NextResponse.json({
      placeName: placeInfo.title,
      placeType: placeType,
      reviews: savedReviews,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed handling request:", errorMessage);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
