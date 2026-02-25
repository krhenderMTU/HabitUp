import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task } from './task.model';
import { todayJulian } from './julian-date.util';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly apiUrl = 'http://localhost:5245/tasks';

  private http = inject(HttpClient);
  private _tasks = signal<Task[]>([]);

  readonly tasks = computed(() => this._tasks());

  loadTasks(): void {
    this.http.get<Task[]>(this.apiUrl).subscribe(tasks => {
      this._tasks.set(tasks);
    });
  }

  addTask(
    title: string,
    description: string,
    completed: boolean,
    dateStarted: number,
    completionInterval: number | null
  ): void {
    const body = {
      title,
      description,
      completed,
      dateStarted,
      dateCompleted: completed ? todayJulian() : null,
      timesCompleted: completed ? 1 : 0,
      completionInterval,
    };

    this.http.post<Task>(this.apiUrl, body).subscribe(created => {
      this._tasks.update(tasks => [...tasks, created]);
    });
  }

  updateTask(
    id: number,
    title: string,
    description: string,
    completed: boolean,
    dateStarted: number,
    dateCompleted: number | null,
    completionInterval: number | null
  ): void {
    const existing = this._tasks().find(t => t.id === id);
    if (!existing) return;

    const today = todayJulian();
    const wasCompleted = existing.completed;
    const completedToday = existing.dateCompleted === today;

    let newTimesCompleted = existing.timesCompleted;
    let newDateCompleted = dateCompleted ?? existing.dateCompleted;

    if (!wasCompleted && completed) {
      // Checking the box:
      // Only increment if they haven't already completed it today
      if (!completedToday) {
        newTimesCompleted += 1;
        newDateCompleted = today;
      }
      // If completedToday is true, they unchecked and rechecked same day —
      // leave counter and date as-is
    } else if (wasCompleted && !completed) {
      // Unchecking the box:
      // If they completed it today, undo it — decrement and clear the date
      if (completedToday) {
        newTimesCompleted = Math.max(0, newTimesCompleted - 1);
        newDateCompleted = null;
      }
      // If completed on a previous day, just uncheck without touching the counter
    }

    const body = {
      title,
      description,
      completed,
      dateStarted,
      dateCompleted: newDateCompleted,
      timesCompleted: newTimesCompleted,
      completionInterval,
    };

    this.http.put<Task>(`${this.apiUrl}/${id}`, body).subscribe(updated => {
      this._tasks.update(tasks => tasks.map(t => (t.id === id ? updated : t)));
    });
  }

  deleteTask(id: number): void {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
      this._tasks.update(tasks => tasks.filter(t => t.id !== id));
    });
  }
}
