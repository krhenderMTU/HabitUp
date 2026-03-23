import { Component, inject, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../task.service';
import { TaskFormComponent } from '../task-form/task-form';
import { Task } from '../task.model';
import { julianToDisplay, todayJulian } from '../julian-date.util';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, TaskFormComponent],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);

  readonly tasks = this.taskService.tasks;

  showForm = false;
  editingTask: Task | null = null;

  statsOpenFor: number | null = null;
  deleteConfirmFor: number | null = null;

  julianToDisplay = julianToDisplay;

  ngOnInit(): void {
    this.taskService.loadTasks();
  }

  // ── Stats panel ───────────────────────────────────────────────────────────

  toggleStats(id: number): void {
    this.statsOpenFor = this.statsOpenFor === id ? null : id;
  }

  /**
   * Percent complete = timesCompleted / expected * 100
   *
   * expected = max(1, daysSinceStarted / completionInterval)
   *
   * The minimum expected value is 1 because you are always at least one
   * interval into the task — even on day 0. This means completing a task
   * on the same day it starts correctly gives 100%.
   */
  percentComplete(task: Task): number {
    if (task.completionInterval === null) {
      return task.completed ? 100 : 0;
    }
    const daysSinceStarted = todayJulian() - task.dateStarted;
    const expected = Math.max(1, daysSinceStarted / task.completionInterval);
    return Math.min(Math.round((task.timesCompleted / expected) * 100), 100);
  }

  expectedCompletions(task: Task): string {
    if (task.completionInterval === null) return '—';
    const days = todayJulian() - task.dateStarted;
    return Math.max(1, days / task.completionInterval).toFixed(1);
  }

  // Pie Chart for Displaying Percent Complete
  buildPCChart(task: Task)
  {
    
    const element = document.getElementById('task-chart') as HTMLCanvasElement;

    const chart = new Chart(element, {
      type: 'pie',
      data:{
        labels: ['Days Completed'],
        datasets: [{
          data: [this.percentComplete(task)],
          backgroundColor: ['rgb(87, 25, 214)'],
          hoverOffset: 4
        }],
      }
    });
  }

  // ── Delete with confirmation ──────────────────────────────────────────────

  requestDelete(id: number): void {
    this.deleteConfirmFor = id;
  }

  cancelDelete(): void {
    this.deleteConfirmFor = null;
  }

  confirmDelete(id: number): void {
    this.taskService.deleteTask(id);
    this.deleteConfirmFor = null;
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  openCreateForm(): void {
    this.editingTask = null;
    this.showForm = true;
  }

  openEditForm(task: Task): void {
    this.editingTask = task;
    this.showForm = true;
  }

  onSave(data: {
    title: string;
    description: string;
    completed: boolean;
    dateStarted: number;
    dateCompleted: number | null;
    completionInterval: number | null;
  }): void {
    if (this.editingTask) {
      this.taskService.updateTask(
        this.editingTask.id,
        data.title,
        data.description,
        data.completed,
        data.dateStarted,
        data.dateCompleted,
        data.completionInterval
      );
    } else {
      this.taskService.addTask(
        data.title,
        data.description,
        data.completed,
        data.dateStarted,
        data.completionInterval
      );
    }
    this.closeForm();
  }

  closeForm(): void {
    this.showForm = false;
    this.editingTask = null;
  }
}
