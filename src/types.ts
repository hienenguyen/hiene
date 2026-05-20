/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
}

export interface AppState {
  currentCourse: Course;
  courseHistory: Course[];
}
