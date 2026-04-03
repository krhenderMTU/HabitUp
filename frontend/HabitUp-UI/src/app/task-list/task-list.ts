import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../task.service';
import { TaskFormComponent } from '../task-form/task-form';
import { Task } from '../task.model';
import { julianToDisplay, todayJulian } from '../julian-date.util';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, TaskFormComponent, FormsModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskListComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);

  readonly tasks = this.taskService.tasks;

  showForm = false;
  editingTask: Task | null = null;

  // Multiple stats panels open simultaneously
  statsOpenFor = new Set<number>();

  // Delete confirmation
  deleteConfirmFor: number | null = null;

  // Drag and drop: ordered array of task IDs
  taskOrder: number[] = [];
  draggedId: number | null = null;

  // Search
  searchQuery = '';
  searchDropdownOpen = false;

  // Glow after search select
  glowingTaskId: number | null = null;
  private glowTimer: ReturnType<typeof setTimeout> | null = null;

  // Periodic interval-reset check
  private resetInterval: ReturnType<typeof setInterval> | null = null;

  julianToDisplay = julianToDisplay;

  ngOnInit(): void {
    this.taskService.loadTasks();
    // Give the signal time to populate before initializing order and checking resets
    setTimeout(() => {
      this.syncOrder();
      this.checkAndResetExpiredTasks();
    }, 600);

    // Re-check every minute so overnight resets apply without a page reload
    this.resetInterval = setInterval(() => this.checkAndResetExpiredTasks(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.resetInterval) clearInterval(this.resetInterval);
    if (this.glowTimer) clearTimeout(this.glowTimer);
  }

  // ── Task ordering ─────────────────────────────────────────────────────────

  /** Keep taskOrder in sync with the current task list. */
  private syncOrder(): void {
    const currentIds = this.tasks().map(t => t.id);
    // Add any new IDs not yet tracked
    for (const id of currentIds) {
      if (!this.taskOrder.includes(id)) this.taskOrder.push(id);
    }
    // Remove any IDs no longer in the task list
    this.taskOrder = this.taskOrder.filter(id => currentIds.includes(id));
  }

  /** Tasks displayed in the user-defined drag-and-drop order. */
  get orderedTasks(): Task[] {
    const taskMap = new Map(this.tasks().map(t => [t.id, t]));
    const result: Task[] = [];
    for (const id of this.taskOrder) {
      const t = taskMap.get(id);
      if (t) result.push(t);
    }
    // Append any tasks not yet in taskOrder (e.g. just created)
    for (const t of this.tasks()) {
      if (!this.taskOrder.includes(t.id)) result.push(t);
    }
    return result;
  }

  // ── Auto-reset expired tasks ──────────────────────────────────────────────

  /**
   * If a task's interval has passed since it was last completed,
   * automatically uncheck it so it can be completed again.
   * Condition: dateCompleted + completionInterval <= today
   */
  private checkAndResetExpiredTasks(): void {
    const today = todayJulian();
    for (const task of this.tasks()) {
      if (
        task.completed &&
        task.completionInterval !== null &&
        task.dateCompleted !== null &&
        task.dateCompleted + task.completionInterval <= today
      ) {
        this.taskService.updateTask(
          task.id,
          task.title,
          task.description,
          false,          // uncheck
          task.dateStarted,
          task.dateCompleted, // keep last completion date on record
          task.completionInterval
        );
      }
    }
  }

  // ── Quick complete (status box button) ───────────────────────────────────

  quickToggleComplete(task: Task): void {
    this.taskService.updateTask(
      task.id,
      task.title,
      task.description,
      !task.completed,
      task.dateStarted,
      task.dateCompleted,
      task.completionInterval
    );
  }

  // ── Stats panels ──────────────────────────────────────────────────────────

  toggleStats(id: number): void {
    if (this.statsOpenFor.has(id)) {
      this.statsOpenFor.delete(id);
    } else {
      this.statsOpenFor.add(id);
    }
    // Reassign to trigger Angular change detection on Set mutation
    this.statsOpenFor = new Set(this.statsOpenFor);
  }

  isStatsOpen(id: number): boolean {
    return this.statsOpenFor.has(id);
  }

  percentComplete(task: Task): number {
    if (task.completionInterval === null) return task.completed ? 100 : 0;
    const days = todayJulian() - task.dateStarted;
    const expected = Math.max(1, days / task.completionInterval);
    return Math.min(Math.round((task.timesCompleted / expected) * 100), 100);
  }

  expectedCompletions(task: Task): string {
    if (task.completionInterval === null) return '—';
    const days = todayJulian() - task.dateStarted;
    return Math.max(1, days / task.completionInterval).toFixed(1);
  }

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
    this.taskOrder = this.taskOrder.filter(i => i !== id);
    this.statsOpenFor.delete(id);
    this.statsOpenFor = new Set(this.statsOpenFor);
    this.deleteConfirmFor = null;
  }

  // ── Search ────────────────────────────────────────────────────────────────

  get searchResults(): Task[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return [];
    return this.tasks()
      .filter(t => t.title.toLowerCase().includes(q))
      .slice(0, 8);
  }

  onSearchFocus(): void {
    this.searchDropdownOpen = true;
  }

  onSearchBlur(): void {
    // Delay so a click on a dropdown item registers before the list hides
    setTimeout(() => { this.searchDropdownOpen = false; }, 200);
  }

  onSearchSelect(task: Task): void {
    // Move to front of display order
    this.taskOrder = [task.id, ...this.taskOrder.filter(id => id !== task.id)];
    this.searchQuery = '';
    this.searchDropdownOpen = false;

    // Apply glow for 2 seconds
    this.glowingTaskId = task.id;
    if (this.glowTimer) clearTimeout(this.glowTimer);
    this.glowTimer = setTimeout(() => { this.glowingTaskId = null; }, 2000);
  }

  // ── Drag and drop ─────────────────────────────────────────────────────────

  onDragStart(id: number, event: DragEvent): void {
    this.draggedId = id;
    event.dataTransfer?.setData('text/plain', String(id));
  }

  onDragOver(event: DragEvent, overId: number): void {
    event.preventDefault();
    if (this.draggedId === null || this.draggedId === overId) return;
    const from = this.taskOrder.indexOf(this.draggedId);
    const to   = this.taskOrder.indexOf(overId);
    if (from === -1 || to === -1) return;
    const next = [...this.taskOrder];
    next.splice(from, 1);
    next.splice(to, 0, this.draggedId);
    this.taskOrder = next;
  }

  onDragEnd(): void {
    this.draggedId = null;
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
      setTimeout(() => this.syncOrder(), 200);
    }
    this.closeForm();
  }

  closeForm(): void {
    this.showForm = false;
    this.editingTask = null;
  }
}
