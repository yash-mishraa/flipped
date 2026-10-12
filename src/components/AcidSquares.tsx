"use client";

import { useEffect, useRef } from "react";

export interface AcidSquaresProps {
  readonly color?: string;
  readonly accentColor?: string;
  readonly speed?: number;
  readonly depth?: number;
  readonly zoom?: number;
  readonly opacity?: number;
  readonly mouseInteraction?: boolean;
  readonly className?: string;
}

/** A lightweight canvas corridor of quietly pulsing squares for the home masthead. */
export function AcidSquares({
  color = "#f5f1e8",
  accentColor = "#b64c38",
  speed = 0.7,
  depth = 10,
  zoom = 1.3,
  opacity = 1,
  mouseInteraction = true,
  className = "",
}: AcidSquaresProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (/jsdom/i.test(navigator.userAgent)) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0.5, y: 0.5 };
    let width = 1;
    let height = 1;
    let phase = 0;
    let frame = 0;
    let active = true;
    let last = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (now: number) => {
      frame = 0;
      if (!active || document.hidden) return;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      if (!reduced) phase += dt * speed;
      const dark = document.documentElement.dataset.theme === "dark";
      const bg = dark ? "#11130f" : color;
      const accent = dark ? "#c6ff3d" : accentColor;
      context.clearRect(0, 0, width, height);
      const horizonX = width * (mouseInteraction ? 0.5 + (pointer.x - 0.5) * 0.025 : 0.5);
      const horizonY = height * (mouseInteraction ? 0.48 + (pointer.y - 0.5) * 0.02 : 0.48);
      const maxRadius = Math.hypot(width, height) * (0.56 / Math.max(zoom, 0.2));
      const rings = Math.max(4, Math.min(16, Math.floor(depth)));
      for (let ring = rings; ring >= 1; ring--) {
        const travel = ((ring / rings + phase * 0.08) % 1);
        const perspective = travel * travel;
        const radius = 8 + perspective * maxRadius;
        const alpha = (0.03 + perspective * 0.13) * opacity;
        const cells = Math.max(1, Math.round(2 + travel * 5));
        const unit = radius * 2 / cells;
        context.strokeStyle = accent;
        context.globalAlpha = alpha;
        context.lineWidth = Math.max(0.5, perspective * 1.2);
        for (let x = -cells; x <= cells; x++) {
          for (let y = -cells; y <= cells; y++) {
            const edge = Math.max(Math.abs(x), Math.abs(y));
            if (edge !== cells) continue;
            const px = horizonX + x * unit;
            const py = horizonY + y * unit;
            const cell = Math.max(2, unit * 0.42);
            if (px + cell < 0 || px > width || py + cell < 0 || py > height) continue;
            context.strokeRect(px - cell / 2, py - cell / 2, cell, cell);
          }
        }
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = "destination-over";
      context.fillStyle = bg;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
    };
    const onVisibility = () => {
      if (!document.hidden && !frame) frame = requestAnimationFrame(draw);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    frame = requestAnimationFrame(draw);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [accentColor, color, depth, mouseInteraction, opacity, speed, zoom]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`acid-squares ${className}`} />;
}
