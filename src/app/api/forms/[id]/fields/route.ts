import { NextRequest, NextResponse } from 'next/server'
import { FormService } from '@/services/FormService'
import { PermissionService } from '@/services/PermissionService'
import { requireAuth } from '@/lib/auth'
import { createFieldSchema, reorderFieldsSchema } from '@/lib/validation'
import { handleError, ForbiddenError } from '@/lib/errors'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const form = await FormService.getForm(params.id)

    await PermissionService.checkFormAccess(user, form, 'canBuild')

    const body = await request.json()
    const data = createFieldSchema.parse(body)

    const field = await FormService.addField(params.id, data)

    return NextResponse.json({ field }, { status: 201 })
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

    await PermissionService.checkFormAccess(user, form, 'canBuild')

    const body = await request.json()
    const data = reorderFieldsSchema.parse(body)

    await FormService.reorderFields(params.id, data.fieldOrders)

    return NextResponse.json({ message: 'Fields reordered successfully' })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

