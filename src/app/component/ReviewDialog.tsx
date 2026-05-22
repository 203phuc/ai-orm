// @/components/ReviewDialog.tsx
"use client";
import { useEffect, useState } from "react";

interface DBReview {
  id: string;
  place_id: string;
  author_name: string | null;
  rating: number | null;
  review_text: string;
  status: "pending" | "resolved";
  created_at: string;
  review_date: string;
}

interface AIResponses {
  standard: string;
  friendly: string;
  recovery: string;
}

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  review: DBReview | null;
}

export default function ReviewDialog({
  isOpen,
  onClose,
  review,
}: ReviewDialogProps) {
  const [responses, setResponses] = useState<AIResponses | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  async function handleApprove(responseText: string) {
    try {
      if (!review) return;

      setSaving(true);

      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId: review.id,
          approvedResponse: responseText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed approving response");
      }

      alert("Review resolved successfully");

      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }
  useEffect(() => {
    async function generateAI() {
      try {
        if (!isOpen || !review) return null;
        setLoading(true);
        const res = await fetch("/api/generate-response", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reviewText: review.review_text,
            authorName: review.author_name,
            rating: review.rating,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Server error");
        }
        setResponses(data);
      } catch (err) {
        console.error(err);
        console.log(err);
      } finally {
        setLoading(false);
      }
    }

    generateAI();
  }, [isOpen, review]);
  const handleClose = () => {
    setResponses(null);
    window.location.reload();
    onClose();
  };
  if (!isOpen || !review) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full shadow-xl mx-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {review.author_name || "Anonymous"}
            </h3>

            <p className="text-sm text-gray-500">{review.review_date}</p>
          </div>

          <span
            className={`text-xs font-medium uppercase tracking-wider px-2 py-1 rounded ${
              review.status === "resolved"
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {review.status}
          </span>
        </div>

        <div className="flex items-center mb-4">
          <span className="text-yellow-500 font-bold mr-1">
            {"★".repeat(review.rating || 0)}
          </span>

          <span className="text-gray-300">
            {"★".repeat(5 - (review.rating || 0))}
          </span>

          <span className="text-sm text-gray-500 ml-2">
            ({review.rating}/5)
          </span>
        </div>

        <p className="text-gray-700 whitespace-pre-line mb-6">
          {review.review_text}
        </p>
        {loading && (
          <p className="text-sm text-gray-500 mb-4">
            Generating AI responses...
          </p>
        )}
        {responses && (
          <div className="space-y-4 mb-6 md:flex md:gap-2">
            <div className="border rounded p-3">
              <h4 className="font-bold mb-2">Standard</h4>
              <p className="text-sm text-gray-700">{responses.standard}</p>
              <button
                onClick={() => handleApprove(responses.standard)}
                disabled={saving}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Approve
              </button>
            </div>

            <div className="border rounded p-3">
              <h4 className="font-bold mb-2">Friendly</h4>
              <p className="text-sm text-gray-700">{responses.friendly}</p>
              <button
                onClick={() => handleApprove(responses.standard)}
                disabled={saving}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Approve
              </button>
            </div>

            <div className="border rounded p-3">
              <h4 className="font-bold mb-2">Recovery</h4>
              <p className="text-sm text-gray-700">{responses.recovery}</p>
              <button
                onClick={() => handleApprove(responses.standard)}
                disabled={saving}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Approve
              </button>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}
