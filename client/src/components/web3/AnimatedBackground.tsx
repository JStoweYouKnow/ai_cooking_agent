"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps {
  variant?: "gradient" | "particles" | "mesh";
  intensity?: "low" | "medium" | "high";
  className?: string;
}

export function AnimatedBackground({
  variant = "gradient",
  intensity = "medium",
  className,
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (variant !== "particles" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || !canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle system
    const particleCount = intensity === "low" ? 30 : intensity === "medium" ? 50 : 80;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    // Connection lines
    const maxDistance = 150;

    function animate() {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Keep in bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(102, 126, 234, ${particle.opacity})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach((other) => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            const opacity = (1 - distance / maxDistance) * 0.2;
            ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [variant, intensity]);

  if (variant === "gradient") {
    return (
      <div
        className={cn(
          "fixed inset-0 -z-10 overflow-hidden",
          "bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50",
          "dark:from-purple-950/20 dark:via-blue-950/20 dark:to-cyan-950/20",
          "before:absolute before:inset-0",
          "before:bg-[radial-gradient(circle_at_20%_50%,rgba(102,126,234,0.3),transparent_50%)]",
          "before:bg-[radial-gradient(circle_at_80%_80%,rgba(118,75,162,0.3),transparent_50%)]",
          "before:bg-[radial-gradient(circle_at_40%_20%,rgba(79,172,254,0.2),transparent_50%)]",
          "before:animate-pulse",
          className
        )}
      />
    );
  }

  if (variant === "mesh") {
    return (
      <div
        className={cn(
          "fixed inset-0 -z-10 overflow-hidden",
          "bg-gradient-to-br from-purple-100 via-blue-100 to-cyan-100",
          "dark:from-purple-950/30 dark:via-blue-950/30 dark:to-cyan-950/30",
          "after:absolute after:inset-0",
          "after:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDExOCwgNzUsIDE2MiwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]",
          "after:opacity-20 dark:after:opacity-10",
          "after:animate-[mesh_20s_linear_infinite]",
          className
        )}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn("fixed inset-0 -z-10 pointer-events-none", className)}
    />
  );
}

