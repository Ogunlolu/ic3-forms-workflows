import { FormStatus, FieldType, SubmissionStatus } from '@prisma/client'

export type FormWithFields = {
  id: string
  title: string
  description?: string | null
  status: FormStatus
  creatorId: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date | null
  permissions?: any
  fields: FormField[]
  _count?: {
    fields: number
    submissions: number
  }
}

export type FormField = {
  id: string
  formId: string
  type: FieldType
  label: string
  placeholder?: string | null
  required: boolean
  order: number
  config?: any
  displayLogic?: any
  isPrivate: boolean
  createdAt: Date
  updatedAt: Date
}

export type FormSubmissionWithDetails = {
  id: string
  formId: string
  submitterId: string
  status: SubmissionStatus
  data: any
  submittedAt?: Date | null
  completedAt?: Date | null
  archivedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  form?: {
    id: string
    title: string
    fields: FormField[]
  }
  submitter?: {
    email: string
    firstName?: string | null
    lastName?: string | null
  }
}

export type DisplayLogic = {
  triggerFieldId: string
  triggerValue: string | number | boolean
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than'
}

export type FieldConfig = {
  options?: Array<{ label: string; value: string }>
  min?: number
  max?: number
  step?: number
  maxSize?: number
  allowedTypes?: string[]
}

