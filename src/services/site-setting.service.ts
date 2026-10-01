import { repo } from "../db/data-source";
import { SiteSetting } from "../db/entities";
import { updateOrFail } from "../db/errors";
import { UpdateSiteSettingInput } from "../validators/site-setting.validator";

// Site settings are a single conceptual row. The oldest row wins, matching
// Prisma's unordered findFirst on the seeded single row.
export async function get() {
  return repo(SiteSetting).findOne({ where: {}, order: { id: "ASC" } });
}

export async function upsert(data: UpdateSiteSettingInput) {
  const repository = repo(SiteSetting);
  const existing = await repository.findOne({ where: {}, order: { id: "ASC" } });

  if (existing) {
    return updateOrFail(repository, existing.id, data);
  }

  return repository.save(repository.create(data));
}