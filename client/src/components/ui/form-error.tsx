import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export function FormError({
  id,
  error,
  className,
}: {
  id?: string;
  error?: string;
  className?: string;
}) {
  if (!error) return null;

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={cn(
        "text-sm text-destructive flex items-start gap-1.5 mt-1.5",
        className
      )}
    >
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{error}</span>
    </p>
  );
}
