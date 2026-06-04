export type CaseStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_APPROVAL'
  | 'OPENED'
  | 'ASSIGNED'
  | 'IN_DESIGN'
  | 'PENDING_QC'
  | 'QC_REJECTED'
  | 'PENDING_CLIENT_REVIEW'
  | 'CLIENT_REJECTED'
  | 'APPROVED'
  | 'CANCELLED';

export type FileCategory = 'SCAN' | 'PHOTO' | 'XRAY' | 'PRODUCTION' | 'OTHER';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export type AlignmentGoal = 'MAINTAIN' | 'IMPROVE' | 'IDEALIZE';
export type ProcedureOption = 'YES' | 'NO' | 'ONLY_IF_NEEDED';
export type MidlinePosition = 'CENTERED' | 'SHIFTED_RIGHT' | 'SHIFTED_LEFT';

export interface CasePatient {
  id: string;
  name: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface CaseUserRef {
  id: string;
  name: string;
  email: string;
  employeeType?: string | null;
}

export interface CaseFile {
  id: string;
  caseId: string;
  category: FileCategory;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface CasePayment {
  id: string;
  caseId: string;
  amount: number;
  status: PaymentStatus;
  externalId?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface CaseWorkflowLog {
  id: string;
  caseId: string;
  fromStatus: CaseStatus | null;
  toStatus: CaseStatus;
  performedById: string;
  note?: string | null;
  createdAt: string;
  performedBy?: CaseUserRef;
}

export interface ProductionUrl {
  id: string;
  caseId: string;
  url: string;
  description?: string | null;
  addedById: string;
  createdAt: string;
  addedBy?: CaseUserRef;
}

export interface Prescription {
  id: string;
  caseId: string;
  durationRecommended: boolean;
  durationLimitSteps?: number | null;
  chiefComplaint: string;
  upperMidlinePosition: MidlinePosition;
  upperMidlineShiftMm?: number | null;
  lowerMidlinePosition: MidlinePosition;
  lowerMidlineShiftMm?: number | null;
  canineRelationshipRight?: string | null;
  canineRelationshipLeft?: string | null;
  molarRelationshipRight?: string | null;
  molarRelationshipLeft?: string | null;
  treatUpperArch: boolean;
  treatLowerArch: boolean;
  upperMidlineGoal: AlignmentGoal;
  lowerMidlineGoal: AlignmentGoal;
  overjetGoal: AlignmentGoal;
  overbiteGoal: AlignmentGoal;
  archFormGoal: AlignmentGoal;
  canineRelationshipGoal: AlignmentGoal;
  molarRelationshipGoal: AlignmentGoal;
  posteriorRelationshipGoal: AlignmentGoal;
  iprOption: ProcedureOption;
  engagersOption: ProcedureOption;
  proclineOption: ProcedureOption;
  expandOption: ProcedureOption;
  distalizeOption: ProcedureOption;
  avoidEngagersTeeth: number[];
  extractTeeth: number[];
  leaveSpacesTeeth: number[];
  doNotMoveTeeth: number[];
  includeRetainer: boolean;
  additionalInstructions?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CaseRecord {
  id: string;
  patientId: string;
  createdById: string;
  status: CaseStatus;
  designerId?: string | null;
  qcId?: string | null;
  notes?: string | null;
  refinementCount: number;
  paymentProofUrl?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: CasePatient;
  createdBy?: CaseUserRef;
  designer?: CaseUserRef | null;
  qc?: CaseUserRef | null;
  payments?: CasePayment[];
  prescription?: Prescription | null;
  workflowLogs?: CaseWorkflowLog[];
  files?: CaseFile[];
  productionUrls?: ProductionUrl[];
}

export interface CaseCommentAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface CaseComment {
  id: string;
  caseId: string;
  userId: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
  user?: CaseUserRef;
  attachments?: CaseCommentAttachment[];
}

export interface PrescriptionInput {
  durationRecommended?: boolean;
  durationLimitSteps?: number | null;
  chiefComplaint: string;
  upperMidlinePosition?: MidlinePosition;
  upperMidlineShiftMm?: number | null;
  lowerMidlinePosition?: MidlinePosition;
  lowerMidlineShiftMm?: number | null;
  canineRelationshipRight?: string | null;
  canineRelationshipLeft?: string | null;
  molarRelationshipRight?: string | null;
  molarRelationshipLeft?: string | null;
  treatUpperArch?: boolean;
  treatLowerArch?: boolean;
  upperMidlineGoal?: AlignmentGoal;
  lowerMidlineGoal?: AlignmentGoal;
  overjetGoal?: AlignmentGoal;
  overbiteGoal?: AlignmentGoal;
  archFormGoal?: AlignmentGoal;
  canineRelationshipGoal?: AlignmentGoal;
  molarRelationshipGoal?: AlignmentGoal;
  posteriorRelationshipGoal?: AlignmentGoal;
  iprOption?: ProcedureOption;
  engagersOption?: ProcedureOption;
  proclineOption?: ProcedureOption;
  expandOption?: ProcedureOption;
  distalizeOption?: ProcedureOption;
  avoidEngagersTeeth?: number[];
  extractTeeth?: number[];
  leaveSpacesTeeth?: number[];
  doNotMoveTeeth?: number[];
  includeRetainer?: boolean;
  additionalInstructions?: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  employeeType?: string | null;
  createdAt: string;
  updatedAt?: string;
}
