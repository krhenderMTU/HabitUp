import { Injectable, signal, computed } from '@angular/core';
import { Task } from './task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private nextId = signal(1);
  private _tasks = signal<Task[]>([]);

  readonly tasks = computed(() => this._tasks());

  addTask(title: string, description: string, completed: boolean): void {
    const task: Task = {
      id: this.nextId(),
      title,
      description,
      completed,
    };
    this._tasks.update(tasks => [...tasks, task]);
    this.nextId.update(id => id + 1);
  }

  updateTask(id: number, title: string, description: string, completed: boolean): void {
    this._tasks.update(tasks =>
      tasks.map(t => t.id === id ? { ...t, title, description, completed } : t)
    );
  }

  deleteTask(id: number): void {
    this._tasks.update(tasks => tasks.filter(t => t.id !== id));
  }
}
