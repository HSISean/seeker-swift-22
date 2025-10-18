import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  jobTitle: z
    .string()
    .min(2, 'Job title must be at least 2 characters')
    .max(100, 'Job title must not exceed 100 characters'),
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(200, 'Location must not exceed 200 characters'),
  salaryMin: z
    .string()
    .optional()
    .refine(
      (val) => !val || (parseInt(val) >= 0 && parseInt(val) <= 10000000),
      'Minimum salary must be between 0 and 10,000,000'
    ),
  salaryMax: z
    .string()
    .optional()
    .refine(
      (val) => !val || (parseInt(val) >= 0 && parseInt(val) <= 10000000),
      'Maximum salary must be between 0 and 10,000,000'
    ),
}).refine(
  (data) => {
    if (data.salaryMin && data.salaryMax) {
      return parseInt(data.salaryMin) <= parseInt(data.salaryMax);
    }
    return true;
  },
  {
    message: 'Minimum salary must be less than or equal to maximum salary',
    path: ['salaryMax'],
  }
);

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  jobTitle: z
    .string()
    .min(2, 'Job title must be at least 2 characters')
    .max(100, 'Job title must not exceed 100 characters'),
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(200, 'Location must not exceed 200 characters'),
  salaryMin: z
    .number()
    .min(0, 'Minimum salary must be at least 0')
    .max(10000000, 'Minimum salary must not exceed 10,000,000')
    .optional(),
  salaryMax: z
    .number()
    .min(0, 'Maximum salary must be at least 0')
    .max(10000000, 'Maximum salary must not exceed 10,000,000')
    .optional(),
}).refine(
  (data) => {
    if (data.salaryMin && data.salaryMax) {
      return data.salaryMin <= data.salaryMax;
    }
    return true;
  },
  {
    message: 'Minimum salary must be less than or equal to maximum salary',
    path: ['salaryMax'],
  }
);

export const resumeFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 10 * 1024 * 1024, 'Resume file must be less than 10MB')
  .refine(
    (file) =>
      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(
        file.type
      ),
    'Resume must be a PDF, DOC, or DOCX file'
  );
