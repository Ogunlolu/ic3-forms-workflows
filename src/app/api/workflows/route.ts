import { NextRequest, NextResponse } from 'next/server'
import { WorkflowService } from '@/services/WorkflowService'
import { requireAuth } from '@/lib/auth'
import { createWorkflowSchema } from '@/lib/validation'
import { handleError, ForbiddenError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = createWorkflowSchema.parse(body)

    // Check if user is form creator or admin
    const form = await prisma.form.findUnique({
      where: { id: data.formId },
    })

    if (!form) {
      throw new Error('NOT_FOUND')
    }

    if (form.creatorId !== user.id && !user.roles.includes('ADMIN')) {
      throw new ForbiddenError('You can only create workflows for your own forms')
    }

    const workflow = await WorkflowService.createWorkflow(
      data.formId,
      data.type,
      data.stages,
      user.id
    )

    return NextResponse.json({ workflow }, { status: 201 })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

