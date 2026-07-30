"use client";

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Loading({
  text,
  fullScreen = false,
  size = "md",
}: LoadingProps) {
  const sizeClasses: Record<string, string> = {
    sm: "h-6 w-6 border-2",
    md: "h-8 w-8 border-t-2 border-b-2",
    lg: "h-12 w-12 border-t-2 border-b-2",
  };

  const spinner = (
    <div
      className={`animate-spin rounded-full border-indigo-500 ${sizeClasses[size] || sizeClasses.md}`}
    ></div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center space-y-3">
          {spinner}
          {text && <p className="text-gray-400 text-sm">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-20">
      <div className="flex flex-col items-center space-y-3">
        {spinner}
        {text && <p className="text-gray-500 text-sm">{text}</p>}
      </div>
    </div>
  );
}
