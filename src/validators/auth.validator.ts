import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.email("A valid email address is required."),
    password: z.string().min(1, "Password is required."),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
