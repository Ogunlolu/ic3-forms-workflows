import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'
import { handleError, UnauthorizedError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = loginSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (!user) {
      throw new UnauthorizedError('Invalid credentials')
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive')
    }

    // Verify password
    const isValid = await verifyPassword(data.password, user.passwordHash)
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials')
    }

    // Create session
    const token = await createSession(user.id)
    await setSessionCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
      },
    })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

