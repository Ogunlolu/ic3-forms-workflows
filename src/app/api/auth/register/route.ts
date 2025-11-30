import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createSession, setSessionCookie } from '@/lib/auth'
import { registerSchema } from '@/lib/validation'
import { handleError, ConflictError } from '@/lib/errors'
import { AuditService } from '@/services/AuditService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existing) {
      throw new ConflictError('Email already exists')
    }

    // Create user
    const passwordHash = await hashPassword(data.password)
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: ['SUBMITTER'], // Default role
      },
    })

    // Create session
    const token = await createSession(user.id)
    await setSessionCookie(token)

    await AuditService.log('USER_REGISTERED', 'User', user.id, user.id)

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
        },
      },
      { status: 201 }
    )
  } catch (error) {
      const { statusCode, body } = handleError(error)
      return NextResponse.json(body, { status: statusCode })
    }
}

