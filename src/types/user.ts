import { UserRole } from '@prisma/client'

export type User = {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  roles: UserRole[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type Session = {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

export type UserWithSession = User & {
  session?: Session
}

