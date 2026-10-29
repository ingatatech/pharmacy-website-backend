import { z } from "zod";
import { optionalNullableString } from "./common.validator";

// "HH:MM" in 24-hour time. Stored verbatim so the client renders what was set.
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const baseShiftSchema = z
  .object({
    teamMemberId: z.uuid(),
    locationId: z.uuid(),
    // 0 = Sunday … 6 = Saturday, matching JavaScript's Date#getDay().
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(TIME_PATTERN, "Use HH:MM (24-hour)."),
    endTime: z.string().regex(TIME_PATTERN, "Use HH:MM (24-hour)."),
    note: optionalNullableString,
    isActive: z.boolean().optional(),
  })
  .strict();

export const createPharmacistShiftSchema = baseShiftSchema.refine(
  (data) => data.startTime < data.endTime,
  { message: "End time must be after start time.", path: ["endTime"] },
);

// Partial update: the refine cannot run on a patch that only changes one of the
// two times, so the ordering check is applied by the form and by the database's
// CHK_pharmacist_shift_time constraint instead.
export const updatePharmacistShiftSchema = baseShiftSchema.partial();

export type CreatePharmacistShiftInput = z.infer<typeof createPharmacistShiftSchema>;
export type UpdatePharmacistShiftInput = z.infer<typeof updatePharmacistShiftSchema>;
