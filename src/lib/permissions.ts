import { User, UserRole, Form, FormSubmission } from '@prisma/client'

export type PermissionType = 'canBuild' | 'canSubmit' | 'canView'

export interface FormPermissions {
  canBuild?: string[]
  canSubmit?: string[]
  canView?: string[]
}

export function checkFormPermission(
  user: User,
  form: Form,
  permission: PermissionType
): boolean {
  // Admins have all permissions
  if (user.roles.includes(UserRole.ADMIN)) {
    return true
  }

  // Form creator always has build permission
  if (permission === 'canBuild' && form.creatorId === user.id) {
    return true
  }

  // Check form-specific permissions
  const permissions = form.permissions as FormPermissions | null
  if (!permissions) {
    // If no permissions set, default to role-based
    return checkRoleBasedPermission(user, permission)
  }

  const userIds = permissions[permission] || []
  return userIds.includes(user.id)
}

function checkRoleBasedPermission(user: User, permission: PermissionType): boolean {
  switch (permission) {
    case 'canBuild':
      return user.roles.includes(UserRole.FORM_CREATOR) || user.roles.includes(UserRole.ADMIN)
    case 'canSubmit':
      return user.roles.includes(UserRole.SUBMITTER) || user.roles.includes(UserRole.ADMIN)
    case 'canView':
      return true // All authenticated users can view by default
    default:
      return false
  }
}

export function checkSubmissionPermission(
  user: User,
  submission: FormSubmission
): boolean {
  // Admins can view all
  if (user.roles.includes(UserRole.ADMIN)) {
    return true
  }

  // Submitter can view their own
  if (submission.submitterId === user.id) {
    return true
  }

  // Form creator can view submissions to their forms
  // This will be checked at the service level with form relation

  // Approvers can view submissions they need to approve
  // This will be checked at the service level

  return false
}

export function canViewAuditLogs(user: User): boolean {
  return user.roles.includes(UserRole.AUDITOR) || user.roles.includes(UserRole.ADMIN)
}

