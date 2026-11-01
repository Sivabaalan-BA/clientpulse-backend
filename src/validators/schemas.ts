import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['business_admin', 'employee', 'client', 'super_admin']).default('business_admin'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters').optional(),
});

export const createEnquirySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  budgetRange: z.string().optional().default('Flexible'),
  source: z.enum(['website', 'referral', 'linkedin', 'direct', 'other']).default('website'),
});

export const createClientSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  primaryContactName: z.string().min(2, 'Contact person name is required'),
  primaryEmail: z.string().email('Valid email is required'),
  phone: z.string().optional().default(''),
  status: z.enum(['lead', 'active', 'inactive', 'churned']).default('active'),
});

export const quotationItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().min(1).default(1),
  unitPrice: z.number().min(0).default(0),
});

export const createQuotationSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  title: z.string().min(3, 'Proposal title is required'),
  items: z.array(quotationItemSchema).min(1, 'At least one line item is required'),
  discountPercent: z.number().min(0).max(100).default(0),
  taxPercent: z.number().min(0).max(100).default(0),
  validUntil: z.string().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export const createFeedbackSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  rating: z.number().min(1).max(5),
  comment: z.string().min(3, 'Feedback comment must be at least 3 characters'),
});
