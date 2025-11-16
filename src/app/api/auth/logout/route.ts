import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteSession, clearSessionCookie } from '@/lib/auth'
import { handleError } from '@/lib/errors'

const SESSION_COOKIE_NAME = 'ic3_session_token'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (token) {
      await deleteSession(token)
    }

    await clearSessionCookie()

    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    return NextResponse.json(body, { status: statusCode })
  }
}

