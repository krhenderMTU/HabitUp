export type IntervalUnit = 'days' | 'weeks' | 'months';

export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  completedDate: string | null; // ISO date string "YYYY-MM-DD" — which day it was completed
  startDate: string;            // ISO date string "YYYY-MM-DD" — when the habit began
  intervalValue: number;        // e.g. 1, 2, 7
  intervalUnit: IntervalUnit;   // 'days' | 'weeks' | 'months'
}
