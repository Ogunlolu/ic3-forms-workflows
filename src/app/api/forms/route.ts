import { NextRequest, NextResponse } from 'next/server'
import { FormService } from '@/services/FormService'
import { PermissionService } from '@/services/PermissionService'
import { requireAuth } from '@/lib/auth'
import { createFormSchema } from '@/lib/validation'
import { handleError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams

    const filters = {
      status: searchParams.get('status') as any,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    }

    const result = await FormService.listForms(filters)

    // Filter by permissions
    const accessibleForms = []
    for (const form of result.forms) {
      try {
        await PermissionService.checkFormAccess(user, form, 'canView')
        accessibleForms.push(form)
      } catch {
        // Skip forms without access
      }
    }

    return NextResponse.json({
      forms: accessibleForms,
      pagination: result.pagination,
    })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = createFormSchema.parse(body)

    const form = await FormService.createForm(user.id, data)

    return NextResponse.json({ form }, { status: 201 })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

