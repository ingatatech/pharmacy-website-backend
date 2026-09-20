import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { CreateLocationInput, UpdateLocationInput } from "../validators/location.validator";

// Prisma requires the Prisma.JsonNull sentinel (not plain `null`) to store an
// actual JSON null in a nullable Json column, so translate the validated
// input's `null` into it here, at the Prisma boundary.
function toJsonInput(openingHours: CreateLocationInput["openingHours"]) {
  if (openingHours === null) {
    return Prisma.JsonNull;
  }
  return openingHours;
}

export async function findActive() {
  return prisma.pharmacyLocation.findMany({ where: { isActive: true } });
}

export async function create(data: CreateLocationInput) {
  return prisma.pharmacyLocation.create({
    data: { ...data, openingHours: toJsonInput(data.openingHours) },
  });
}

export async function update(id: string, data: UpdateLocationInput) {
  return prisma.pharmacyLocation.update({
    where: { id },
    data: { ...data, openingHours: toJsonInput(data.openingHours) },
  });
}

export async function remove(id: string) {
  return prisma.pharmacyLocation.delete({ where: { id } });
}
