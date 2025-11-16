import { NextRequest, NextResponse } from 'next/server'
import { WorkflowService } from '@/services/WorkflowService'
import { requireAuth } from '@/lib/auth'
import { declineSchema } from '@/lib/validation'
import { handleError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = declineSchema.parse(body)

    await WorkflowService.processApproval(params.id, 'decline', user.id, data)

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
        declinedAt: approval!.declinedAt,
      },
      submission: {
        id: approval!.instance.submission.id,
        status: approval!.instance.submission.status,
      },
    })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

