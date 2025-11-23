"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PCCardProps {
  children: React.ReactNode;
  className?: string;
}

export function PCCard({ children, className }: PCCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "bg-pc-white shadow-pc rounded-pc-lg p-6 border border-pc-tan/20",
        className
      )}
    >
      {children}
    </motion.div>
  );
}




