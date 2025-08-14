export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

export enum TeacherType {
  TITULAR = 'Titular',
  AUXILIAR = 'Auxiliar',
}

export enum ClassType {
    CALISTENIA = 'Calistenia',
    ESCALADA = 'Escalada',
    BOTH = 'Ambos',
    PONTO = 'Ponto',
    CALISTENIA_KIDS = 'Calistenia Kids',
    FISIOTERAPIA = 'Fisioterapia',
    AULA_LIVRE = 'Aula Livre',
    SUPERVISAO_LIVRE = 'Supervisão Horário Livre',
}

export interface Teacher {
  id: string;
  name: string;
  type: TeacherType;
  contractedHours: number;
}

export interface Student {
  id: string;
  name: string;
}

export interface ScheduleEntry {
  id: string;
  teacherIds: string[];
  studentIds: string[];
  startTime: Date;
  endTime: Date;
  day: number; // 0 for Sunday, 1 for Monday, etc.
  classType: ClassType;
  workLogId?: string;
  isUnplanned?: boolean;
  // New fields for advanced class creation
  capacity?: number;
  isRecurring?: boolean;
  notes?: string;
  considerHolidays?: boolean;
  // PlanMode field
  proposalId?: string;
}

export interface WorkLog {
  id: string;
  teacherId: string;
  checkIn: Date;
  checkOut?: Date;
}

export interface Workload {
  teacherId: string;
  workedHours: number;
  contractedHours: number;
  overtime: number;
  deficit: number;
}

export interface PriorityList {
    titulares: string[]; // Teacher IDs
    auxiliares: string[]; // Teacher IDs
}

export interface ShiftRoster {
    morning: string[]; // Teacher IDs
    afternoon: string[]; // Teacher IDs
}

export interface Announcement {
    id: string;
    message: string;
    date: Date;
}

// AI Feature Types
export interface AISuggestion {
    scheduleEntryId: string;
    newTeacherIds: string[];
    reasoning: string;
}

export interface AIOptimizationResponse {
    summary: string;
    suggestions: AISuggestion[];
}

export interface AIGeneratedScheduleResponse {
  summary: string;
  warnings: string[];
  generatedClasses: {
      teacherIds: string[];
      startTime: string; // "HH:mm"
      endTime: string; // "HH:mm"
      day: number;
      classType: ClassType;
  }[];
}

// PlanMode Feature Types
export type AppMode = 'operational' | 'planning';

export interface CapacityProfile {
  id: string;
  name: string;
  teacherId: string;
  availability: {
    day: number; // 0-6 (Sunday-Saturday)
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
    isAvailable: boolean;
  }[];
  constraints: {
    maxDailyHours: number;
    maxWeeklyHours: number;
    preferredDays: number[];
    unavailableDates: string[]; // ISO date strings
  };
  effectiveDate: string; // ISO date when this profile takes effect
  isCurrent: boolean;
}

export interface ForecastedWorkload {
  id: string;
  teacherId: string;
  weekStartDate: string; // ISO date (Monday)
  projectedHours: number;
  contractedHours: number;
  variance: number; // projected - contracted
  confidenceLevel: number; // 0-1
  forecastSource: 'historical' | 'manual' | 'hybrid';
  notes?: string;
}

export interface ResourceConstraint {
  id: string;
  constraintType: 'room' | 'equipment' | 'student-group' | 'time';
  targetId?: string; // Room ID, equipment ID, etc.
  day: number; // 0-6
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  constraintValue: number; // Max capacity, etc.
  description: string;
}

export interface ScheduleProposal {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string; // ISO date
  status: 'draft' | 'review' | 'approved' | 'rejected';
  baseScheduleId?: string; // Reference to existing schedule
  proposedEntries: ScheduleEntry[];
  conflictAnalysis: {
    teacherConflicts: { teacherId: string; conflicts: string[] }[];
    resourceConflicts: { resourceId: string; conflicts: string[] }[];
    workloadIssues: { teacherId: string; hours: number; contracted: number }[];
  };
  notes?: string;
}