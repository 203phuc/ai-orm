// @/services/serpapi.ts

interface SerpApiPlaceInfo {
  title?: string;
  type?: string;
}

interface SerpApiReview {
  user?: { name?: string };
  rating?: number;
  date?: string; // 1. ADDED date property to read from SerpApi payload
  snippet?: string;
  text?: string;
}

interface SerpApiResponse {
  place_info?: SerpApiPlaceInfo;
  reviews?: SerpApiReview[];
  error?: string;
}

export interface FormattedReview {
  place_id: string;
  hotel_name: string;
  author_name: string;
  rating: number;
  review_text: string;
  review_date: string; // 2. ADDED review_date to the formatted interface
  status: string;
}

interface FetchReviewsResult {
  placeName?: string;
  placeType?: string;
  reviews: FormattedReview[];
}

export async function fetchAndFormatHotelReviews(
  placeId: string,
): Promise<FetchReviewsResult> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SERPAPI_API_KEY in environment variables.");
  }

  const serpApiUrl = `https://serpapi.com/search.json?engine=google_maps_reviews&place_id=${placeId}&sort_by=newestFirst&api_key=${apiKey}`;
  console.log("ello");
  const response = await fetch(serpApiUrl);
  if (!response.ok) {
    throw new Error(`SerpApi error status: ${response.status}`);
  }
  const data: SerpApiResponse = await response.json();

  const placeInfo = data.place_info || {};
  const placeType = placeInfo.type || "";
  console.log(data.place_info);
  // Hotel Validation
  const isHotel =
    placeType.toLowerCase().includes("hotel") ||
    placeType.toLowerCase().includes("resort");

  if (!isHotel) {
    throw new Error(
      `VALIDATION_FAILED: The provided Place ID belongs to a "${placeType}", not a hotel.`,
    );
  }

  const rawReviews = data.reviews || [];
  const topFiveReviews = rawReviews.slice(0, 5);

  // 3. Map placeInfo.title and review.date into your output rows
  const reviews = topFiveReviews.map((review) => ({
    place_id: placeId,
    hotel_name: placeInfo.title || "Unknown Hotel",
    author_name: review.user?.name || "Anonymous",
    rating: review.rating || 0,
    review_text: review.text || review.snippet || "No review text provided.",
    review_date: review.date || "Unknown date", // <-- Added here
    status: "pending",
  }));

  return {
    placeName: placeInfo.title,
    placeType,
    reviews,
  };
}
