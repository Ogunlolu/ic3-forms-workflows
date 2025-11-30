import { prisma } from '@/lib/prisma'
import { User, Form, FormSubmission } from '@prisma/client'
import { checkFormPermission, FormPermissions } from '@/lib/permissions'
import { ForbiddenError } from '@/lib/errors'

export class PermissionService {
  static async checkFormAccess(
    user: User,
    form: Form,
    permission: 'canBuild' | 'canSubmit' | 'canView'
  ): Promise<void> {
    const hasAccess = checkFormPermission(user, form, permission)
    if (!hasAccess) {
      throw new ForbiddenError(`You do not have ${permission} permission for this form`)
    }
  }

  static async checkSubmissionAccess(
    user: User,
    submission: FormSubmission & { form?: Form }
  ): Promise<void> {
    // Check if user is admin
    if (user.roles.includes('ADMIN')) {
      return
    }

    // Check if user is the submitter
    if (submission.submitterId === user.id) {
      return
    }

    // Check if user is the form creator
    if (submission.form && submission.form.creatorId === user.id) {
      return
    }

    // Check if user is an approver for this submission
    const workflowInstance = await prisma.workflowInstance.findUnique({
      where: { submissionId: submission.id },
      include: {
        approvals: {
          where: {
            approverId: user.id,
            status: 'PENDING',
          },
        },
      },
    })

    if (workflowInstance && workflowInstance.approvals.length > 0) {
      return
    }

    throw new ForbiddenError('You do not have permission to view this submission')
  }

  static async updateFormPermissions(
    formId: string,
    permissions: FormPermissions
  ): Promise<void> {
    await prisma.form.update({
      where: { id: formId },
      data: {
        permissions: permissions as any,
      },
    })
  }
}

