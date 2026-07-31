import { z } from "zod";

export const registerBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(255),
  password: z.string().min(8).max(100),
});

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().optional(),
});

export const forgotPasswordBodySchema = z.object({
  email: z.email(),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
});

export const verifyEmailBodySchema = z.object({
  token: z.string().min(1),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
