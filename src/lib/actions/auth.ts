"use server";

import { redirect } from "next/navigation";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "@/lib/db";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyCurrentSession, getCurrentSession } from "@/lib/auth/session";
import { issueVerificationToken, consumeVerificationToken } from "@/lib/auth/tokens";
import { sendEmail, verificationEmailContent, passwordResetEmailContent } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp, getRequestUserAgent } from "@/lib/request";
import { getAppUrl } from "@/lib/app-url";
import { safeNextPath } from "@/lib/auth/redirect";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import type { ActionState } from "./types";

function fieldErrorsFromZod(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = (await getRequestIp()) ?? "unknown";
  const rate = checkRateLimit(`register:${ip}`, 5, 60 * 60);
  if (!rate.allowed) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }
  const { email, displayName, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const [existingEmail, existingDisplayName] = await Promise.all([
    prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } }),
    prisma.playerProfile.findUnique({ where: { displayName }, select: { id: true } }),
  ]);
  if (existingEmail) {
    return {
      status: "error",
      fieldErrors: { email: ["An account with this email already exists."] },
    };
  }
  if (existingDisplayName) {
    return {
      status: "error",
      fieldErrors: { displayName: ["That display name is already taken."] },
    };
  }

  const passwordHash = await hashPassword(password);

  let userId: string;
  try {
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        profile: { create: { displayName } },
        gameLink: { create: {} },
      },
      select: { id: true },
    });
    userId = user.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "error", message: "An account with these details already exists." };
    }
    throw error;
  }

  const token = await issueVerificationToken(userId, "EMAIL_VERIFICATION");
  const verifyUrl = `${getAppUrl()}/verify-email/${token}`;
  await sendEmail({ to: normalizedEmail, ...verificationEmailContent(verifyUrl) }).catch((error) => {
    console.error("Failed to send verification email:", error);
  });

  await createSession(userId, {
    ipAddress: ip,
    userAgent: await getRequestUserAgent(),
  });

  redirect("/dashboard?welcome=1");
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = (await getRequestIp()) ?? "unknown";
  const emailRaw = String(formData.get("email") ?? "").toLowerCase();
  const rate = checkRateLimit(`login:${ip}:${emailRaw}`, 8, 15 * 60);
  if (!rate.allowed) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }
  const normalizedEmail = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, passwordHash: true },
  });

  // Always run the compare, even when there's no real hash to check
  // against, so a Google-only account and a nonexistent email take the
  // same amount of time to reject as a wrong password would.
  const passwordValid = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (user && !user.passwordHash) {
    return {
      status: "error",
      message:
        "This account signs in with Google. Use the Google button below, or set a password from your account security page after signing in.",
    };
  }

  if (!user || !passwordValid) {
    return { status: "error", message: "Invalid email or password." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id, {
    ipAddress: ip,
    userAgent: await getRequestUserAgent(),
  });

  const nextValue = formData.get("next");
  redirect(safeNextPath(typeof nextValue === "string" ? nextValue : null));
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/");
}

export async function forgotPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = (await getRequestIp()) ?? "unknown";
  const emailRaw = String(formData.get("email") ?? "").toLowerCase();
  const rate = checkRateLimit(`forgot-password:${ip}:${emailRaw}`, 5, 60 * 60);

  const genericSuccess: ActionState = {
    status: "success",
    message: "If an account exists for that email, we've sent a password reset link.",
  };

  if (!rate.allowed) {
    // Return the same generic message even when rate-limited, so the
    // response never distinguishes "unknown email" from "too many
    // requests" for a known one.
    return genericSuccess;
  }

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true, email: true },
  });

  if (user) {
    const token = await issueVerificationToken(user.id, "PASSWORD_RESET");
    const resetUrl = `${getAppUrl()}/reset-password/${token}`;
    await sendEmail({ to: user.email, ...passwordResetEmailContent(resetUrl) }).catch((error) => {
      console.error("Failed to send password reset email:", error);
    });
  }

  return genericSuccess;
}

export async function verifyEmailAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  if (!token) {
    return { status: "error", message: "This verification link is invalid." };
  }

  const result = await consumeVerificationToken(token, "EMAIL_VERIFICATION");
  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "This verification link has expired. Request a new one from your account security page."
        : "This verification link is invalid or has already been used.";
    return { status: "error", message };
  }

  await prisma.user.update({
    where: { id: result.userId },
    data: { emailVerified: new Date() },
  });

  return { status: "success", message: "Email verified. Thanks!" };
}

// Takes no caller-supplied identity — every exported function in a
// "use server" file is a directly client-callable RPC, so this derives
// "who" entirely from the validated session cookie rather than trusting
// any userId/email a caller might pass in.
export async function resendVerificationEmailAction(): Promise<ActionState> {
  const auth = await getCurrentSession();
  if (!auth) {
    return { status: "error", message: "You must be logged in to do that." };
  }
  if (auth.user.emailVerified) {
    return { status: "success", message: "Your email is already verified." };
  }

  const rate = checkRateLimit(`resend-verify:${auth.user.id}`, 3, 60 * 60);
  if (!rate.allowed) {
    return { status: "error", message: "Too many requests. Please try again later." };
  }

  const token = await issueVerificationToken(auth.user.id, "EMAIL_VERIFICATION");
  const verifyUrl = `${getAppUrl()}/verify-email/${token}`;
  await sendEmail({ to: auth.user.email, ...verificationEmailContent(verifyUrl) });

  return { status: "success", message: "Verification email sent — check your inbox." };
}

export async function resetPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const result = await consumeVerificationToken(parsed.data.token, "PASSWORD_RESET");
  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "This reset link has expired. Request a new one."
        : "This reset link is invalid or has already been used.";
    return { status: "error", message };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: result.userId }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId: result.userId } }),
    // Signs the game out too — a password reset should mean "every place
    // this account was signed in stops working," not just the browser.
    prisma.gameSession.deleteMany({ where: { userId: result.userId } }),
  ]);

  redirect("/login?reset=success");
}
