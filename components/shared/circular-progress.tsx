"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  renderLabel?: (progress: number) => number | string;
  size?: number;
  strokeWidth?: number;
  circleStrokeWidth?: number;
  progressStrokeWidth?: number;
  shape?: "square" | "round";
  className?: string;
  progressClassName?: string;
  labelClassName?: string;
  showLabel?: boolean;
}

const CircularProgressItem = ({
  value,
  renderLabel,
  className,
  progressClassName,
  labelClassName,
  showLabel,
  shape = "round",
  size = 100,
  strokeWidth,
  circleStrokeWidth = 10,
  progressStrokeWidth = 10,
}: CircularProgressProps) => {
  const radius = size / 2 - 10;
  const circumference = Math.ceil(3.14 * radius * 2);
  const percentage = Math.ceil(circumference * ((100 - value) / 100));

  const viewBox = `-${size * 0.125} -${size * 0.125} ${size * 1.25} ${
    size * 1.25
  }`;

  return (
    <div className="relative">
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: "rotate(-90deg)" }}
        className="relative"
      >
        {/* Base Circle */}
        <motion.circle
          r={radius}
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          strokeWidth={strokeWidth ?? circleStrokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={0}
          className={cn("stroke-primary/25", className)}
        />

        {/* Progress Animated */}
        <motion.circle
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeWidth={strokeWidth ?? progressStrokeWidth}
          strokeLinecap={shape}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference} // empieza vacío
          className={cn("stroke-primary", progressClassName)}
          animate={{ strokeDashoffset: percentage }} // animación hasta porcentaje
          transition={{ duration: 1, ease: "easeOut" }} // control de la duración
        />
      </svg>

      {showLabel && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center text-md",
            labelClassName
          )}
        >
          {renderLabel ? renderLabel(value) : value}
        </div>
      )}
    </div>
  );
};

export function CircularProgress({
  size,
  strokeWidth,
  labelClassName,
  progress,
  className,
  progressClassName,
}: {
  size?: number;
  strokeWidth?: number;
  labelClassName?: string;
  progress: number;
  className?: string;
  progressClassName?: string;
}) {
  return (
    <div className="max-w-xs mx-auto w-full flex flex-col items-center">
      <div className="flex items-center gap-1">
        <CircularProgressItem
          value={progress}
          size={size ?? 120}
          strokeWidth={strokeWidth ?? 10}
          showLabel
          labelClassName={`font-bold ${labelClassName || " text-xl"}`}
          renderLabel={(progress) => `${progress}%`}
          className={`stroke-indigo-500/25 ${className}`}
          progressClassName={progressClassName || " stroke-indigo-600"}
        />
      </div>
    </div>
  );
}
