"use client";

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  width,
  height,
  fill,
  className,
  fallbackSrc = '/placeholder.svg',
  priority = false,
  ...props
}: ImageWithFallbackProps) {
  const [isFailed, setIsFailed] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  // Adjust state during render if src changes
  if (src !== prevSrc) {
    setIsFailed(false);
    setPrevSrc(src);
  }

  const handleError = () => {
    setIsFailed(true);
  };

  // For Backblaze B2 images, use unoptimized mode to avoid timeout issues
  const isBackblazeImage = typeof src === 'string' && src.includes('backblazeb2.com');

  return (
    <Image
      {...props}
      src={isFailed ? fallbackSrc : src}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      className={className}
      priority={priority}
      unoptimized={isBackblazeImage}
      onError={handleError}
    />
  );
}
