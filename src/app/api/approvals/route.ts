import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { paginationSchema } from '@/lib/validation'
import { handleError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams

    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {
      approverId: user.id,
      status: status as any,
    }

    const [approvals, total] = await Promise.all([
      prisma.approval.findMany({
        where,
        include: {
          instance: {
            include: {
              submission: {
                include: {
                  form: {
                    select: {
                      title: true,
                    },
                  },
                  submitter: {
                    select: {
                      email: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          stage: {
            select: {
              name: true,
              order: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.approval.count({ where }),
    ])

    return NextResponse.json({
      approvals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

