import { NextRequest, NextResponse } from 'next/server'
import { SubmissionService } from '@/services/SubmissionService'
import { requireAuth } from '@/lib/auth'
import { handleError } from '@/lib/errors'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const submission = await SubmissionService.archiveSubmission(params.id, user.id)

    return NextResponse.json({ submission })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

