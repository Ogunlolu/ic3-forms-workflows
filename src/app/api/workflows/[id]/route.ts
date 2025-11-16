import { NextRequest, NextResponse } from 'next/server'
import { WorkflowService } from '@/services/WorkflowService'
import { requireAuth } from '@/lib/auth'
import { updateWorkflowSchema } from '@/lib/validation'
import { handleError, ForbiddenError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const workflow = await WorkflowService.getWorkflow(params.id)

    // Check if user has access to the form
    const form = await prisma.form.findUnique({
      where: { id: workflow.formId },
    })

    if (!form) {
      throw new Error('NOT_FOUND')
    }

    const { checkFormPermission } = await import('@/lib/permissions')
    const hasAccess = checkFormPermission(user, form, 'canView')
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this workflow')
    }

    return NextResponse.json({ workflow })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const workflow = await WorkflowService.getWorkflow(params.id)

    // Check if user is form creator or admin
    const form = await prisma.form.findUnique({
      where: { id: workflow.formId },
    })

    if (!form) {
      throw new Error('NOT_FOUND')
    }

    if (form.creatorId !== user.id && !user.roles.includes('ADMIN')) {
      throw new ForbiddenError('You can only update workflows for your own forms')
    }

    const body = await request.json()
    const data = updateWorkflowSchema.parse(body)

    const updated = await WorkflowService.updateWorkflow(params.id, data, user.id)

    return NextResponse.json({ workflow: updated })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

