import { prisma } from '@/lib/prisma'
import { SubmissionStatus } from '@prisma/client'
import { NotFoundError, ValidationError, ForbiddenError } from '@/lib/errors'
import { AuditService } from './AuditService'
import { WorkflowService } from './WorkflowService'

export class SubmissionService {
  static async createSubmission(
    formId: string,
    submitterId: string,
    data: Record<string, any>,
    submit: boolean = false
  ) {
    // Verify form exists and is published
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!form) {
      throw new NotFoundError('Form')
    }

    if (form.status !== 'PUBLISHED') {
      throw new ForbiddenError('Form is not published')
    }

    // Validate required fields
    const requiredFields = form.fields.filter(f => f.required)
    for (const field of requiredFields) {
      if (!data[field.id] || (Array.isArray(data[field.id]) && data[field.id].length === 0)) {
        throw new ValidationError(`Field "${field.label}" is required`)
      }
    }

    const status: SubmissionStatus = submit ? 'SUBMITTED' : 'DRAFT'

    const submission = await prisma.formSubmission.create({
      data: {
        formId,
        submitterId,
        data: data as any,
        status,
        submittedAt: submit ? new Date() : null,
      },
    })

    await AuditService.log('SUBMISSION_CREATED', 'Submission', submitterId, submission.id)

    // If submitted, trigger workflow if exists
    if (submit) {
      await AuditService.log('SUBMISSION_SUBMITTED', 'Submission', submitterId, submission.id)
      
      const workflow = await prisma.workflow.findUnique({
        where: { formId },
      })

      if (workflow) {
        await WorkflowService.startWorkflow(workflow.id, submission.id)
      }
    }

    return submission
  }

  static async getSubmission(id: string) {
    const submission = await prisma.formSubmission.findUnique({
      where: { id },
      include: {
        form: {
          include: {
            fields: {
              orderBy: { order: 'asc' },
            },
          },
        },
        submitter: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        workflow: {
          include: {
            workflow: {
              include: {
                stages: {
                  orderBy: { order: 'asc' },
                },
              },
            },
            approvals: {
              include: {
                approver: {
                  select: {
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
                stage: {
                  select: {
                    name: true,
                    order: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
      },
    })

    if (!submission) {
      throw new NotFoundError('Submission')
    }

    return submission
  }

  static async listSubmissions(filters: {
    formId?: string
    submitterId?: string
    status?: SubmissionStatus
    page?: number
    limit?: number
  }) {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const skip = (page - 1) * limit

    const where: any = {}

    if (filters.formId) {
      where.formId = filters.formId
    }

    if (filters.submitterId) {
      where.submitterId = filters.submitterId
    }

    if (filters.status) {
      where.status = filters.status
    }

    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where,
        include: {
          form: {
            select: {
              title: true,
            },
          },
          submitter: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.formSubmission.count({ where }),
    ])

    return {
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async updateSubmission(
    id: string,
    data: { data?: Record<string, any>; submit?: boolean },
    userId: string
  ) {
    const submission = await prisma.formSubmission.findUnique({
      where: { id },
      include: {
        form: {
          include: {
            fields: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!submission) {
      throw new NotFoundError('Submission')
    }

    // Only allow updates to DRAFT or DECLINED submissions
    if (submission.status !== 'DRAFT' && submission.status !== 'DECLINED') {
      throw new ValidationError('Cannot update submission that is not in DRAFT or DECLINED status')
    }

    // Only submitter can update
    if (submission.submitterId !== userId) {
      throw new ForbiddenError('You can only update your own submissions')
    }

    const updateData: any = {}

    if (data.data) {
      // Validate required fields if submitting
      if (data.submit && submission.form) {
        const requiredFields = submission.form.fields.filter(f => f.required)
        for (const field of requiredFields) {
          if (!data.data[field.id] || (Array.isArray(data.data[field.id]) && data.data[field.id].length === 0)) {
            throw new ValidationError(`Field "${field.label}" is required`)
          }
        }
      }

      updateData.data = data.data as any
    }

    if (data.submit) {
      updateData.status = 'SUBMITTED'
      updateData.submittedAt = new Date()
    }

    const updated = await prisma.formSubmission.update({
      where: { id },
      data: updateData,
    })

    await AuditService.log('SUBMISSION_SUBMITTED', 'Submission', userId, id)

    // If submitted and workflow exists, start/restart workflow
    if (data.submit) {
      const workflow = await prisma.workflow.findUnique({
        where: { formId: submission.formId },
      })

      if (workflow) {
        // Check if workflow instance exists
        const existingInstance = await prisma.workflowInstance.findUnique({
          where: { submissionId: id },
        })

        if (existingInstance) {
          // Restart workflow
          await WorkflowService.restartWorkflow(existingInstance.id)
        } else {
          // Start new workflow
          await WorkflowService.startWorkflow(workflow.id, id)
        }
      }
    }

    return updated
  }

  static async archiveSubmission(id: string, userId: string) {
    const submission = await prisma.formSubmission.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
      },
    })

    await AuditService.log('SUBMISSION_ARCHIVED', 'Submission', userId, id)

    return submission
  }

  static async exportSubmissions(formId: string, format: 'csv' | 'excel' = 'csv') {
    const submissions = await prisma.formSubmission.findMany({
      where: {
        formId,
        status: {
          not: 'DRAFT',
        },
      },
      include: {
        form: {
          include: {
            fields: {
              orderBy: { order: 'asc' },
            },
          },
        },
        submitter: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    // This would be implemented with a CSV/Excel library
    // For now, return the data structure
    return {
      submissions,
      format,
    }
  }
}

