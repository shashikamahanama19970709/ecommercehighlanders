import React from "react";

interface LogoLoaderProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function LogoLoader({ size = "md", className = "" }: LogoLoaderProps) {
  const sizeMap = {
    xs: "h-4 w-4",
    sm: "h-8 w-8",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${currentSize} select-none`}>
        {/* Ambient glow backdrop */}
        {size !== "xs" && (
          <div
            className="absolute inset-0 -m-2 rounded-full bg-[#c8a84b]/10 blur-md animate-pulse"
            style={{ animationDuration: "2s" }}
          />
        )}
        
        {/* Animated brand logo */}
        <svg
          viewBox="0 0 80 80"
          className={`h-full w-full drop-shadow-sm ${size === "xs" ? "animate-pulse" : "animate-bounce"}`}
          style={size !== "xs" ? { animationDuration: "2.5s" } : undefined}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="logo-loader-silver" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8edf5" />
              <stop offset="100%" stopColor="#8898b0" />
            </linearGradient>
            <linearGradient id="logo-loader-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4a84b" />
              <stop offset="100%" stopColor="#9a6e08" />
            </linearGradient>
            <linearGradient id="logo-loader-navy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#0f1a2e" />
            </linearGradient>
          </defs>
          <polygon points="6,62 26,18 46,62" fill="url(#logo-loader-silver)" />
          <polygon points="24,62 44,8 64,62" fill="url(#logo-loader-silver)" opacity="0.8" />
          <polygon points="44,8 39,24 49,24" fill="white" opacity="0.9" />
          <path
            d="M4,68 Q22,52 42,60 Q58,66 74,52"
            stroke="url(#logo-loader-gold)"
            strokeWidth="4.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M4,74 Q24,62 44,68 Q60,73 76,60"
            stroke="url(#logo-loader-navy)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.75"
          />
        </svg>
      </div>
    </div>
  );
}
