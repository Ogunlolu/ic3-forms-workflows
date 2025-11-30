import { NextRequest, NextResponse } from 'next/server'
import { SubmissionService } from '@/services/SubmissionService'
import { requireAuth } from '@/lib/auth'
import { createSubmissionSchema } from '@/lib/validation'
import { handleError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams

    const filters = {
      formId: searchParams.get('formId') || undefined,
      submitterId: searchParams.get('submitterId') || undefined,
      status: searchParams.get('status') as any,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    }

    // If not admin, filter to own submissions
    if (!user.roles.includes('ADMIN')) {
      filters.submitterId = user.id
    }

    const result = await SubmissionService.listSubmissions(filters)

    return NextResponse.json(result)
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = createSubmissionSchema.parse(body)

    // Check submit permission
    const { prisma } = await import('@/lib/prisma')
    const form = await prisma.form.findUnique({
      where: { id: data.formId },
    })

    if (!form) {
      throw new Error('NOT_FOUND')
    }

    const { checkFormPermission } = await import('@/lib/permissions')
    const hasPermission = checkFormPermission(user, form, 'canSubmit')
    if (!hasPermission) {
      throw new Error('FORBIDDEN')
    }

    const submission = await SubmissionService.createSubmission(
      data.formId,
      user.id,
      data.data,
      data.submit
    )

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

