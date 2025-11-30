import { prisma } from '@/lib/prisma'
import { WorkflowType, StageType } from '@prisma/client'
import { NotFoundError, ConflictError, ValidationError } from '@/lib/errors'
import { AuditService } from './AuditService'
import { NotificationService } from './NotificationService'

export class WorkflowService {
  static async createWorkflow(
    formId: string,
    type: WorkflowType,
    stages: Array<{
      order: number
      name?: string
      type: StageType
      approverIds: string[]
    }>,
    userId: string
  ) {
    // Check if workflow already exists
    const existing = await prisma.workflow.findUnique({
      where: { formId },
    })

    if (existing) {
      throw new ConflictError('Workflow already exists for this form')
    }

    // Validate approvers exist
    for (const stage of stages) {
      const approvers = await prisma.user.findMany({
        where: {
          id: { in: stage.approverIds },
          isActive: true,
        },
      })

      if (approvers.length !== stage.approverIds.length) {
        throw new ValidationError('One or more approvers not found or inactive')
      }
    }

    const workflow = await prisma.workflow.create({
      data: {
        formId,
        type,
        stages: {
          create: stages.map(stage => ({
            order: stage.order,
            name: stage.name,
            type: stage.type,
            approverIds: stage.approverIds as any,
          })),
        },
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    })

    await AuditService.log('WORKFLOW_CREATED', 'Workflow', userId, workflow.id)

    return workflow
  }

  static async getWorkflow(id: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!workflow) {
      throw new NotFoundError('Workflow')
    }

    return workflow
  }

  static async updateWorkflow(
    id: string,
    data: {
      type?: WorkflowType
      stages?: Array<{
        order: number
        name?: string
        type: StageType
        approverIds: string[]
      }>
    },
    userId: string
  ) {
    await this.getWorkflow(id)

    // If updating stages, validate approvers
    if (data.stages) {
      for (const stage of data.stages) {
        const approvers = await prisma.user.findMany({
          where: {
            id: { in: stage.approverIds },
            isActive: true,
          },
        })

        if (approvers.length !== stage.approverIds.length) {
          throw new ValidationError('One or more approvers not found or inactive')
        }
      }
    }

    // Delete existing stages if updating
    if (data.stages) {
      await prisma.workflowStage.deleteMany({
        where: { workflowId: id },
      })
    }

    const updated = await prisma.workflow.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.stages && {
          stages: {
            create: data.stages.map(stage => ({
              order: stage.order,
              name: stage.name,
              type: stage.type,
              approverIds: stage.approverIds as any,
            })),
          },
        }),
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    })

    await AuditService.log('WORKFLOW_UPDATED', 'Workflow', userId, id)

    return updated
  }

  static async startWorkflow(workflowId: string, submissionId: string) {
    const workflow = await this.getWorkflow(workflowId)

    // Get first stage
    const firstStage = workflow.stages[0]
    if (!firstStage) {
      throw new ValidationError('Workflow has no stages')
    }

    // Create workflow instance
    const instance = await prisma.workflowInstance.create({
      data: {
        workflowId,
        submissionId,
        currentStageId: firstStage.id,
        status: 'IN_PROGRESS',
      },
    })

    // Create approvals for first stage
    const approverIds = firstStage.approverIds as string[]
    await Promise.all(
      approverIds.map(approverId =>
        prisma.approval.create({
          data: {
            instanceId: instance.id,
            stageId: firstStage.id,
            approverId,
            status: 'PENDING',
          },
        })
      )
    )

    // Notify approvers
    await NotificationService.notifyApprovers(instance.id, firstStage.id)

    return instance
  }

  static async restartWorkflow(instanceId: string) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        workflow: {
          include: {
            stages: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!instance) {
      throw new NotFoundError('Workflow instance')
    }

    // Delete existing approvals
    await prisma.approval.deleteMany({
      where: { instanceId },
    })

    // Reset to first stage
    const firstStage = instance.workflow.stages[0]
    if (!firstStage) {
      throw new ValidationError('Workflow has no stages')
    }

    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        currentStageId: firstStage.id,
        status: 'IN_PROGRESS',
        completedAt: null,
      },
    })

    // Create new approvals for first stage
    const approverIds = firstStage.approverIds as string[]
    await Promise.all(
      approverIds.map(approverId =>
        prisma.approval.create({
          data: {
            instanceId,
            stageId: firstStage.id,
            approverId,
            status: 'PENDING',
          },
        })
      )
    )

    // Notify approvers
    await NotificationService.notifyApprovers(instanceId, firstStage.id)
  }

  static async processApproval(
    approvalId: string,
    action: 'approve' | 'decline' | 'reject',
    userId: string,
    data?: { comments?: string; reason?: string }
  ) {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        instance: {
          include: {
            workflow: {
              include: {
                stages: {
                  orderBy: { order: 'asc' },
                },
              },
            },
            submission: true,
          },
        },
        stage: true,
      },
    })

    if (!approval) {
      throw new NotFoundError('Approval')
    }

    if (approval.approverId !== userId) {
      throw new ValidationError('You are not the assigned approver')
    }

    if (approval.status !== 'PENDING') {
      throw new ValidationError('Approval is not in pending status')
    }

    const now = new Date()

    if (action === 'approve') {
      await prisma.approval.update({
        where: { id: approvalId },
        data: {
          status: 'APPROVED',
          approvedAt: now,
          comments: data?.comments,
        },
      })

      await AuditService.log('APPROVAL_ACTION', 'Approval', userId, approvalId, { action: 'approved' })

      // Check if stage is complete
      await this.checkStageCompletion(approval.instanceId, approval.stageId)
    } else if (action === 'decline') {
      if (!data?.reason) {
        throw new ValidationError('Reason is required for decline')
      }

      await prisma.approval.update({
        where: { id: approvalId },
        data: {
          status: 'DECLINED',
          declinedAt: now,
          declinedReason: data.reason,
          comments: data.comments,
        },
      })

      // Update submission status
      await prisma.formSubmission.update({
        where: { id: approval.instance.submissionId },
        data: {
          status: 'DECLINED',
        },
      })

      await AuditService.log('APPROVAL_ACTION', 'Approval', userId, approvalId, { action: 'declined' })
      await AuditService.log('SUBMISSION_DECLINED', 'Submission', userId, approval.instance.submissionId)
    } else if (action === 'reject') {
      if (!data?.reason) {
        throw new ValidationError('Reason is required for rejection')
      }

      await prisma.approval.update({
        where: { id: approvalId },
        data: {
          status: 'REJECTED',
          rejectedAt: now,
          declinedReason: data.reason,
          comments: data.comments,
        },
      })

      // Update submission and workflow status
      await Promise.all([
        prisma.formSubmission.update({
          where: { id: approval.instance.submissionId },
          data: {
            status: 'REJECTED',
          },
        }),
        prisma.workflowInstance.update({
          where: { id: approval.instanceId },
          data: {
            status: 'REJECTED',
            completedAt: now,
          },
        }),
      ])

      await AuditService.log('APPROVAL_ACTION', 'Approval', userId, approvalId, { action: 'rejected' })
      await AuditService.log('SUBMISSION_REJECTED', 'Submission', userId, approval.instance.submissionId)
    }
  }

  private static async checkStageCompletion(instanceId: string, stageId: string) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        workflow: {
          include: {
            stages: {
              orderBy: { order: 'asc' },
            },
          },
        },
        approvals: {
          where: { stageId },
        },
      },
    })

    if (!instance) {
      return
    }

    const stage = instance.workflow.stages.find(s => s.id === stageId)
    if (!stage) {
      return
    }

    const approverIds = stage.approverIds as string[]
    const approvals = instance.approvals.filter(a => a.stageId === stageId)

    let stageComplete = false

    if (stage.type === 'SEQUENTIAL') {
      // All approvers must approve in sequence
      const approvedCount = approvals.filter(a => a.status === 'APPROVED').length
      stageComplete = approvedCount === approverIds.length
    } else if (stage.type === 'PARALLEL') {
      // At least one approver must approve
      stageComplete = approvals.some(a => a.status === 'APPROVED')
    } else if (stage.type === 'ALL_MUST_APPROVE') {
      // All approvers must approve
      const approvedCount = approvals.filter(a => a.status === 'APPROVED').length
      stageComplete = approvedCount === approverIds.length
    }

    if (stageComplete) {
      // Move to next stage or complete workflow
      const currentStageIndex = instance.workflow.stages.findIndex(s => s.id === stageId)
      const nextStage = instance.workflow.stages[currentStageIndex + 1]

      if (nextStage) {
        // Move to next stage
        await prisma.workflowInstance.update({
          where: { id: instanceId },
          data: {
            currentStageId: nextStage.id,
          },
        })

        // Create approvals for next stage
        const nextApproverIds = nextStage.approverIds as string[]
        await Promise.all(
          nextApproverIds.map(approverId =>
            prisma.approval.create({
              data: {
                instanceId,
                stageId: nextStage.id,
                approverId,
                status: 'PENDING',
              },
            })
          )
        )

        // Notify next stage approvers
        await NotificationService.notifyApprovers(instanceId, nextStage.id)
      } else {
        // Workflow complete
        await Promise.all([
          prisma.workflowInstance.update({
            where: { id: instanceId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          }),
          prisma.formSubmission.update({
            where: { id: instance.submissionId },
            data: {
              status: 'APPROVED',
              completedAt: new Date(),
            },
          }),
        ])

        await AuditService.log('SUBMISSION_APPROVED', 'Submission', null, instance.submissionId)
      }
    }
  }
}

