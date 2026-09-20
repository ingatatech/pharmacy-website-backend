import bcrypt from "bcrypt";
import { prisma } from "../prisma";
import { signToken } from "../utils/jwt";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    omit: { passwordHash: false },
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
  return prisma.user.findUnique({ where: { id } });
}
