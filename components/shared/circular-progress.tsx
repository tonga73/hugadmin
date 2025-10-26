"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CircularProgressProps {
  color: string;
  count: number;
  description: string;
  title: string;
  progress: number;
  strokeColor?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  color,
  count,
  description,
  title,
  progress,
  strokeColor,
}) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div className="relative">
            <svg width="200" height="200" className="transform -rotate-90">
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke="#e5e7eb"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke={strokeColor ?? color}
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold" style={{ color: color }}>
                  {count}
                </div>
                <div className="text-xl text-slate-500 mt-1">{progress}%</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
