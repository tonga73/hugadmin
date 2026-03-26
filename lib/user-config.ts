import prisma from "./prisma";
import type { Prisma } from "@/app/generated/prisma/client";
type UserViewConfig = Prisma.UserViewConfigGetPayload<Record<string, never>>;

export type { UserViewConfig };

export async function getUserViewConfig(email: string): Promise<UserViewConfig | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { viewConfig: true },
  });
  if (!user) return null;

  if (!user.viewConfig) {
    return prisma.userViewConfig.create({
      data: { userId: user.id },
    });
  }

  return user.viewConfig;
}

export async function getUserViewConfigById(userId: number): Promise<UserViewConfig | null> {
  const config = await prisma.userViewConfig.findUnique({ where: { userId } });
  if (config) return config;
  return prisma.userViewConfig.create({ data: { userId } });
}

export async function getUserRole(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  return user?.role ?? null;
}

// Priority order for minPriority filtering
export const PRIORITY_ORDER = ["NULA", "BAJA", "MEDIA", "ALTA", "URGENTE", "INACTIVO"] as const;

export function getPrioritiesAboveMin(minPriority: string): string[] {
  const idx = PRIORITY_ORDER.indexOf(minPriority as (typeof PRIORITY_ORDER)[number]);
  if (idx === -1) return [];
  return PRIORITY_ORDER.slice(idx) as unknown as string[];
}
