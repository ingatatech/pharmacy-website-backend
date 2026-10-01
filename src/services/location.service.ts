import { repo } from "../db/data-source";
import { PharmacyLocation } from "../db/entities";
import { deleteOrFail, updateOrFail } from "../db/errors";
import {
  CreateLocationInput,
  UpdateLocationInput,
} from "../validators/location.validator";

export async function findActive() {
  return repo(PharmacyLocation).find({ where: { isActive: true } });
}

// Unfiltered — includes inactive branches — for the admin dashboard.
export async function findAll() {
  return repo(PharmacyLocation).find({ order: { branchName: "ASC" } });
}

export async function create(data: CreateLocationInput) {
  const repository = repo(PharmacyLocation);
  return repository.save(repository.create(data));
}

export async function update(id: string, data: UpdateLocationInput) {
  return updateOrFail(repo(PharmacyLocation), id, data);
}

export async function remove(id: string) {
  await deleteOrFail(repo(PharmacyLocation), id);
}