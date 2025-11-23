"use client";
import { cn } from "@/lib/utils";

interface PCSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function PCSection({ children, className }: PCSectionProps) {
  return (
    <section className={cn("w-full max-w-4xl mx-auto px-6 py-10", className)}>
      {children}
    </section>
  );
}




