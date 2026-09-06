"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type EventPosterProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  href?: string;
  frameClassName?: string;
  onError?: () => void;
};

export function EventPoster({
  src,
  alt,
  className,
  sizes,
  priority = false,
  fill = false,
  href,
  frameClassName,
  onError,
}: EventPosterProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) return null;

  const image = (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : 960}
      height={fill ? undefined : 600}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized
      onError={() => {
        setFailedSrc(src);
        onError?.();
      }}
    />
  );

  if (!href && !frameClassName) return image;

  const frame = href ? (
    <Link href={href} className={frameClassName} aria-label={alt}>
      {image}
    </Link>
  ) : (
    <div className={frameClassName}>{image}</div>
  );

  return frame;
}

export function useBrokenPoster(src: string | null): {
  show: boolean;
  onError: () => void;
} {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return {
    show: Boolean(src) && failedSrc !== src,
    onError: () => {
      if (src) setFailedSrc(src);
    },
  };
}

export function EventDetailPoster({
  src,
  alt,
  credit,
}: {
  src: string;
  alt: string;
  credit?: string | null;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) return null;

  return (
    <figure className="overflow-hidden rounded-3xl border border-forest/10 bg-moss/30 p-2 sm:p-3">
      <Image
        src={src}
        alt={alt}
        width={800}
        height={1000}
        unoptimized
        className="mx-auto h-auto max-h-[28rem] w-auto max-w-full object-contain"
        sizes="(max-width: 768px) 100vw, 20rem"
        onError={() => setFailedSrc(src)}
      />
      {credit ? (
        <figcaption className="px-2 pt-2 pb-1 text-center text-[11px] text-ink/40">{credit}</figcaption>
      ) : null}
    </figure>
  );
}
