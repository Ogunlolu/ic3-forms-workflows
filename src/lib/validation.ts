import { z } from 'zod'
import { FieldType, WorkflowType, StageType } from '@prisma/client'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Form schemas
export const createFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
})

export const updateFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
})

export const fieldConfigSchema = z.object({
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  maxSize: z.number().optional(),
  allowedTypes: z.array(z.string()).optional(),
})

export const displayLogicSchema = z.object({
  triggerFieldId: z.string(),
  triggerValue: z.union([z.string(), z.number(), z.boolean()]),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']),
})

export const createFieldSchema = z.object({
  type: z.nativeEnum(FieldType),
  label: z.string().min(1, 'Label is required').max(200, 'Label too long'),
  placeholder: z.string().max(200, 'Placeholder too long').optional(),
  required: z.boolean().default(false),
  order: z.number().int().default(0),
  config: fieldConfigSchema.optional(),
  displayLogic: displayLogicSchema.optional(),
  isPrivate: z.boolean().default(false),
})

export const updateFieldSchema = z.object({
  label: z.string().min(1, 'Label is required').max(200, 'Label too long').optional(),
  placeholder: z.string().max(200, 'Placeholder too long').optional(),
  required: z.boolean().optional(),
  order: z.number().int().optional(),
  config: fieldConfigSchema.optional(),
  displayLogic: displayLogicSchema.optional(),
  isPrivate: z.boolean().optional(),
})

export const reorderFieldsSchema = z.object({
  fieldOrders: z.array(z.object({
    fieldId: z.string(),
    order: z.number().int(),
  })),
})

export const permissionsSchema = z.object({
  permissions: z.object({
    canBuild: z.array(z.string()).optional(),
    canSubmit: z.array(z.string()).optional(),
    canView: z.array(z.string()).optional(),
  }),
})

// Submission schemas
export const createSubmissionSchema = z.object({
  formId: z.string(),
  data: z.record(z.any()),
  submit: z.boolean().default(false),
})

export const updateSubmissionSchema = z.object({
  data: z.record(z.any()).optional(),
  submit: z.boolean().default(false),
})

// Workflow schemas
export const createWorkflowSchema = z.object({
  formId: z.string(),
  type: z.nativeEnum(WorkflowType),
  stages: z.array(z.object({
    order: z.number().int(),
    name: z.string().max(200).optional(),
    type: z.nativeEnum(StageType),
    approverIds: z.array(z.string()).min(1, 'At least one approver is required'),
  })).min(1, 'At least one stage is required'),
})

export const updateWorkflowSchema = z.object({
  type: z.nativeEnum(WorkflowType).optional(),
  stages: z.array(z.object({
    order: z.number().int(),
    name: z.string().max(200).optional(),
    type: z.nativeEnum(StageType),
    approverIds: z.array(z.string()).min(1, 'At least one approver is required'),
  })).optional(),
})

// Approval schemas
export const approveSchema = z.object({
  comments: z.string().max(1000).optional(),
})

export const declineSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
  comments: z.string().max(1000).optional(),
})

export const rejectSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
  comments: z.string().max(1000).optional(),
})

// Audit schema
export const auditQuerySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

