import { NextRequest, NextResponse } from 'next/server'
import { FormService } from '@/services/FormService'
import { PermissionService } from '@/services/PermissionService'
import { requireAuth } from '@/lib/auth'
import { permissionsSchema } from '@/lib/validation'
import { handleError, ForbiddenError } from '@/lib/errors'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const form = await FormService.getForm(params.id)

    // Check if user is creator or admin
    if (form.creatorId !== user.id && !user.roles.includes('ADMIN')) {
      throw new ForbiddenError('You can only update permissions for your own forms')
    }

    const body = await request.json()
    const data = permissionsSchema.parse(body)

    await FormService.updatePermissions(params.id, data.permissions, user.id)

    return NextResponse.json({
      form: {
        id: params.id,
        permissions: data.permissions,
      },
    })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

