// @/app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/database/dbconnect";
import { fetchAndFormatHotelReviews } from "@/services/serpapi";

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
    // 1. DB Logic: Check for cached data
    const { data: cachedReviews, error: fetchError } = await supabase
      .from("reviews")
      .select("*")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });

    if (fetchError)
      throw new Error(`Supabase Fetch Error: ${fetchError.message}`);

    // If cache hits, we can extract the hotel name from the database row
    if (cachedReviews && cachedReviews.length > 0) {
      return NextResponse.json({
        placeId,
        placeName: cachedReviews[0].hotel_name, // <-- Pulled from DB row
        source: "database",
        reviews: cachedReviews,
      });
    }

    // 2. Service Logic: Call our isolated SerpApi service
    let externalData;
    try {
      externalData = await fetchAndFormatHotelReviews(placeId);
    } catch (serviceError: any) {
      if (serviceError.message.startsWith("VALIDATION_FAILED:")) {
        return NextResponse.json(
          {
            error: "Validation Failed",
            message: serviceError.message.replace("VALIDATION_FAILED: ", ""),
          },
          { status: 422 },
        );
      }
      throw serviceError;
    }

    if (externalData.reviews.length === 0) {
      return NextResponse.json({
        placeName: externalData.placeName,
        placeType: externalData.placeType,
        source: "serpapi_empty",
        reviews: [],
      });
    }

    // 3. DB Logic: Save the formatted reviews (Now includes hotel_name automatically)
    const { data: savedReviews, error: supabaseError } = await supabase
      .from("reviews")
      .upsert(externalData.reviews, {
        onConflict: "place_id, author_name, review_text",
      })
      .select();

    if (supabaseError)
      throw new Error(`Supabase Upsert Error: ${supabaseError.message}`);

    return NextResponse.json({
      placeName: externalData.placeName,
      placeType: externalData.placeType,
      source: "serpapi_fetched",
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
