import bcrypt from "bcrypt";
import { repo } from "../db/data-source";
import { User } from "../db/entities";
import { signToken } from "../utils/jwt";
import { RegisterInput } from "../validators/auth.validator";
import * as userService from "./user.service";
import { USER_READ, USER_SELECT } from "./user.service";

export async function register(input: RegisterInput) {
  // Role is hardcoded here, not read from `input` — registerSchema doesn't
  // even accept a "role" field, and this is the one and only place a
  // "customer" account gets created, so it can never be anything else.
  const user = await userService.create({ ...input, role: "customer" });
  const token = signToken(user.id, user.role);
  return { token, user };
}

export async function login(email: string, password: string) {
  const user = await repo(User).findOne({
    where: { email },
    // passwordHash has `select: false` on the entity, so it has to be asked for
    // explicitly here — the only place that legitimately needs it, purely so
    // bcrypt.compare can run. It never reaches a client: toPublicUser() in the
    // controller whitelists the fields it returns.
    select: { ...USER_SELECT, passwordHash: true },
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
  return repo(User).findOne({ ...USER_READ, where: { id } });
}