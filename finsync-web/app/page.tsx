"use client";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold">FinSync App Running!</h1>
      <p className="mt-4 text-gray-400">
        If you see this, rendering is working.
      </p>
      <a
        href="/login"
        className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
      >
        Go to Login
      </a>
    </div>
  );
}
