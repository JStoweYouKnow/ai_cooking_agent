"use client";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "onDrag" | "onDragStart" | "onDragEnd"> {
  hover?: boolean;
  glow?: boolean;
  gradient?: "primary" | "secondary" | "accent" | "none";
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = true, glow = false, gradient = "none", children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "relative rounded-xl overflow-hidden",
          "glass dark:glass-dark",
          gradient === "primary" && "gradient-border",
          glow && "glow-effect",
          hover && "hover-lift",
          className
        )}
        {...props}
      >
        {gradient !== "none" && (
          <div
            className={cn(
              "absolute inset-0 opacity-10",
              gradient === "primary" && "gradient-bg-primary",
              gradient === "secondary" && "gradient-bg-secondary",
              gradient === "accent" && "gradient-bg-accent"
            )}
          />
        )}
        <div className="relative z-10">{children as ReactNode}</div>
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

