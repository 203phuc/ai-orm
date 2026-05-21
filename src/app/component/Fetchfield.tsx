"use client";

import { useState } from "react";

// 1. Define the TypeScript interface for the component props
interface FetchfieldProps {
  setPlaceId: (id: string) => void;
}

const Fetchfield = ({ setPlaceId }: FetchfieldProps) => {
  // 2. Track local input state before the user officially clicks submit
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = () => {
    if (inputValue.trim()) {
      setPlaceId(inputValue.trim());
    }
  };

  return (
    <div className="mx-10">
      <label
        htmlFor="place_id"
        className="block mb-2.5 text-sm font-medium text-heading"
      >
        Enter place ID
      </label>

      {/* Flex container groups the input and button side-by-side */}
      <div className="flex gap-3 items-center w-full">
        <input
          type="text"
          id="place_id"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()} // Allows pressing Enter to submit
          className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
          placeholder="place ID"
          required
        />

        <button
          type="button"
          onClick={handleSubmit}
          className="bg-brand text-white text-sm font-medium rounded-base px-5 py-2.5 shadow-xs focus:ring-2 focus:ring-brand focus:outline-none whitespace-nowrap transition-colors duration-200 hover:bg-white hover:text-black"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default Fetchfield;
