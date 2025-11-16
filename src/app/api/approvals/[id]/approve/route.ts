import { NextRequest, NextResponse } from 'next/server'
import { WorkflowService } from '@/services/WorkflowService'
import { requireAuth } from '@/lib/auth'
import { approveSchema } from '@/lib/validation'
import { handleError } from '@/lib/errors'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = approveSchema.parse(body)

    await WorkflowService.processApproval(params.id, 'approve', user.id, data)

    // Get updated approval and workflow status
    const { prisma } = await import('@/lib/prisma')
    const approval = await prisma.approval.findUnique({
      where: { id: params.id },
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
          },
        },
      },
    })

    return NextResponse.json({
      approval: {
        id: approval!.id,
        status: approval!.status,
        approvedAt: approval!.approvedAt,
      },
      workflow: {
        status: approval!.instance.status,
        currentStage: approval!.instance.currentStageId
          ? approval!.instance.workflow.stages.find(
              s => s.id === approval!.instance.currentStageId
            )
          : null,
      },
    })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

