import { NextRequest, NextResponse } from 'next/server'
import { FormService } from '@/services/FormService'
import { PermissionService } from '@/services/PermissionService'
import { requireAuth } from '@/lib/auth'
import { handleError, ForbiddenError } from '@/lib/errors'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const form = await FormService.getForm(params.id)

    // Check if user is creator or admin
    if (form.creatorId !== user.id && !user.roles.includes('ADMIN')) {
      throw new ForbiddenError('You can only publish your own forms')
    }

    const updated = await FormService.publishForm(params.id, user.id)

    return NextResponse.json({ form: updated })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

