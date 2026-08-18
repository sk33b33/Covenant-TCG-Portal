import { z } from "zod";

// NIST 800-63B-style policy: prioritize length over forced composition
// rules, which push players toward predictable substitutions instead of
// actually stronger passwords.
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .max(128, "Password must be at most 128 characters.");

export const emailSchema = z.email("Enter a valid email address.").max(254);

export const displayNameSchema = z
  .string()
  .trim()
  .min(3, "Display name must be at least 3 characters.")
  .max(24, "Display name must be at most 24 characters.")
  .regex(
    /^[a-zA-Z0-9 _-]+$/,
    "Display name can only contain letters, numbers, spaces, underscores, and hyphens.",
  );

export const registerSchema = z.object({
  email: emailSchema,
  displayName: displayNameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: passwordSchema,
});

export const updateProfileSchema = z.object({
  displayName: displayNameSchema,
  bio: z.string().trim().max(280, "Bio must be at most 280 characters.").optional(),
});
