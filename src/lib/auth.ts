import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { User, UserRole } from '@prisma/client'

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
const SESSION_COOKIE_NAME = 'ic3_session_token'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateSessionToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36)
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  return token
}

export async function getSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: true,
    },
  })

  if (!session) {
    return null
  }

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } })
    return null
  }

  return session
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token },
  })
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const session = await getSession(token)
  if (!session || !session.user.isActive) {
    return null
  }

  return session.user
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

export function hasRole(user: User, role: UserRole): boolean {
  return user.roles.includes(role)
}

export function hasAnyRole(user: User, roles: UserRole[]): boolean {
  return roles.some(role => user.roles.includes(role))
}

