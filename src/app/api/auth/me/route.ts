import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { handleError, UnauthorizedError } from '@/lib/errors'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      throw new UnauthorizedError('Not authenticated')
    }

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

