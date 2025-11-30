import { prisma } from '@/lib/prisma'
import { FormStatus, FieldType } from '@prisma/client'
import { NotFoundError, ConflictError, ValidationError } from '@/lib/errors'
import { AuditService } from './AuditService'
import type { FormField } from '@/types/form'

export class FormService {
  static async createForm(userId: string, data: { title: string; description?: string }) {
    const form = await prisma.form.create({
      data: {
        title: data.title,
        description: data.description,
        creatorId: userId,
        status: 'DRAFT',
      },
    })

    await AuditService.log('FORM_CREATED', 'Form', userId, form.id)

    return form
  }

  static async getForm(id: string, includeFields = false) {
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        fields: includeFields
          ? {
              orderBy: { order: 'asc' },
            }
          : false,
        workflow: includeFields
          ? {
              include: {
                stages: {
                  orderBy: { order: 'asc' },
                },
              },
            }
          : false,
        _count: {
          select: {
            fields: true,
            submissions: true,
          },
        },
      },
    })

    if (!form) {
      throw new NotFoundError('Form')
    }

    return form
  }

  static async listForms(filters: {
    status?: FormStatus
    creatorId?: string
    page?: number
    limit?: number
  }) {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const skip = (page - 1) * limit

    const where: any = {}

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.creatorId) {
      where.creatorId = filters.creatorId
    }

    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where,
        include: {
          _count: {
            select: {
              fields: true,
              submissions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.form.count({ where }),
    ])

    return {
      forms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async updateForm(id: string, data: { title?: string; description?: string }, userId: string) {
    const form = await prisma.form.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
      },
    })

    await AuditService.log('FORM_UPDATED', 'Form', userId, form.id)

    return form
  }

  static async deleteForm(id: string, userId: string) {
    // Check if form has submissions
    const submissionCount = await prisma.formSubmission.count({
      where: { formId: id },
    })

    if (submissionCount > 0) {
      throw new ConflictError('Cannot delete form with existing submissions. Archive it instead.')
    }

    await prisma.form.delete({
      where: { id },
    })

    await AuditService.log('FORM_ARCHIVED', 'Form', userId, id)
  }

  static async publishForm(id: string, userId: string) {
    const form = await this.getForm(id, true)

    // Validate form has fields
    if (!form.fields || (form.fields as any[]).length === 0) {
      throw new ValidationError('Form must have at least one field before publishing')
    }

    const updated = await prisma.form.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })

    await AuditService.log('FORM_PUBLISHED', 'Form', userId, id)

    return updated
  }

  static async addField(formId: string, fieldData: {
    type: FieldType
    label: string
    placeholder?: string
    required?: boolean
    order?: number
    config?: any
    displayLogic?: any
    isPrivate?: boolean
  }) {
    // Get current max order
    const maxOrder = await prisma.formField.findFirst({
      where: { formId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const order = fieldData.order ?? ((maxOrder?.order ?? -1) + 1)

    const field = await prisma.formField.create({
      data: {
        formId,
        type: fieldData.type,
        label: fieldData.label,
        placeholder: fieldData.placeholder,
        required: fieldData.required ?? false,
        order,
        config: fieldData.config,
        displayLogic: fieldData.displayLogic,
        isPrivate: fieldData.isPrivate ?? false,
      },
    })

    return field
  }

  static async updateField(formId: string, fieldId: string, data: Partial<FormField>) {
    const field = await prisma.formField.findUnique({
      where: { id: fieldId },
    })

    if (!field || field.formId !== formId) {
      throw new NotFoundError('Form field')
    }

    const updated = await prisma.formField.update({
      where: { id: fieldId },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.placeholder !== undefined && { placeholder: data.placeholder }),
        ...(data.required !== undefined && { required: data.required }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.config !== undefined && { config: data.config }),
        ...(data.displayLogic !== undefined && { displayLogic: data.displayLogic }),
        ...(data.isPrivate !== undefined && { isPrivate: data.isPrivate }),
      },
    })

    return updated
  }

  static async deleteField(formId: string, fieldId: string) {
    const field = await prisma.formField.findUnique({
      where: { id: fieldId },
    })

    if (!field || field.formId !== formId) {
      throw new NotFoundError('Form field')
    }

    await prisma.formField.delete({
      where: { id: fieldId },
    })
  }

  static async reorderFields(formId: string, fieldOrders: Array<{ fieldId: string; order: number }>) {
    await Promise.all(
      fieldOrders.map(({ fieldId, order }) =>
        prisma.formField.updateMany({
          where: {
            id: fieldId,
            formId,
          },
          data: { order },
        })
      )
    )
  }

  static async updatePermissions(formId: string, permissions: {
    canBuild?: string[]
    canSubmit?: string[]
    canView?: string[]
  }, userId: string) {
    await prisma.form.update({
      where: { id: formId },
      data: {
        permissions: permissions as any,
      },
    })

    await AuditService.log('PERMISSION_CHANGED', 'Form', userId, formId, { permissions })
  }
}

