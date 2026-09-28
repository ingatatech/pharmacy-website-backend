import bcrypt from "bcrypt";
import { prisma } from "../prisma";
import { signToken } from "../utils/jwt";
import * as userService from "./user.service";
import { RegisterInput } from "../validators/auth.validator";

export async function register(input: RegisterInput) {
  // Role is hardcoded here, not read from `input` — registerSchema doesn't
  // even accept a "role" field, and this is the one and only place a
  // "customer" account gets created, so it can never be anything else.
  const user = await userService.create({ ...input, role: "customer" });
  const token = signToken(user.id, user.role);
  return { token, user };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    // passwordHash is re-included here purely so bcrypt.compare can run; it is
    // never sent to a client, because toPublicUser() in the controller
    // whitelists the fields it returns rather than passing the row through.
    omit: { passwordHash: false },
    include: { location: { select: { id: true, branchName: true, slug: true } } },
  });

  if (!user) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return null;
  }

  const token = signToken(user.id, user.role);
  return { token, user };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { location: { select: { id: true, branchName: true, slug: true } } },
  });
}
