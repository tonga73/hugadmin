import prisma from "./prisma";

type ActivityInput = {
  recordId: number;
  userId?: number | null;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
};

export async function logActivity(data: ActivityInput) {
  return prisma.recordActivity.create({ data }).catch(() => null);
}
