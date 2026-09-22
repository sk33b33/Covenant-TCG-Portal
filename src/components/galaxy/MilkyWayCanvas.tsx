"use client";

import { useEffect, useMemo, useRef } from "react";
import { generateGalaxyStarField, type Star } from "@/lib/galaxy/generate-star-field";
import { milkyWay } from "@/lib/galaxy/milky-way-data";

function drawStar(ctx: CanvasRenderingContext2D, star: Star, cx: number, cy: number, scale: number) {
  const px = cx + star.x * scale;
  const py = cy + star.y * scale;
  const radius = Math.max(0.35, star.size * (scale / 900));

  ctx.beginPath();
  ctx.fillStyle = star.color;
  ctx.globalAlpha = star.alpha;
  ctx.arc(px, py, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function MilkyWayCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const field = useMemo(() => generateGalaxyStarField(milkyWay), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = canvas.parentElement;
    if (!container) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientWidth * 0.72;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = "#05060a";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) / 2;

      // Soft galactic core glow beneath everything.
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.16);
      glow.addColorStop(0, "rgba(255, 244, 214, 0.35)");
      glow.addColorStop(1, "rgba(255, 244, 214, 0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      for (const star of field.halo) drawStar(ctx, star, cx, cy, scale);
      for (const arm of field.arms) {
        for (const star of arm.stars) drawStar(ctx, star, cx, cy, scale);
      }
      for (const star of field.core) drawStar(ctx, star, cx, cy, scale);

      // Mark the Sun's position on its home spur.
      const sunX = cx + field.sun.x * scale;
      const sunY = cy + field.sun.y * scale;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.fillStyle = "#fff9e6";
      ctx.arc(sunX, sunY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 249, 230, 0.7)";
      ctx.lineWidth = 1;
      ctx.arc(sunX, sunY, 7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 1;
    };

    render();

    const resizeObserver = new ResizeObserver(() => render());
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [field]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="block w-full rounded-lg" role="img" aria-label="Top-down visualization of the Milky Way galaxy's spiral arms" />
    </div>
  );
}
