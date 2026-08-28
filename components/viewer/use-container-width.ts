"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks a container's actual rendered width so a viewer never requests a
 * render wider than the box it sits in. PdfViewer/ImageViewer pick their
 * canvas/image width from a fixed BASE_WIDTH * zoom, which overflows a
 * narrow (mobile) screen with no way to shrink back down — this clamps
 * against whatever room is really available.
 */
export function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
