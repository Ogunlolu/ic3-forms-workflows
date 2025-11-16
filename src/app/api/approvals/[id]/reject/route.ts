import { NextRequest, NextResponse } from 'next/server'
import { WorkflowService } from '@/services/WorkflowService'
import { requireAuth } from '@/lib/auth'
import { rejectSchema } from '@/lib/validation'
import { handleError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = rejectSchema.parse(body)

    await WorkflowService.processApproval(params.id, 'reject', user.id, data)

    const approval = await prisma.approval.findUnique({
      where: { id: params.id },
      include: {
        instance: {
          include: {
            submission: true,
          },
        },
      },
    })

    return NextResponse.json({
      approval: {
        id: approval!.id,
        status: approval!.status,
        declinedReason: approval!.declinedReason,
        rejectedAt: approval!.rejectedAt,
      },
      submission: {
        id: approval!.instance.submission.id,
        status: approval!.instance.submission.status,
      },
      workflow: {
        status: approval!.instance.status,
        completedAt: approval!.instance.completedAt,
      },
    })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

