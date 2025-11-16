import { WorkflowType, StageType, ApprovalStatus } from '@prisma/client'

export type WorkflowWithStages = {
  id: string
  formId: string
  type: WorkflowType
  createdAt: Date
  updatedAt: Date
  stages: WorkflowStage[]
}

export type WorkflowStage = {
  id: string
  workflowId: string
  order: number
  name?: string | null
  type: StageType
  approverIds: string[]
  createdAt: Date
  updatedAt: Date
}

export type WorkflowInstanceWithDetails = {
  id: string
  workflowId: string
  submissionId: string
  currentStageId?: string | null
  status: string
  startedAt: Date
  completedAt?: Date | null
  workflow?: {
    id: string
    type: WorkflowType
    stages: WorkflowStage[]
  }
  approvals?: Approval[]
}

export type Approval = {
  id: string
  instanceId: string
  stageId: string
  approverId: string
  status: ApprovalStatus
  comments?: string | null
  declinedReason?: string | null
  approvedAt?: Date | null
  declinedAt?: Date | null
  rejectedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  approver?: {
    email: string
    firstName?: string | null
    lastName?: string | null
  }
  stage?: {
    name?: string | null
    order: number
  }
}

