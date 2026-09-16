import { prisma } from "@/lib/db";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/auth/password";
import { createGameSession } from "@/lib/auth/game-session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request";
import { loginSchema } from "@/lib/validation/auth";
import { corsPreflight, jsonWithCors } from "@/lib/cors";

/**
 * POST /api/game/auth/login
 *
 * The game client's own sign-in — checks the same `User`/`passwordHash`
 * the website's own login does (`loginAction`, `src/lib/actions/auth.ts`),
 * reusing its exact validation, rate-limiting, and constant-time-ish
 * timing precautions rather than a second, less careful copy of the same
 * check. Returns a bearer token (`game-session.ts`) instead of setting a
 * cookie, since this is a different origin calling in, not a form post.
 *
 * Deliberately does not check `emailVerified` — neither does the
 * website's own login, so this doesn't invent a stricter policy the rest
 * of the app doesn't have.
 */
export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors(request, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonWithCors(
      request,
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const normalizedEmail = parsed.data.email.toLowerCase();

  const ip = (await getRequestIp()) ?? "unknown";
  const rate = checkRateLimit(`game-login:${ip}:${normalizedEmail}`, 8, 15 * 60);
  if (!rate.allowed) {
    return jsonWithCors(request, { error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, passwordHash: true },
  });

  // Compared even when `user` is null, against a dummy hash — a login
  // attempt for an email that doesn't exist takes the same time as one
  // for an email that does, so response latency can't leak which.
  const passwordValid = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordValid) {
    return jsonWithCors(request, { error: "Invalid email or password." }, { status: 401 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const { token, expiresAt } = await createGameSession(user.id);

  return jsonWithCors(request, {
    token,
    expiresAt: expiresAt.toISOString(),
    user: { email: user.email },
  });
}
