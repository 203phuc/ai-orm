import { supabase } from "@/database/dbconnect";
import { NextRequest, NextResponse } from "next/server";

interface SerpApiPlaceInfo {
  title?: string;
  type?: string;
}

interface SerpApiReview {
  user?: {
    name?: string;
  };
  rating?: number;
  date?: string; // Kept your date string from SerpApi schema
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

  try {
    // THE CACHE LOOKUP (Checking the DB first)
    const { data: cachedReviews, error: fetchError } = await supabase
      .from("reviews")
      .select("*")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw new Error(`Supabase Fetch Error: ${fetchError.message}`);
    }

    // If reviews already exist locally, return them instantly!
    if (cachedReviews && cachedReviews.length > 0) {
      return NextResponse.json({
        placeId,
        placeName: cachedReviews[0].hotel_name || "Cached Hotel",
        source: "database", // Clear indicator that we skipped SerpApi
        reviews: cachedReviews,
      });
    }
    // CACHE MISS - Hit SerpApi only when DB is empty
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const serpApiUrl = `https://serpapi.com/search.json?engine=google_maps_reviews&place_id=${placeId}&sort_by=newestFirst&api_key=${apiKey}`;
    const response = await fetch(serpApiUrl);
    if (!response.ok) throw new Error(`SerpApi status: ${response.status}`);

    const data: SerpApiResponse = await response.json();

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

    const rawReviews = data.reviews || [];
    const topFiveReviews = rawReviews.slice(0, 5);

    // Map fields, including new review_date tracking
    const reviewsToInsert = topFiveReviews.map((review) => ({
      place_id: placeId,
      hotel_name: placeInfo.title || "Unknown Hotel",
      author_name: review.user?.name || "Anonymous",
      rating: review.rating || 0,
      review_text: review.text || review.snippet || "No review text provided.",
      review_date: review.date || "Unknown date",
      status: "pending",
    }));

    if (reviewsToInsert.length === 0) {
      return NextResponse.json({
        placeName: placeInfo.title,
        placeType,
        source: "serpapi_empty",
        reviews: [],
      });
    }

    // ================================================================
    // STEP 3: UPSERT SAVING - With the fixed string (no spaces)
    // ================================================================
    const { data: savedReviews, error: supabaseError } = await supabase
      .from("reviews")
      .upsert(reviewsToInsert, {
        onConflict: "place_id,author_name,review_text", // ⚠️ Fixed: No internal spaces
        ignoreDuplicates: false,
      })
      .select();

    if (supabaseError) {
      throw new Error(`Supabase Error: ${supabaseError.message}`);
    }

    return NextResponse.json({
      placeName: placeInfo.title,
      placeType: placeType,
      source: "serpapi_fetched",
      reviews: savedReviews,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 },
    );
  }
}
