import {
  authTokens,
  boxes,
  refreshTokens,
  users,
  type User,
} from "@enredex/database";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { DbOrTx } from "../../lib/db.js";
import { errors } from "../../lib/errors.js";
import { hashPassword, verifyPassword } from "../../lib/passwords.js";
import { generateToken, hashToken } from "../../lib/tokens.js";
import type { LoginBody, RegisterBody } from "./schemas.js";

export const REFRESH_COOKIE = "enredex_rt";

export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    homePlan: user.homePlan,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
}

/** Creates an access token + opaque refresh token (stored hashed, set as cookie). */
export async function issueSession(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  user: User,
) {
  const accessToken = app.jwt.sign(
    { sub: user.id },
    { expiresIn: app.config.ACCESS_TOKEN_TTL },
  );
  const refreshToken = generateToken();
  const days = app.config.REFRESH_TOKEN_TTL_DAYS;

  await app.db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    userAgent: request.headers["user-agent"] ?? null,
    ip: request.ip,
    expiresAt: new Date(Date.now() + days * 86_400_000),
  });

  reply.setCookie(REFRESH_COOKIE, refreshToken, {
    path: "/api/auth",
    httpOnly: true,
    sameSite: "lax",
    secure: app.config.NODE_ENV === "production",
    maxAge: days * 86_400,
  });

  return { accessToken };
}

async function sendEmailVerification(app: FastifyInstance, user: User) {
  const token = generateToken();
  await app.db.insert(authTokens).values({
    userId: user.id,
    type: "email-verification",
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 24 * 3_600_000),
  });
  const link = `${app.config.WEB_URL}/verify-email?token=${token}`;
  try {
    await app.mailer.send({
      to: user.email,
      subject: "Verify your Enredex email",
      text: `Hi ${user.name},\n\nConfirm your email address:\n${link}\n\nThis link expires in 24 hours.`,
    });
  } catch (err) {
    app.log.error(err, "failed to send verification email");
  }
}

export async function register(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  input: RegisterBody,
) {
  const existing = await app.db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, input.email.toLowerCase()),
  });
  if (existing) throw errors.conflict("Email is already registered");

  const passwordHash = await hashPassword(input.password);
  const user = await app.db.transaction(async (tx) => {
    const [created] = await tx
      .insert(users)
      .values({
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
      })
      .returning();
    // Every account starts with the free-plan default box
    await tx.insert(boxes).values({
      userId: created!.id,
      name: "Box 1",
      position: 1,
    });
    return created!;
  });

  await sendEmailVerification(app, user);
  const session = await issueSession(app, request, reply, user);
  return { user: publicUser(user), ...session };
}

export async function login(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  input: LoginBody,
) {
  const user = await app.db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, input.email.toLowerCase()),
  });
  // Generic message to avoid user enumeration
  if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
    throw errors.unauthorized("Invalid email or password");
  }
  const session = await issueSession(app, request, reply, user);
  return { user: publicUser(user), ...session };
}

function extractRefreshToken(
  request: FastifyRequest,
  bodyToken?: string,
): string {
  const token = request.cookies[REFRESH_COOKIE] ?? bodyToken;
  if (!token) throw errors.unauthorized("Missing refresh token");
  return token;
}

export async function refresh(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  bodyToken?: string,
) {
  const token = extractRefreshToken(request, bodyToken);
  const row = await app.db.query.refreshTokens.findFirst({
    where: (t, { eq }) => eq(t.tokenHash, hashToken(token)),
  });
  if (!row) throw errors.unauthorized("Invalid refresh token");

  if (row.revokedAt) {
    // Reuse of a rotated token: possible theft — revoke the whole session family
    await app.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(refreshTokens.userId, row.userId), isNull(refreshTokens.revokedAt)),
      );
    throw errors.unauthorized("Refresh token reuse detected");
  }
  if (row.expiresAt.getTime() < Date.now()) {
    throw errors.unauthorized("Refresh token expired");
  }

  const user = await app.db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, row.userId),
  });
  if (!user) throw errors.unauthorized("Invalid refresh token");

  // Rotate: revoke old, issue new
  await app.db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, row.id));

  const session = await issueSession(app, request, reply, user);
  return { user: publicUser(user), ...session };
}

export async function logout(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  bodyToken?: string,
) {
  const token = request.cookies[REFRESH_COOKIE] ?? bodyToken;
  if (token) {
    await app.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, hashToken(token)));
  }
  reply.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
}

export async function forgotPassword(app: FastifyInstance, email: string) {
  const user = await app.db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email.toLowerCase()),
  });
  // Always succeed to avoid leaking registered emails
  if (!user) return;

  const token = generateToken();
  await app.db.insert(authTokens).values({
    userId: user.id,
    type: "password-reset",
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 3_600_000),
  });
  const link = `${app.config.WEB_URL}/reset-password?token=${token}`;
  try {
    await app.mailer.send({
      to: user.email,
      subject: "Reset your Enredex password",
      text: `Hi ${user.name},\n\nReset your password:\n${link}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    });
  } catch (err) {
    app.log.error(err, "failed to send reset email");
  }
}

async function consumeAuthToken(
  db: DbOrTx,
  token: string,
  type: "email-verification" | "password-reset",
) {
  const row = await db.query.authTokens.findFirst({
    where: (t, { and, eq, gt, isNull }) =>
      and(
        eq(t.tokenHash, hashToken(token)),
        eq(t.type, type),
        isNull(t.consumedAt),
        gt(t.expiresAt, new Date()),
      ),
  });
  if (!row) throw errors.badRequest("Invalid or expired token");
  await db
    .update(authTokens)
    .set({ consumedAt: new Date() })
    .where(eq(authTokens.id, row.id));
  return row;
}

export async function resetPassword(
  app: FastifyInstance,
  token: string,
  password: string,
) {
  const tokenRow = await consumeAuthToken(app.db, token, "password-reset");
  const passwordHash = await hashPassword(password);
  await app.db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, tokenRow.userId));
  // Invalidate all existing sessions
  await app.db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshTokens.userId, tokenRow.userId),
        isNull(refreshTokens.revokedAt),
      ),
    );
}

export async function verifyEmail(app: FastifyInstance, token: string) {
  const tokenRow = await consumeAuthToken(app.db, token, "email-verification");
  await app.db
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, tokenRow.userId));
}
