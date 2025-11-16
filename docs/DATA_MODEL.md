# Data Model Documentation

## Overview

The data model is designed to support:
- Multi-user form creation and management
- Flexible form field types with display logic
- Form submissions with draft/submitted states
- Multi-stage approval workflows
- Comprehensive audit trails
- Permission-based access control

---

## Entity Relationship Diagram

```
User
  ├── createdForms (Form)
  ├── submissions (FormSubmission)
  ├── workflowApprovals (Approval)
  └── auditLogs (AuditLog)

Form
  ├── creator (User)
  ├── fields (FormField[])
  ├── submissions (FormSubmission[])
  └── workflow (Workflow?)

FormField
  └── form (Form)

FormSubmission
  ├── form (Form)
  ├── submitter (User)
  ├── workflow (WorkflowInstance?)
  └── auditLogs (AuditLog[])

Workflow
  ├── form (Form)
  ├── stages (WorkflowStage[])
  └── instances (WorkflowInstance[])

WorkflowStage
  ├── workflow (Workflow)
  └── approvals (Approval[])

WorkflowInstance
  ├── workflow (Workflow)
  ├── submission (FormSubmission)
  └── approvals (Approval[])

Approval
  ├── instance (WorkflowInstance)
  ├── stage (WorkflowStage)
  └── approver (User)

AuditLog
  └── user (User?)
```

---

## Entity Details

### User

**Purpose:** Represents system users (form creators, submitters, approvers, auditors).

**Fields:**
- `id` (String, CUID) - Primary key
- `email` (String, unique) - User email (login identifier)
- `passwordHash` (String) - Bcrypt hashed password
- `firstName` (String, optional) - User's first name
- `lastName` (String, optional) - User's last name
- `roles` (UserRole[]) - Array of roles (ADMIN, FORM_CREATOR, SUBMITTER, APPROVER, AUDITOR)
- `isActive` (Boolean, default: true) - Account status
- `createdAt` (DateTime) - Account creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `email` - For fast login lookups
- `isActive` - For filtering active users

**Relations:**
- One-to-many with `Form` (as creator)
- One-to-many with `FormSubmission` (as submitter)
- One-to-many with `Approval` (as approver)
- One-to-many with `AuditLog` (as actor)

---

### Session

**Purpose:** Manages user authentication sessions.

**Fields:**
- `id` (String, CUID) - Primary key
- `userId` (String) - Foreign key to User
- `token` (String, unique) - Session token
- `expiresAt` (DateTime) - Session expiration
- `createdAt` (DateTime) - Session creation timestamp

**Indexes:**
- `token` - For session validation
- `userId` - For user session lookups
- `expiresAt` - For cleanup of expired sessions

---

### Form

**Purpose:** Represents a form template that can be filled out by users.

**Fields:**
- `id` (String, CUID) - Primary key
- `title` (String) - Form title
- `description` (String, optional) - Form description
- `status` (FormStatus) - DRAFT, PUBLISHED, ARCHIVED
- `creatorId` (String) - Foreign key to User (form creator)
- `permissions` (JSON, optional) - Permission structure:
  ```json
  {
    "canBuild": ["userId1", "userId2"],
    "canSubmit": ["userId1", "userId2"],
    "canView": ["userId1", "userId2"]
  }
  ```
- `createdAt` (DateTime) - Form creation timestamp
- `updatedAt` (DateTime) - Last update timestamp
- `publishedAt` (DateTime, optional) - When form was published

**Indexes:**
- `creatorId` - For user's forms lookup
- `status` - For filtering by status
- `createdAt` - For sorting/archiving

**Relations:**
- Many-to-one with `User` (creator)
- One-to-many with `FormField`
- One-to-many with `FormSubmission`
- One-to-one with `Workflow` (optional)

**Business Rules:**
- Only forms with status PUBLISHED can be submitted
- Forms with submissions cannot be deleted (soft delete via ARCHIVED status)
- Permissions inherit from folder settings (future enhancement)

---

### FormField

**Purpose:** Represents a single field within a form.

**Fields:**
- `id` (String, CUID) - Primary key
- `formId` (String) - Foreign key to Form
- `type` (FieldType) - Field type (TEXT, TEXTAREA, NUMBER, EMAIL, etc.)
- `label` (String) - Field label
- `placeholder` (String, optional) - Placeholder text
- `required` (Boolean, default: false) - Whether field is required
- `order` (Int, default: 0) - Display order
- `config` (JSON, optional) - Field-specific configuration:
  ```json
  // For SELECT/MULTISELECT:
  {
    "options": [
      { "label": "Option 1", "value": "opt1" },
      { "label": "Option 2", "value": "opt2" }
    ]
  }
  
  // For NUMBER:
  {
    "min": 0,
    "max": 100,
    "step": 1
  }
  
  // For FILE_UPLOAD:
  {
    "maxSize": 5242880,  // bytes
    "allowedTypes": ["pdf", "jpg", "png"]
  }
  ```
- `displayLogic` (JSON, optional) - Display logic (Release 1: single trigger):
  ```json
  {
    "triggerFieldId": "fieldId123",
    "triggerValue": "yes",
    "operator": "equals"  // equals, not_equals, contains, etc.
  }
  ```
- `isPrivate` (Boolean, default: false) - Only visible to form creator/admins
- `createdAt` (DateTime) - Field creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `formId` - For form fields lookup
- `order` - For sorting fields

**Relations:**
- Many-to-one with `Form`

**Business Rules:**
- Fields can be reordered via `order` field
- Display logic triggers show/hide behavior (Release 1: single trigger only)
- Private fields are hidden from submitters

---

### FormSubmission

**Purpose:** Represents a user's submission of a form.

**Fields:**
- `id` (String, CUID) - Primary key
- `formId` (String) - Foreign key to Form
- `submitterId` (String) - Foreign key to User (submitter)
- `status` (SubmissionStatus) - DRAFT, SUBMITTED, APPROVED, DECLINED, REJECTED, ARCHIVED
- `data` (JSON) - Submission data structure:
  ```json
  {
    "fieldId1": "value1",
    "fieldId2": "value2",
    "fieldId3": ["option1", "option2"]  // For multiselect
  }
  ```
- `submittedAt` (DateTime, optional) - When submission was finalized
- `completedAt` (DateTime, optional) - When workflow completed
- `archivedAt` (DateTime, optional) - When submission was archived
- `createdAt` (DateTime) - Submission creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `formId` - For form submissions lookup
- `submitterId` - For user submissions lookup
- `status` - For filtering by status
- `submittedAt` - For sorting submissions

**Relations:**
- Many-to-one with `Form`
- Many-to-one with `User` (submitter)
- One-to-one with `WorkflowInstance` (optional, if workflow exists)
- One-to-many with `AuditLog`

**Business Rules:**
- DRAFT submissions can be edited by submitter
- SUBMITTED submissions trigger workflow (if configured)
- DECLINED submissions can be resubmitted by submitter
- REJECTED submissions are final and cannot be resubmitted
- Only SUBMITTED or later status submissions trigger workflows

---

### Workflow

**Purpose:** Defines the approval workflow structure for a form.

**Fields:**
- `id` (String, CUID) - Primary key
- `formId` (String, unique) - Foreign key to Form (one workflow per form)
- `type` (WorkflowType) - SEQUENTIAL, PARALLEL, ALL_MUST_APPROVE
- `createdAt` (DateTime) - Workflow creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relations:**
- One-to-one with `Form`
- One-to-many with `WorkflowStage`
- One-to-many with `WorkflowInstance`

**Business Rules:**
- One workflow per form (enforced by unique constraint)
- Workflow type determines how stages execute

---

### WorkflowStage

**Purpose:** Represents a single stage in an approval workflow.

**Fields:**
- `id` (String, CUID) - Primary key
- `workflowId` (String) - Foreign key to Workflow
- `order` (Int, default: 0) - Stage execution order
- `name` (String, optional) - Stage name (e.g., "Manager Approval", "Finance Review")
- `type` (StageType) - SEQUENTIAL, PARALLEL, ALL_MUST_APPROVE
- `approverIds` (JSON) - Array of user IDs:
  ```json
  ["userId1", "userId2", "userId3"]
  ```
- `createdAt` (DateTime) - Stage creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `workflowId` - For workflow stages lookup
- `order` - For sorting stages

**Relations:**
- Many-to-one with `Workflow`
- One-to-many with `Approval`

**Business Rules:**
- Stages execute in `order` sequence
- Stage type determines approval requirements:
  - SEQUENTIAL: Approvers approve one after another
  - PARALLEL: All approvers can approve simultaneously
  - ALL_MUST_APPROVE: All approvers must approve to proceed

---

### WorkflowInstance

**Purpose:** Represents an active workflow execution for a specific submission.

**Fields:**
- `id` (String, CUID) - Primary key
- `workflowId` (String) - Foreign key to Workflow
- `submissionId` (String, unique) - Foreign key to FormSubmission
- `currentStageId` (String, optional) - Current active stage ID
- `status` (String) - IN_PROGRESS, COMPLETED, REJECTED
- `startedAt` (DateTime) - When workflow started
- `completedAt` (DateTime, optional) - When workflow completed

**Indexes:**
- `workflowId` - For workflow instances lookup
- `submissionId` - For submission workflow lookup
- `status` - For filtering by status

**Relations:**
- Many-to-one with `Workflow`
- One-to-one with `FormSubmission`
- One-to-many with `Approval`

**Business Rules:**
- Created automatically when a SUBMITTED submission has a workflow
- Progresses through stages based on workflow type
- Completes when final stage is approved or any stage is rejected

---

### Approval

**Purpose:** Represents an individual approver's action on a workflow stage.

**Fields:**
- `id` (String, CUID) - Primary key
- `instanceId` (String) - Foreign key to WorkflowInstance
- `stageId` (String) - Foreign key to WorkflowStage
- `approverId` (String) - Foreign key to User (approver)
- `status` (ApprovalStatus) - PENDING, APPROVED, DECLINED, REJECTED
- `comments` (String, optional) - General comments
- `declinedReason` (String, optional) - Reason for decline/rejection
- `approvedAt` (DateTime, optional) - Approval timestamp
- `declinedAt` (DateTime, optional) - Decline timestamp
- `rejectedAt` (DateTime, optional) - Rejection timestamp
- `createdAt` (DateTime) - Approval record creation
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `instanceId` - For workflow instance approvals lookup
- `stageId` - For stage approvals lookup
- `approverId` - For user approvals lookup
- `status` - For filtering pending approvals

**Relations:**
- Many-to-one with `WorkflowInstance`
- Many-to-one with `WorkflowStage`
- Many-to-one with `User` (approver)

**Business Rules:**
- Created when workflow instance reaches a stage where user is an approver
- PENDING status means approval is required
- APPROVED moves workflow to next stage (if applicable)
- DECLINED allows submitter to resubmit (editable)
- REJECTED is final and stops workflow

---

### AuditLog

**Purpose:** Tracks all system actions for compliance and auditing.

**Fields:**
- `id` (String, CUID) - Primary key
- `userId` (String, optional) - Foreign key to User (actor)
- `action` (AuditAction) - Action type (FORM_CREATED, SUBMISSION_SUBMITTED, etc.)
- `entityType` (String) - Entity type ("Form", "Submission", "Workflow", etc.)
- `entityId` (String, optional) - Entity ID
- `metadata` (JSON, optional) - Additional context:
  ```json
  {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "previousValue": "...",
    "newValue": "..."
  }
  ```
- `createdAt` (DateTime) - Action timestamp

**Indexes:**
- `userId` - For user action lookup
- `action` - For action type filtering
- `[entityType, entityId]` - Composite index for entity lookup
- `createdAt` - For time-based queries

**Relations:**
- Many-to-one with `User` (optional, nullable for system actions)

**Business Rules:**
- Created for all significant actions (create, update, delete, approve, etc.)
- Immutable (never updated or deleted)
- Used for compliance reporting and debugging

---

## Enums

### UserRole
- `ADMIN` - Full system access
- `FORM_CREATOR` - Can create and manage forms
- `SUBMITTER` - Can submit forms
- `APPROVER` - Can approve submissions
- `AUDITOR` - Can view audit logs and exports

### FormStatus
- `DRAFT` - Form is being edited
- `PUBLISHED` - Form is available for submission
- `ARCHIVED` - Form is archived (read-only)

### FieldType
- `TEXT` - Single-line text input
- `TEXTAREA` - Multi-line text input
- `NUMBER` - Numeric input
- `EMAIL` - Email input with validation
- `PHONE` - Phone number input
- `DATE` - Date picker
- `DATETIME` - Date and time picker
- `SELECT` - Single-select dropdown
- `MULTISELECT` - Multi-select dropdown
- `CHECKBOX` - Checkbox
- `RADIO` - Radio button group
- `FILE_UPLOAD` - File upload
- `SIGNATURE` - Digital signature capture

### SubmissionStatus
- `DRAFT` - Submission is in progress
- `SUBMITTED` - Submission finalized, workflow started
- `APPROVED` - Workflow completed successfully
- `DECLINED` - Declined by approver (resubmittable)
- `REJECTED` - Rejected by approver (final)
- `ARCHIVED` - Submission archived

### WorkflowType
- `SEQUENTIAL` - Stages execute one after another
- `PARALLEL` - All stages execute simultaneously
- `ALL_MUST_APPROVE` - All approvers must approve

### StageType
- `SEQUENTIAL` - Approvers approve one after another
- `PARALLEL` - Approvers can approve simultaneously
- `ALL_MUST_APPROVE` - All approvers must approve

### ApprovalStatus
- `PENDING` - Awaiting approval
- `APPROVED` - Approved
- `DECLINED` - Declined (resubmittable)
- `REJECTED` - Rejected (final)

### AuditAction
- `FORM_CREATED`, `FORM_UPDATED`, `FORM_PUBLISHED`, `FORM_ARCHIVED`
- `SUBMISSION_CREATED`, `SUBMISSION_SUBMITTED`, `SUBMISSION_APPROVED`, `SUBMISSION_DECLINED`, `SUBMISSION_REJECTED`, `SUBMISSION_ARCHIVED`
- `WORKFLOW_CREATED`, `WORKFLOW_UPDATED`
- `APPROVAL_ACTION`
- `PERMISSION_CHANGED`
- `DATA_EXPORTED`

---

## Data Integrity & Constraints

1. **Cascade Deletes:**
   - Deleting a Form cascades to FormFields and FormSubmissions
   - Deleting a Workflow cascades to WorkflowStages and WorkflowInstances
   - Deleting a User cascades to Sessions

2. **Unique Constraints:**
   - User.email (unique)
   - Session.token (unique)
   - Form.workflow (one-to-one)
   - WorkflowInstance.submissionId (one-to-one)

3. **Required Fields:**
   - All primary keys and foreign keys are required
   - Form.title, User.email, User.passwordHash are required

4. **JSON Field Validation:**
   - JSON fields (permissions, config, displayLogic, data, metadata) are validated at application level using Zod schemas

---

## Performance Considerations

1. **Indexes:** All foreign keys and commonly queried fields are indexed
2. **Pagination:** All list endpoints support pagination
3. **Query Optimization:** Use Prisma's `select` and `include` to limit data fetched
4. **Archival:** Old submissions can be archived to separate tables (future enhancement)

---

## Future Enhancements (Post-Release 1)

1. **Multi-condition Logic:** AND/OR operators for display logic
2. **Public Forms:** External form access with token-based authentication
3. **Folder Permissions:** Hierarchical permission inheritance
4. **SharePoint Integration:** Automatic submission storage
5. **Advanced Workflows:** Conditional routing, time-based approvals
6. **Form Templates:** Pre-built form templates library

