import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

export class AuditService {
  static async log(
    action: AuditAction,
    entityType: string,
    userId: string | null,
    entityId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          userId: userId || undefined,
          metadata: metadata || undefined,
        },
      })
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      console.error('Failed to create audit log:', error)
    }
  }

  static async getLogs(filters: {
    entityType?: string
    entityId?: string
    action?: AuditAction
    userId?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }) {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const skip = (page - 1) * limit

    const where: any = {}

    if (filters.entityType) {
      where.entityType = filters.entityType
    }

    if (filters.entityId) {
      where.entityId = filters.entityId
    }

    if (filters.action) {
      where.action = filters.action
    }

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}

