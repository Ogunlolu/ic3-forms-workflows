# API Design Specification

## Base URL
All API endpoints are prefixed with `/api`

## Authentication
Most endpoints require authentication via session cookie. Include credentials in requests.

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request:**
```typescript
{
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}
```

**Response (201):**
```typescript
{
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: UserRole[];
  }
}
```

**Errors:**
- `400` - Validation error (email format, password strength)
- `409` - Email already exists

---

### POST /api/auth/login
Authenticate user and create session.

**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response (200):**
```typescript
{
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: UserRole[];
  }
}
```

**Errors:**
- `400` - Missing email/password
- `401` - Invalid credentials
- `403` - Account inactive

---

### POST /api/auth/logout
Logout current user (destroy session).

**Response (200):**
```typescript
{
  message: "Logged out successfully"
}
```

---

### GET /api/auth/me
Get current authenticated user.

**Response (200):**
```typescript
{
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: UserRole[];
  }
}
```

**Errors:**
- `401` - Not authenticated

---

## Form Endpoints

### GET /api/forms
List all forms (filtered by permissions).

**Query Parameters:**
- `status?: FormStatus` - Filter by status (DRAFT, PUBLISHED, ARCHIVED)
- `page?: number` - Page number (default: 1)
- `limit?: number` - Items per page (default: 20)

**Response (200):**
```typescript
{
  forms: Array<{
    id: string;
    title: string;
    description?: string;
    status: FormStatus;
    creatorId: string;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    _count: {
      fields: number;
      submissions: number;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

### POST /api/forms
Create a new form.

**Request:**
```typescript
{
  title: string;
  description?: string;
}
```

**Response (201):**
```typescript
{
  form: {
    id: string;
    title: string;
    description?: string;
    status: FormStatus;
    creatorId: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

**Errors:**
- `400` - Validation error
- `403` - Insufficient permissions

---

### GET /api/forms/[id]
Get a single form with fields.

**Response (200):**
```typescript
{
  form: {
    id: string;
    title: string;
    description?: string;
    status: FormStatus;
    creatorId: string;
    fields: Array<{
      id: string;
      type: FieldType;
      label: string;
      placeholder?: string;
      required: boolean;
      order: number;
      config?: JsonValue;
      displayLogic?: JsonValue;
      isPrivate: boolean;
    }>;
    workflow?: {
      id: string;
      type: WorkflowType;
      stages: Array<{
        id: string;
        order: number;
        name?: string;
        type: StageType;
        approverIds: string[];
      }>;
    };
  };
}
```

**Errors:**
- `404` - Form not found
- `403` - Insufficient permissions

---

### PUT /api/forms/[id]
Update form metadata (title, description).

**Request:**
```typescript
{
  title?: string;
  description?: string;
}
```

**Response (200):**
```typescript
{
  form: {
    id: string;
    title: string;
    description?: string;
    status: FormStatus;
    updatedAt: string;
  };
}
```

**Errors:**
- `400` - Validation error
- `403` - Not form creator or admin
- `404` - Form not found

---

### DELETE /api/forms/[id]
Delete a form (soft delete or hard delete if no submissions).

**Response (200):**
```typescript
{
  message: "Form deleted successfully"
}
```

**Errors:**
- `403` - Not form creator or admin
- `404` - Form not found
- `409` - Form has submissions, cannot delete

---

### POST /api/forms/[id]/publish
Publish a form (change status to PUBLISHED).

**Response (200):**
```typescript
{
  form: {
    id: string;
    status: FormStatus;
    publishedAt: string;
  };
}
```

**Errors:**
- `400` - Form has no fields or validation errors
- `403` - Not form creator or admin
- `404` - Form not found

---

### POST /api/forms/[id]/fields
Add a field to a form.

**Request:**
```typescript
{
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  order?: number;
  config?: JsonValue;
  displayLogic?: JsonValue;
  isPrivate?: boolean;
}
```

**Response (201):**
```typescript
{
  field: {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    required: boolean;
    order: number;
    config?: JsonValue;
    displayLogic?: JsonValue;
    isPrivate: boolean;
  };
}
```

**Errors:**
- `400` - Validation error
- `403` - Not form creator or admin
- `404` - Form not found

---

### PUT /api/forms/[id]/fields/[fieldId]
Update a form field.

**Request:**
```typescript
{
  label?: string;
  placeholder?: string;
  required?: boolean;
  order?: number;
  config?: JsonValue;
  displayLogic?: JsonValue;
  isPrivate?: boolean;
}
```

**Response (200):**
```typescript
{
  field: {
    id: string;
    type: FieldType;
    label: string;
    // ... other field properties
  };
}
```

**Errors:**
- `400` - Validation error
- `403` - Not form creator or admin
- `404` - Form or field not found

---

### DELETE /api/forms/[id]/fields/[fieldId]
Delete a form field.

**Response (200):**
```typescript
{
  message: "Field deleted successfully"
}
```

**Errors:**
- `403` - Not form creator or admin
- `404` - Form or field not found

---

### PUT /api/forms/[id]/fields/reorder
Reorder form fields.

**Request:**
```typescript
{
  fieldOrders: Array<{
    fieldId: string;
    order: number;
  }>;
}
```

**Response (200):**
```typescript
{
  message: "Fields reordered successfully"
}
```

---

### PUT /api/forms/[id]/permissions
Update form permissions.

**Request:**
```typescript
{
  permissions: {
    canBuild?: string[];  // User IDs
    canSubmit?: string[];
    canView?: string[];
  };
}
```

**Response (200):**
```typescript
{
  form: {
    id: string;
    permissions: JsonValue;
  };
}
```

**Errors:**
- `400` - Invalid permission structure
- `403` - Not form creator or admin
- `404` - Form not found

---

## Submission Endpoints

### GET /api/submissions
List form submissions (filtered by permissions).

**Query Parameters:**
- `formId?: string` - Filter by form
- `status?: SubmissionStatus` - Filter by status
- `submitterId?: string` - Filter by submitter
- `page?: number`
- `limit?: number`

**Response (200):**
```typescript
{
  submissions: Array<{
    id: string;
    formId: string;
    form: {
      title: string;
    };
    submitterId: string;
    submitter: {
      email: string;
      firstName?: string;
      lastName?: string;
    };
    status: SubmissionStatus;
    submittedAt?: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

### POST /api/submissions
Create a new submission (draft or submit).

**Request:**
```typescript
{
  formId: string;
  data: Record<string, any>;  // Field ID -> value mapping
  submit?: boolean;  // If true, submit immediately; if false, save as draft
}
```

**Response (201):**
```typescript
{
  submission: {
    id: string;
    formId: string;
    submitterId: string;
    status: SubmissionStatus;
    data: JsonValue;
    submittedAt?: string;
    createdAt: string;
  };
}
```

**Errors:**
- `400` - Validation error (missing required fields, invalid data)
- `403` - No submit permission
- `404` - Form not found or not published

---

### GET /api/submissions/[id]
Get a single submission with full data.

**Response (200):**
```typescript
{
  submission: {
    id: string;
    formId: string;
    form: {
      id: string;
      title: string;
      fields: Array<{
        id: string;
        type: FieldType;
        label: string;
        // ... other field properties
      }>;
    };
    submitterId: string;
    submitter: {
      email: string;
      firstName?: string;
      lastName?: string;
    };
    status: SubmissionStatus;
    data: JsonValue;
    submittedAt?: string;
    createdAt: string;
    workflow?: {
      id: string;
      status: string;
      currentStage?: {
        id: string;
        name?: string;
        order: number;
      };
      approvals: Array<{
        id: string;
        stageId: string;
        approver: {
          email: string;
        };
        status: ApprovalStatus;
        comments?: string;
        approvedAt?: string;
        declinedAt?: string;
      }>;
    };
  };
}
```

**Errors:**
- `403` - Insufficient permissions
- `404` - Submission not found

---

### PUT /api/submissions/[id]
Update submission (draft only, or resubmit declined submission).

**Request:**
```typescript
{
  data?: Record<string, any>;
  submit?: boolean;
}
```

**Response (200):**
```typescript
{
  submission: {
    id: string;
    status: SubmissionStatus;
    data: JsonValue;
    submittedAt?: string;
    updatedAt: string;
  };
}
```

**Errors:**
- `400` - Validation error or cannot update (already submitted/approved)
- `403` - Not submitter or insufficient permissions
- `404` - Submission not found

---

### POST /api/submissions/[id]/archive
Archive a submission.

**Response (200):**
```typescript
{
  submission: {
    id: string;
    status: SubmissionStatus;
    archivedAt: string;
  };
}
```

**Errors:**
- `403` - Insufficient permissions
- `404` - Submission not found

---

### POST /api/submissions/export
Export submissions to CSV/Excel.

**Query Parameters:**
- `formId: string` - Required
- `format?: "csv" | "excel"` - Default: "csv"
- `status?: SubmissionStatus` - Filter by status

**Response (200):**
- File download (CSV or Excel)

**Errors:**
- `400` - Missing formId
- `403` - Insufficient permissions
- `404` - Form not found

---

## Workflow Endpoints

### POST /api/workflows
Create a workflow for a form.

**Request:**
```typescript
{
  formId: string;
  type: WorkflowType;
  stages: Array<{
    order: number;
    name?: string;
    type: StageType;
    approverIds: string[];
  }>;
}
```

**Response (201):**
```typescript
{
  workflow: {
    id: string;
    formId: string;
    type: WorkflowType;
    stages: Array<{
      id: string;
      order: number;
      name?: string;
      type: StageType;
      approverIds: string[];
    }>;
  };
}
```

**Errors:**
- `400` - Validation error (no stages, invalid approvers)
- `403` - Not form creator or admin
- `404` - Form not found
- `409` - Workflow already exists for form

---

### GET /api/workflows/[id]
Get workflow details.

**Response (200):**
```typescript
{
  workflow: {
    id: string;
    formId: string;
    type: WorkflowType;
    stages: Array<{
      id: string;
      order: number;
      name?: string;
      type: StageType;
      approverIds: string[];
    }>;
  };
}
```

---

### PUT /api/workflows/[id]
Update workflow.

**Request:**
```typescript
{
  type?: WorkflowType;
  stages?: Array<{
    order: number;
    name?: string;
    type: StageType;
    approverIds: string[];
  }>;
}
```

**Response (200):**
```typescript
{
  workflow: {
    id: string;
    type: WorkflowType;
    stages: Array<{
      id: string;
      order: number;
      name?: string;
      type: StageType;
      approverIds: string[];
    }>;
  };
}
```

**Errors:**
- `400` - Validation error
- `403` - Not form creator or admin
- `404` - Workflow not found

---

## Approval Endpoints

### GET /api/approvals
Get pending approvals for current user.

**Query Parameters:**
- `status?: ApprovalStatus` - Filter by status (default: PENDING)
- `page?: number`
- `limit?: number`

**Response (200):**
```typescript
{
  approvals: Array<{
    id: string;
    instanceId: string;
    stageId: string;
    status: ApprovalStatus;
    submission: {
      id: string;
      form: {
        title: string;
      };
      submitter: {
        email: string;
        firstName?: string;
        lastName?: string;
      };
      data: JsonValue;
      submittedAt?: string;
    };
    stage: {
      name?: string;
      order: number;
    };
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

### POST /api/approvals/[id]/approve
Approve a submission.

**Request:**
```typescript
{
  comments?: string;
}
```

**Response (200):**
```typescript
{
  approval: {
    id: string;
    status: ApprovalStatus;
    approvedAt: string;
  };
  workflow: {
    status: string;
    currentStage?: {
      id: string;
      order: number;
    };
  };
}
```

**Errors:**
- `400` - Approval not in pending status
- `403` - Not the assigned approver
- `404` - Approval not found

---

### POST /api/approvals/[id]/decline
Decline a submission (editable, resubmittable).

**Request:**
```typescript
{
  reason: string;  // Required
  comments?: string;
}
```

**Response (200):**
```typescript
{
  approval: {
    id: string;
    status: ApprovalStatus;
    declinedReason: string;
    declinedAt: string;
  };
  submission: {
    id: string;
    status: SubmissionStatus;  // Changed to DECLINED
  };
}
```

**Errors:**
- `400` - Missing reason or approval not in pending status
- `403` - Not the assigned approver
- `404` - Approval not found

---

### POST /api/approvals/[id]/reject
Reject a submission (final, not resubmittable).

**Request:**
```typescript
{
  reason: string;  // Required
  comments?: string;
}
```

**Response (200):**
```typescript
{
  approval: {
    id: string;
    status: ApprovalStatus;
    declinedReason: string;
    rejectedAt: string;
  };
  submission: {
    id: string;
    status: SubmissionStatus;  // Changed to REJECTED
  };
  workflow: {
    status: string;  // Changed to REJECTED
    completedAt: string;
  };
}
```

**Errors:**
- `400` - Missing reason or approval not in pending status
- `403` - Not the assigned approver
- `404` - Approval not found

---

## Audit Endpoints

### GET /api/audit
Get audit logs.

**Query Parameters:**
- `entityType?: string` - Filter by entity type
- `entityId?: string` - Filter by entity ID
- `action?: AuditAction` - Filter by action
- `userId?: string` - Filter by user
- `startDate?: string` - ISO date string
- `endDate?: string` - ISO date string
- `page?: number`
- `limit?: number`

**Response (200):**
```typescript
{
  logs: Array<{
    id: string;
    userId?: string;
    user?: {
      email: string;
      firstName?: string;
      lastName?: string;
    };
    action: AuditAction;
    entityType: string;
    entityId?: string;
    metadata?: JsonValue;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Errors:**
- `403` - Insufficient permissions (AUDITOR role required)

---

## Error Response Format

All errors follow this format:

```typescript
{
  error: {
    code: string;  // e.g., "VALIDATION_ERROR", "NOT_FOUND", "FORBIDDEN"
    message: string;
    details?: any;  // Additional error details (validation errors, etc.)
  };
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email, workflow exists)
- `500` - Internal Server Error

