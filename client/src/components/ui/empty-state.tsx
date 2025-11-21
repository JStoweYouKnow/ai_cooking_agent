"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Enhanced empty state component with animation and visual polish
 * Shows when lists/tables have no data
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: "easeOut",
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.3 },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4",
        className
      )}
    >
      {/* Decorative background circle */}
      <motion.div
        variants={itemVariants}
        className="relative mb-8"
      >
        <div className="absolute inset-0 bg-pc-tan/30 dark:bg-pc-olive/20 rounded-full blur-3xl opacity-60" />
        <div className="relative bg-gradient-to-br from-pc-tan/30 to-pc-olive/20 dark:from-pc-olive/10 dark:to-pc-navy/10 p-10 rounded-full">
          <Icon className="h-24 w-24 text-pc-olive dark:text-pc-olive" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        className="text-2xl md:text-3xl font-bold text-pc-text dark:text-white mb-4"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        variants={itemVariants}
        className="text-pc-text-light dark:text-pc-text-light max-w-md text-base md:text-lg mb-8 leading-relaxed"
      >
        {description}
      </motion.p>

      {/* Action button */}
      {action && (
        <motion.div variants={itemVariants}>
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
