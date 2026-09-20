import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export async function get() {
  return prisma.siteSetting.findFirst();
}

export async function upsert(data: Prisma.SiteSettingUpdateInput & Prisma.SiteSettingCreateInput) {
  const existing = await prisma.siteSetting.findFirst();

  if (existing) {
    return prisma.siteSetting.update({ where: { id: existing.id }, data });
  }

  return prisma.siteSetting.create({ data });
}
