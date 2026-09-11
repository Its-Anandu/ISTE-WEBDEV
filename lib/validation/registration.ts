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
    .min(1, 'College or Department is required.'),
  yearOfStudy: z.enum(['1st', '2nd', '3rd', '4th'], {
    message: 'Please select a valid year of study (1st, 2nd, 3rd, 4th).',
  }),
  isteId: z.string().trim().optional(),
  eventId: z.string().trim().min(1, 'Event ID is required.'),
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
