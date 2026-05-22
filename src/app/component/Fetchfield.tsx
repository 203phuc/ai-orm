"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface FetchfieldProps {
  setPlaceId: (id: string) => void;
  loading: boolean;
}

const Fetchfield = ({ setPlaceId, loading }: FetchfieldProps) => {
  const [inputValue, setInputValue] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    const value = inputValue.trim();

    setPlaceId(value);

    router.push(`/?placeId=${value}`);
  }
  useEffect(() => {
    const placeId =
    searchParams.get("placeId") || "";
    if (placeId) {
      setPlaceId(placeId);
    }
  })

  return (
    <div className="mx-10">
      <label
        htmlFor="place_id"
        className="block mb-2.5 text-sm font-medium text-heading"
      >
        Enter place ID
      </label>

      <div className="flex gap-3 items-center w-full">
        <input
          type="text"
          id="place_id"
          value={inputValue}
          disabled={loading}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body disabled:opacity-50"
          placeholder="place ID"
          required
        />

        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="bg-brand text-white text-sm font-medium rounded-base px-5 py-2.5 shadow-xs focus:ring-2 focus:ring-brand focus:outline-none whitespace-nowrap transition-colors duration-200 hover:bg-white hover:text-black disabled:opacity-50"
        >
          {loading ? "Loading..." : "Fetch"}
        </button>
      </div>
    </div>
  );
};

export default Fetchfield;
