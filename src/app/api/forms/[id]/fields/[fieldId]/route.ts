import { NextRequest, NextResponse } from 'next/server'
import { FormService } from '@/services/FormService'
import { PermissionService } from '@/services/PermissionService'
import { requireAuth } from '@/lib/auth'
import { updateFieldSchema } from '@/lib/validation'
import { handleError } from '@/lib/errors'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; fieldId: string } }
) {
  try {
    const user = await requireAuth()
    const form = await FormService.getForm(params.id)

    await PermissionService.checkFormAccess(user, form, 'canBuild')

    const body = await request.json()
    const data = updateFieldSchema.parse(body)

    const field = await FormService.updateField(params.id, params.fieldId, data)

    return NextResponse.json({ field })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fieldId: string } }
) {
  try {
    const user = await requireAuth()
    const form = await FormService.getForm(params.id)

    await PermissionService.checkFormAccess(user, form, 'canBuild')

    await FormService.deleteField(params.id, params.fieldId)

    return NextResponse.json({ message: 'Field deleted successfully' })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

