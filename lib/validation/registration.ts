import { z } from 'zod';

export const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.'),
  email: z
    .string()
    .trim()
    .lowercase()
    .email('Please enter a valid email address.'),
  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 10, 'Phone number must be exactly 10 digits.'),
  college: z
    .string()
    .trim()
    .min(1, 'College is required.'),
  department: z
    .string()
    .trim()
    .min(1, 'Department is required.'),
  yearOfStudy: z
    .string()
    .trim()
    .min(1, 'Year of study is required.'),
  classGroup: z
    .string()
    .trim()
    .min(1, 'Class is required.'),
  isteId: z.string().trim().optional(),
  eventId: z.string().trim().min(1, 'Event ID is required.'),
  registrationId: z.string().trim().optional(),
});

export const paymentConfirmationSchema = z.object({
  registrationId: z
    .string()
    .trim()
    .min(1, 'Registration ID is required.'),
  utrNumber: z
    .string()
    .trim()
    .min(4, 'Please enter a valid UPI Transaction / UTR number.'),
});

export const lookupSchema = z.object({
  email: z
    .string()
    .trim()
    .lowercase()
    .email('Please enter a valid email address.'),
  eventId: z
    .string()
    .trim()
    .min(1, 'Event ID is required.'),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type PaymentConfirmationInput = z.infer<typeof paymentConfirmationSchema>;
export type LookupInput = z.infer<typeof lookupSchema>;
