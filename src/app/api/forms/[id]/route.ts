import { NextRequest, NextResponse } from 'next/server'
import { FormService } from '@/services/FormService'
import { PermissionService } from '@/services/PermissionService'
import { requireAuth } from '@/lib/auth'
import { updateFormSchema } from '@/lib/validation'
import { handleError, ForbiddenError } from '@/lib/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const form = await FormService.getForm(params.id, true)

    await PermissionService.checkFormAccess(user, form, 'canView')

    return NextResponse.json({ form })
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
    const form = await FormService.getForm(params.id)

    // Check if user is creator or admin
    if (form.creatorId !== user.id && !user.roles.includes('ADMIN')) {
      throw new ForbiddenError('You can only edit your own forms')
    }

    const body = await request.json()
    const data = updateFormSchema.parse(body)

    const updated = await FormService.updateForm(params.id, data, user.id)

    return NextResponse.json({ form: updated })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const form = await FormService.getForm(params.id)

    // Check if user is creator or admin
    if (form.creatorId !== user.id && !user.roles.includes('ADMIN')) {
      throw new ForbiddenError('You can only delete your own forms')
    }

    await FormService.deleteForm(params.id, user.id)

    return NextResponse.json({ message: 'Form deleted successfully' })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

