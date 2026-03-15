"use client";

import { useRef, useCallback, useEffect } from "react";
import { drawDither, type DitherOptions } from "@/lib/dither";

/**
 * Attaches a canvas-based Bayer dither hover effect to a container.
 *
 * Usage:
 *   const { containerRef, canvasRef } = useDitherHover();
 *   <div ref={containerRef} className="relative">
 *     <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10" />
 *     ...children
 *   </div>
 */
export function useDitherHover(opts?: DitherOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!mouseRef.current.active) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    drawDither(
      ctx,
      canvas.width,
      canvas.height,
      mouseRef.current.x,
      mouseRef.current.y,
      opts
    );

    rafRef.current = requestAnimationFrame(render);
  }, [opts]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    function syncSize() {
      if (!canvas || !container) return;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }

    function onMouseMove(e: MouseEvent) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;

      if (!mouseRef.current.active) {
        mouseRef.current.active = true;
        rafRef.current = requestAnimationFrame(render);
      }
    }

    function onMouseLeave() {
      mouseRef.current.active = false;
      cancelAnimationFrame(rafRef.current);
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    syncSize();
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    const observer = new ResizeObserver(syncSize);
    observer.observe(container);

    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [render]);

  return { containerRef, canvasRef };
}
