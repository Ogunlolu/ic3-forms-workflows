import { NextRequest, NextResponse } from 'next/server'
import { AuditService } from '@/services/AuditService'
import { requireAuth } from '@/lib/auth'
import { auditQuerySchema } from '@/lib/validation'
import { handleError, ForbiddenError } from '@/lib/errors'
import { canViewAuditLogs } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!canViewAuditLogs(user)) {
      throw new ForbiddenError('You do not have permission to view audit logs')
    }

    const searchParams = request.nextUrl.searchParams
    const filters = auditQuerySchema.parse({
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      action: searchParams.get('action') || undefined,
      userId: searchParams.get('userId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    })

    const result = await AuditService.getLogs({
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

