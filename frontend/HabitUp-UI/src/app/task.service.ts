import { Injectable, signal, computed } from '@angular/core';
import { Task, IntervalUnit } from './task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private nextId = signal(1);
  private _tasks = signal<Task[]>([]);

  readonly tasks = computed(() => this._tasks().map(t => this.resetIfDue(t)));

  // ── Helpers ────────────────────────────────────────────────────────────────

  todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  private parseDate(str: string): Date {
    // Parse as local date (avoid UTC offset shifting the day)
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  /**
   * Returns which cycle index (0-based) a given date falls into,
   * relative to the task's startDate and interval.
   *
   * Examples (weekly, start = Mon Feb 23):
   *   Feb 23 → cycle 0   (days 0–6)
   *   Feb 25 → cycle 0
   *   Mar 2  → cycle 1   (days 7–13)
   */
  private cycleIndex(date: Date, startDate: Date, intervalDays: number): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const dayOffset = Math.floor((date.getTime() - startDate.getTime()) / msPerDay);
    if (dayOffset < 0) return -1; // before the habit started
    return Math.floor(dayOffset / intervalDays);
  }

  /**
   * Convert intervalValue + intervalUnit into a number of days.
   * Months use 30-day approximation.
   */
  private intervalInDays(value: number, unit: IntervalUnit): number {
    switch (unit) {
      case 'days':   return value;
      case 'weeks':  return value * 7;
      case 'months': return value * 30;
    }
  }

  /**
   * If the task is completed but the completion was in a past cycle,
   * return it with completed reset to false and completedDate cleared.
   * Otherwise return the task unchanged.
   */
  private resetIfDue(task: Task): Task {
    if (!task.completed || !task.completedDate) return task;

    const start     = this.parseDate(task.startDate);
    const today     = this.parseDate(this.todayStr());
    const completed = this.parseDate(task.completedDate);

    const intervalDays   = this.intervalInDays(task.intervalValue, task.intervalUnit);
    const currentCycle   = this.cycleIndex(today,     start, intervalDays);
    const completedCycle = this.cycleIndex(completed, start, intervalDays);

    if (completedCycle < currentCycle) {
      return { ...task, completed: false, completedDate: null };
    }

    return task;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  addTask(
    title: string,
    description: string,
    completed: boolean,
    intervalValue: number,
    intervalUnit: IntervalUnit,
    startDate: string
  ): void {
    const task: Task = {
      id: this.nextId(),
      title,
      description,
      completed,
      completedDate: completed ? this.todayStr() : null,
      intervalValue,
      intervalUnit,
      startDate,
    };
    this._tasks.update(tasks => [...tasks, task]);
    this.nextId.update(id => id + 1);
  }

  updateTask(
    id: number,
    title: string,
    description: string,
    completed: boolean,
    intervalValue: number,
    intervalUnit: IntervalUnit,
    startDate: string
  ): void {
    this._tasks.update(tasks =>
      tasks.map(t => {
        if (t.id !== id) return t;
        // Stamp completedDate only when newly completing; preserve if already done; clear if unchecking
        const completedDate = completed
          ? (t.completed ? t.completedDate : this.todayStr())
          : null;
        return { ...t, title, description, completed, completedDate, intervalValue, intervalUnit, startDate };
      })
    );
  }

  deleteTask(id: number): void {
    this._tasks.update(tasks => tasks.filter(t => t.id !== id));
  }
}
