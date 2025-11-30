import { prisma } from '@/lib/prisma'

export class NotificationService {
  static async notifyApprovers(instanceId: string, stageId: string): Promise<void> {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        submission: {
          include: {
            form: true,
            submitter: true,
          },
        },
        workflow: {
          include: {
            stages: true,
          },
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
    const approvers = await prisma.user.findMany({
      where: {
        id: { in: approverIds },
        isActive: true,
      },
    })

    // Send Teams notifications
    for (const approver of approvers) {
      await this.sendTeamsNotification(approver.email, {
        formTitle: instance.submission.form.title,
        submitter: instance.submission.submitter.email,
        stageName: stage.name || 'Approval Required',
        submissionId: instance.submissionId,
      })
    }

    // TODO: Send email notifications
    // await this.sendEmailNotification(...)
  }

  private static async sendTeamsNotification(
    approverEmail: string,
    data: {
      formTitle: string
      submitter: string
      stageName: string
      submissionId: string
    }
  ): Promise<void> {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL
    if (!webhookUrl) {
      // Teams integration is optional
      return
    }

    try {
      const message = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        summary: 'New Approval Required',
        themeColor: '0078D4',
        title: 'New Approval Required',
        sections: [
          {
            activityTitle: `Form: ${data.formTitle}`,
            activitySubtitle: `Submitted by: ${data.submitter}`,
            facts: [
              {
                name: 'Stage',
                value: data.stageName,
              },
            ],
          },
        ],
        potentialAction: [
          {
            '@type': 'OpenUri',
            name: 'Review Submission',
            targets: [
              {
                os: 'default',
                uri: `${process.env.NEXT_PUBLIC_APP_URL}/approvals?submission=${data.submissionId}`,
              },
            ],
          },
        ],
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })
    } catch (error) {
      // Don't throw - notifications should not break the main flow
      console.error('Failed to send Teams notification:', error)
    }
  }

  static async notifySubmitter(
    submissionId: string,
    _action: 'approved' | 'declined' | 'rejected'
  ): Promise<void> {
    const submission = await prisma.formSubmission.findUnique({
      where: { id: submissionId },
      include: {
        form: true,
        submitter: true,
      },
    })

    if (!submission) {
      return
    }

    // TODO: Send email notification to submitter
    // await this.sendEmailNotification(...)
  }
}

