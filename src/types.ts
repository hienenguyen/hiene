/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export interface Session {
  date: string; // YYYY-MM-DD
}

export interface Course {
  id: string;
  courseNumber: number;
  startDate: string;
  sessions: Session[];
  isCompleted: boolean;
  completionDate?: string;
  fee?: number;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  currentCourseId: string;
  totalFees: number;
  updatedAt: string;
}

export interface AppState {
  profile: UserProfile | null;
  currentCourse: Course | null;
  courseHistory: Course[];
  isLoading: boolean;
}
