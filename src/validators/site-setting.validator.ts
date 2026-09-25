import { z } from "zod";
import { optionalNullableString } from "./common.validator";

export const updateSiteSettingSchema = z
  .object({
    pharmacyName: optionalNullableString,
    aboutUs: optionalNullableString,
    mission: optionalNullableString,
    vision: optionalNullableString,
    companyHistory: optionalNullableString,
    coreValues: z.array(z.string().trim().min(1)).optional(),
    whyChooseUs: optionalNullableString,
    heroHeadline: optionalNullableString,
    heroSubheading: optionalNullableString,
    phone: optionalNullableString,
    email: z.email().nullable().optional(),
    address: optionalNullableString,
    facebookUrl: optionalNullableString,
    instagramUrl: optionalNullableString,
    linkedinUrl: optionalNullableString,
    xUrl: optionalNullableString,
    whatsappUrl: optionalNullableString,
    youtubeUrl: optionalNullableString,
    announcementMessage: optionalNullableString,
    announcementActive: z.boolean().optional(),
  })
  .strict();

export type UpdateSiteSettingInput = z.infer<typeof updateSiteSettingSchema>;
