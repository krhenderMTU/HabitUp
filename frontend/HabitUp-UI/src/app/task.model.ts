export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;

  /** Julian Day Number of when the task was started. */
  dateStarted: number;

  /** Julian Day Number of when the task was last completed. Null until first completion. */
  dateCompleted: number | null;

  /** Number of times this task has been completed. */
  timesCompleted: number;

  /** Days between each completion. Null = one-time task. */
  completionInterval: number | null;
}

/** Shape of the record the database cares about (used for CSV export). */
export interface TaskRecord {
  id: number;
  date_started: number;
  date_completed: number | null;
  times_completed: number;
  completion_interval: number | null;
}
