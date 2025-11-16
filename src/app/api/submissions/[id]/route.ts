import { NextRequest, NextResponse } from 'next/server'
import { SubmissionService } from '@/services/SubmissionService'
import { PermissionService } from '@/services/PermissionService'
import { requireAuth } from '@/lib/auth'
import { updateSubmissionSchema } from '@/lib/validation'
import { handleError } from '@/lib/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const submission = await SubmissionService.getSubmission(params.id)

    await PermissionService.checkSubmissionAccess(user, submission as any)

    return NextResponse.json({ submission })
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
    const body = await request.json()
    const data = updateSubmissionSchema.parse(body)

    const submission = await SubmissionService.updateSubmission(
      params.id,
      data,
      user.id
    )

    return NextResponse.json({ submission })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

