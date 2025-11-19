/**
 * Premium UI Components Library
 * Sophisticated, production-ready components for AI Cooking Agent
 */

"use client";
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* ------------------------- Gradient Hero Section ------------------------- */
/* -------------------------------------------------------------------------- */

export function GradientHero({
  title,
  subtitle,
  description,
  action,
  className
}: {
  title: string | React.ReactNode;
  subtitle?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pc-olive/30 to-pc-tan/30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pc-navy/20 to-pc-olive/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

        {/* Dot pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10 py-12 md:py-16 lg:py-24">
        {subtitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4"
          >
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-pc-olive/10 to-pc-navy/10 border border-pc-olive/20 text-pc-olive font-semibold text-sm">
              {subtitle}
            </span>
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6"
        >
          {typeof title === 'string' ? (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pc-navy via-pc-olive to-pc-navy">
              {title}
            </span>
          ) : (
            title
          )}
        </motion.h1>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-pc-text-light font-light max-w-3xl mb-8 leading-relaxed"
          >
            {description}
          </motion.p>
        )}

        {action && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {action}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Premium Glass Card ---------------------------- */
/* -------------------------------------------------------------------------- */

export function GlassCard({
  children,
  className,
  hover = true,
  glow = false,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative group", className)} {...props}>
      {/* Glow effect on hover */}
      {glow && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pc-olive via-pc-navy to-pc-olive rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500" />
      )}

      {/* Glass card */}
      <motion.div
        whileHover={hover ? { y: -4 } : undefined}
        transition={{ duration: 0.3 }}
        className={cn(
          "relative bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20",
          "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
          hover && "hover:shadow-[0_20px_48px_rgba(0,0,0,0.12)]",
          "transition-all duration-300"
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Stat Card Component --------------------------- */
/* -------------------------------------------------------------------------- */

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = 'olive',
  className
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: 'olive' | 'navy' | 'tan' | 'orange' | 'blue' | 'purple';
  className?: string;
}) {
  const colorClasses = {
    olive: 'from-emerald-500 to-green-600',
    navy: 'from-blue-600 to-indigo-700',
    tan: 'from-amber-500 to-orange-600',
    orange: 'from-orange-500 to-red-600',
    blue: 'from-cyan-500 to-blue-600',
    purple: 'from-purple-500 to-pink-600',
  };

  return (
    <GlassCard className={className} glow>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br shadow-lg",
            colorClasses[color]
          )}>
            <Icon className="h-6 w-6 text-white" />
          </div>

          {trend && (
            <span className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full",
              trend.positive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            )}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>

        <div>
          <p className="text-sm text-pc-text-light font-medium mb-1">
            {label}
          </p>
          <p className="text-3xl font-black text-pc-navy">
            {value}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Feature Card ---------------------------------- */
/* -------------------------------------------------------------------------- */

export function FeatureCard({
  icon: Icon,
  title,
  description,
  action,
  className
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <GlassCard className={className} glow>
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-pc-olive/10 to-pc-navy/10 border border-pc-olive/20">
            <Icon className="h-8 w-8 text-pc-olive" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-pc-navy mb-3">
          {title}
        </h3>

        <p className="text-pc-text-light leading-relaxed mb-6">
          {description}
        </p>

        {action && <div>{action}</div>}
      </div>
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Section Header -------------------------------- */
/* -------------------------------------------------------------------------- */

export function SectionHeader({
  icon: Icon,
  title,
  description,
  action,
  className
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6 md:mb-8", className)}>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          {Icon && (
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-pc-olive/10 to-pc-navy/10 border border-pc-olive/20">
              <Icon className="h-5 w-5 md:h-6 md:w-6 text-pc-olive" />
            </div>
          )}
          <h2 className="text-3xl md:text-4xl font-black text-pc-navy">
            {title}
          </h2>
        </div>
        {description && (
          <p className="text-base md:text-lg text-pc-text-light ml-12">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Premium Button -------------------------------- */
/* -------------------------------------------------------------------------- */

export function PremiumButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
} & Omit<HTMLMotionProps<"button">, 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>) {
  const variants = {
    primary: "bg-gradient-to-r from-pc-navy to-pc-olive text-white shadow-lg hover:shadow-xl",
    secondary: "bg-gradient-to-r from-pc-tan to-amber-200 text-pc-navy shadow-md hover:shadow-lg",
    outline: "border-2 border-pc-navy/20 hover:border-pc-olive hover:bg-pc-olive/5",
    ghost: "hover:bg-pc-tan/20",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "font-semibold rounded-xl transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-pc-olive/40 focus:ring-offset-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Decorative Blob ------------------------------- */
/* -------------------------------------------------------------------------- */

export function DecorativeBlob({
  color = 'olive',
  position = 'top-right',
  size = 'lg',
  opacity,
  className
}: {
  color?: 'olive' | 'navy' | 'tan';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'sm' | 'md' | 'lg';
  opacity?: number;
  className?: string;
}) {
  const colors = {
    olive: 'from-pc-olive/30 to-pc-tan/30',
    navy: 'from-pc-navy/30 to-pc-olive/30',
    tan: 'from-pc-tan/30 to-amber-200/30',
  };

  const positions = {
    'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
    'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
    'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
  };

  const sizes = {
    sm: 'w-48 h-48',
    md: 'w-72 h-72',
    lg: 'w-96 h-96',
  };

  return (
    <div
      className={cn(
        "absolute rounded-full blur-3xl pointer-events-none",
        "bg-gradient-to-br",
        colors[color],
        positions[position],
        sizes[size],
        className
      )}
      style={opacity !== undefined ? { opacity } : undefined}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Background Pattern ---------------------------- */
/* -------------------------------------------------------------------------- */

export function BackgroundPattern({
  pattern = 'dots',
  opacity,
  className
}: {
  pattern?: 'dots' | 'grid' | 'mesh';
  opacity?: number;
  className?: string;
}) {
  const patterns = {
    dots: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]',
    grid: 'bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]',
    mesh: 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50',
  };

  return (
    <div
      className={cn(
        "absolute inset-0 -z-10",
        patterns[pattern],
        opacity === undefined && "opacity-40",
        className
      )}
      style={opacity !== undefined ? { opacity } : undefined}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Gradient Text --------------------------------- */
/* -------------------------------------------------------------------------- */

export function GradientText({
  children,
  from = 'pc-navy',
  via,
  to = 'pc-olive',
  className
}: {
  children: React.ReactNode;
  from?: string;
  via?: string;
  to?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-transparent bg-clip-text bg-gradient-to-r",
        `from-${from}`,
        via && `via-${via}`,
        `to-${to}`,
        className
      )}
    >
      {children}
    </span>
  );
}
