import zod from "zod";

export const subjectCreateSchema = zod.object({
  name: zod
    .string("Name is required")
    .trim()
    .min(1, "Name cannot be empty")
    .max(255, "Name must be at most 255 characters long"),
  instaHandle: zod
    .string()
    .trim()
    .regex(/^@\S+$/, "Instagram handle must start with @ and contain no spaces")
    .optional(),
  email: zod
    .string()
    .trim()
    .email("Email must be a valid email address")
    .optional(),
  phone_number: zod
    .string()
    .trim()
    .max(50, "Phone number must be at most 50 characters long")
    .optional(),
  city: zod
    .string()
    .trim()
    .max(255, "City must be at most 255 characters long")
    .optional(),
  country: zod
    .string()
    .trim()
    .max(255, "Country must be at most 255 characters long")
    .optional(),
  portfolio_url: zod
    .url("Portfolio URL must be a valid URL")
    .optional(),
});

export const subjectUpdateSchema = subjectCreateSchema.partial();
