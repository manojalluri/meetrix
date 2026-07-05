"use client";

import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js Error Boundary caught an error:", error);
  }, [error]);

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-black text-white p-6 text-center">
      <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2">Something went wrong!</h2>
      <p className="text-zinc-400 max-w-md mb-6 whitespace-pre-wrap font-mono text-sm">
        {error.message || "An unknown error occurred."}
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
