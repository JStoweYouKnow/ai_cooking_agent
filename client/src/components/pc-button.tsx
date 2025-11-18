"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface PCButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  children: React.ReactNode;
  className?: string;
}

export function PCButton({ children, className, ...props }: PCButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "px-5 py-3 rounded-pc bg-pc-navy text-pc-white shadow-pc font-medium transition-all",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

