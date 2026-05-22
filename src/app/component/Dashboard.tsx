"use client";

import { useState } from "react";
import Fetchfield from "./Fetchfield";
import HotelReviews from "./HotelReviews"; // The previous component we created

export default function Dashboard() {
  const [placeId, setPlaceId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  return (
    <div className="space-y-8 py-10">
      {/* Pass the state setter down here */}
      <Fetchfield setPlaceId={setPlaceId} loading={loading} />

      {/* Only display the reviews component once a valid placeId has been submitted */}
      {placeId && (
        <HotelReviews placeId={placeId} setLoadingParent={setLoading} />
      )}
    </div>
  );
}
