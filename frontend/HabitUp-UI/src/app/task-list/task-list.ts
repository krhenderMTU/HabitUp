import { Component, inject, OnInit, OnDestroy, AfterViewChecked, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../task.service';
import { TaskFormComponent } from '../task-form/task-form';
import { Task } from '../task.model';
import { julianToDisplay, todayJulian, toJulian, fromJulian } from '../julian-date.util';
import { Chart } from 'chart.js/auto';

interface CalendarDay {
  jdn: number;
  date: Date;
  completionRate: number;
  completedCount: number;
  totalActive: number;
  isToday: boolean;
}

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, TaskFormComponent, FormsModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskListComponent implements OnInit, OnDestroy, AfterViewChecked {
  private taskService = inject(TaskService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  readonly tasks = this.taskService.tasks;

  showForm = false;
  editingTask: Task | null = null;

  statsOpenFor = new Set<number>();
  deleteConfirmFor: number | null = null;

  taskOrder: number[] = [];
  draggedId: number | null = null;

  searchQuery = '';
  searchDropdownOpen = false;

  glowingTaskId: number | null = null;
  private glowTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Calendar ─────────────────────────────────────────────────────────────
  showCalendar = false;
  readonly today = new Date();

  // ── Reminder ─────────────────────────────────────────────────────────────
  showReminderForm = false;
  showReminderPopup = false;
  reminderTime = '';
  reminderActive = false;
  private reminderInterval: ReturnType<typeof setInterval> | null = null;
  // Tracks which HH:MM the reminder last fired to prevent double-firing
  private lastReminderFiredAt = '';

  // ── Periodic checks ───────────────────────────────────────────────────────
  private resetInterval: ReturnType<typeof setInterval> | null = null;

  // ── Chart instances keyed by task ID ─────────────────────────────────────
  private chartInstances = new Map<number, Chart>();
  private pendingCharts = new Set<number>();

  julianToDisplay = julianToDisplay;

  ngOnInit(): void {
    this.taskService.loadTasks();
    setTimeout(() => {
      this.syncOrder();
      this.checkAndResetExpiredTasks();
    }, 600);
    this.resetInterval = setInterval(() => this.checkAndResetExpiredTasks(), 60_000);
  }

  /**
   * After every render cycle, inspect every open stats panel:
   *   - If the canvas exists but no chart → build it (first open)
   *   - If the canvas exists but the existing chart references a different
   *     (stale) canvas element → Angular recreated it after a signal update,
   *     so destroy the old chart and rebuild on the new canvas
   * This means the chart always stays current after check/uncheck.
   */
  ngAfterViewChecked(): void {
    for (const id of this.statsOpenFor) {
      const el = document.getElementById(`task-chart-${id}`) as HTMLCanvasElement | null;
      if (!el) continue;

      const existing = this.chartInstances.get(id);
      if (!existing) {
        this.pendingCharts.add(id);
      } else if (existing.canvas !== el) {
        // Angular destroyed and recreated the canvas — rebuild
        existing.destroy();
        this.chartInstances.delete(id);
        this.pendingCharts.add(id);
      }
    }

    if (this.pendingCharts.size === 0) return;

    for (const id of [...this.pendingCharts]) {
      const task = this.tasks().find(t => t.id === id);
      if (!task) continue;
      const el = document.getElementById(`task-chart-${id}`) as HTMLCanvasElement | null;
      if (el) {
        this.buildPCChart(task);
        this.pendingCharts.delete(id);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.resetInterval) clearInterval(this.resetInterval);
    if (this.reminderInterval) clearInterval(this.reminderInterval);
    if (this.glowTimer) clearTimeout(this.glowTimer);
    this.chartInstances.forEach(c => c.destroy());
  }

  // ── Task ordering ─────────────────────────────────────────────────────────

  private syncOrder(): void {
    const currentIds = this.tasks().map(t => t.id);
    for (const id of currentIds) {
      if (!this.taskOrder.includes(id)) this.taskOrder.push(id);
    }
    this.taskOrder = this.taskOrder.filter(id => currentIds.includes(id));
  }

  get orderedTasks(): Task[] {
    const taskMap = new Map(this.tasks().map(t => [t.id, t]));
    const result: Task[] = [];
    for (const id of this.taskOrder) {
      const t = taskMap.get(id);
      if (t) result.push(t);
    }
    for (const t of this.tasks()) {
      if (!this.taskOrder.includes(t.id)) result.push(t);
    }
    return result;
  }

  // ── Auto-reset expired tasks ──────────────────────────────────────────────

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
          task.id, task.title, task.description,
          false, task.dateStarted, task.dateCompleted, task.completionInterval
        );
      }
    }
  }

  // ── Quick complete ────────────────────────────────────────────────────────

  quickToggleComplete(task: Task): void {
    this.taskService.updateTask(
      task.id, task.title, task.description,
      !task.completed, task.dateStarted, task.dateCompleted, task.completionInterval
    );
  }

  // ── Stats panels ──────────────────────────────────────────────────────────

  toggleStats(id: number): void {
    if (this.statsOpenFor.has(id)) {
      this.statsOpenFor.delete(id);
      this.chartInstances.get(id)?.destroy();
      this.chartInstances.delete(id);
      this.pendingCharts.delete(id);
    } else {
      this.statsOpenFor.add(id);
      this.pendingCharts.add(id);
    }
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

  buildPCChart(task: Task): void {
    this.chartInstances.get(task.id)?.destroy();
    this.chartInstances.delete(task.id);

    const element = document.getElementById(`task-chart-${task.id}`) as HTMLCanvasElement | null;
    if (!element) return;

    const days = todayJulian() - task.dateStarted;
    const expected = task.completionInterval !== null
      ? Math.max(1, days / task.completionInterval)
      : 1;

    const completed = task.timesCompleted;
    const missed = Math.max(0, Math.round(expected) - completed);

    const chart = new Chart(element, {
      type: 'pie',
      data: {
        labels: ['Completed', 'Missed'],
        datasets: [{
          data: [completed, missed],
          backgroundColor: ['#22c55e', '#3b3b5c'],
          borderColor: ['#16a34a', '#2a2a4a'],
          borderWidth: 1,
          hoverOffset: 4
        }]
      },
      options: {
        // Disable responsive mode so Chart.js doesn't try to fill an
        // unsized container and render huge on first paint
        responsive: false,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: {
              color: '#c0c0dd',
              font: { family: 'DM Sans', size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed}`
            }
          }
        }
      }
    });

    this.chartInstances.set(task.id, chart);
  }

  // ── Calendar ─────────────────────────────────────────────────────────────

  toggleCalendar(): void {
    this.showCalendar = !this.showCalendar;
  }

  get calendarData(): (CalendarDay | null)[] {
    const year = new Date().getFullYear();
    const jan1 = new Date(year, 0, 1);
    const jan1Jdn = toJulian(jan1);
    const todayJdn = todayJulian();
    const startPadding = jan1.getDay();

    const cells: (CalendarDay | null)[] = Array(startPadding).fill(null);
    const allTasks = this.tasks();

    for (let jdn = jan1Jdn; jdn <= todayJdn; jdn++) {
      const date = fromJulian(jdn);
      const activeTasks = allTasks.filter(t => t.dateStarted <= jdn);
      const completedCount = allTasks.filter(t => t.dateCompleted === jdn).length;
      const totalActive = activeTasks.length;
      const completionRate = totalActive > 0 ? completedCount / totalActive : 0;

      cells.push({ jdn, date, completionRate, completedCount, totalActive, isToday: jdn === todayJdn });
    }

    return cells;
  }

  get calendarMonths(): { label: string; leftPx: number }[] {
    const CELL = 15;
    const year = new Date().getFullYear();
    const jan1 = new Date(year, 0, 1);
    const jan1Jdn = toJulian(jan1);
    const startPadding = jan1.getDay();
    const todayJdn = todayJulian();
    const result: { label: string; leftPx: number }[] = [];

    for (let m = 0; m < 12; m++) {
      const d = new Date(year, m, 1);
      const jdn = toJulian(d);
      if (jdn > todayJdn) break;
      const cellIndex = startPadding + (jdn - jan1Jdn);
      const col = Math.floor(cellIndex / 7);
      result.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        leftPx: col * CELL
      });
    }

    return result;
  }

  calendarCellClass(day: CalendarDay): string {
    let cls = 'cal-cell';
    if (day.isToday) cls += ' cal-cell--today';
    if (day.totalActive === 0 || day.completionRate === 0) return cls + ' cal-cell--none';
    if (day.completionRate < 0.25) return cls + ' cal-cell--low';
    if (day.completionRate < 0.50) return cls + ' cal-cell--mid-low';
    if (day.completionRate < 0.75) return cls + ' cal-cell--mid';
    return cls + ' cal-cell--high';
  }

  calendarTooltip(day: CalendarDay): string {
    const d = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (day.totalActive === 0) return `${d}: No active tasks`;
    return `${d}: ${day.completedCount}/${day.totalActive} completed (${Math.round(day.completionRate * 100)}%)`;
  }

  // ── Reminder ─────────────────────────────────────────────────────────────

  toggleReminderForm(): void {
    this.showReminderForm = !this.showReminderForm;
  }

  setReminder(): void {
    if (!this.reminderTime) return;
    this.reminderActive = true;
    this.showReminderForm = false;
    // Reset fired-at so the new reminder time can trigger
    this.lastReminderFiredAt = '';

    if (this.reminderInterval) clearInterval(this.reminderInterval);

    this.zone.runOutsideAngular(() => {
      this.reminderInterval = setInterval(() => this.checkReminder(), 30_000);
    });

    // Don't check immediately — wait for the interval so we never fire
    // at the wrong minute just because the user happened to set the reminder
    // in the same minute as the target time
  }

  clearReminder(): void {
    this.reminderTime = '';
    this.reminderActive = false;
    this.showReminderForm = false;
    this.lastReminderFiredAt = '';
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
  }

  private checkReminder(): void {
    const now = new Date();
    const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Only fire once per minute — if we already fired at this HH:MM, skip
    if (current !== this.reminderTime || current === this.lastReminderFiredAt) return;

    const pending = this.tasks().filter(t => !t.completed);
    if (pending.length > 0) {
      this.lastReminderFiredAt = current;
      this.zone.run(() => {
        this.showReminderPopup = true;
        this.cdr.detectChanges();
      });
    }
  }

  dismissReminderPopup(): void {
    this.showReminderPopup = false;
  }

  get pendingCount(): number {
    return this.tasks().filter(t => !t.completed).length;
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  requestDelete(id: number): void { this.deleteConfirmFor = id; }
  cancelDelete(): void { this.deleteConfirmFor = null; }

  confirmDelete(id: number): void {
    this.taskService.deleteTask(id);
    this.taskOrder = this.taskOrder.filter(i => i !== id);
    this.statsOpenFor.delete(id);
    this.statsOpenFor = new Set(this.statsOpenFor);
    this.chartInstances.get(id)?.destroy();
    this.chartInstances.delete(id);
    this.pendingCharts.delete(id);
    this.deleteConfirmFor = null;
  }

  // ── Search ────────────────────────────────────────────────────────────────

  get searchResults(): Task[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return [];
    return this.tasks().filter(t => t.title.toLowerCase().includes(q)).slice(0, 8);
  }

  onSearchFocus(): void { this.searchDropdownOpen = true; }
  onSearchBlur(): void { setTimeout(() => { this.searchDropdownOpen = false; }, 200); }

  onSearchSelect(task: Task): void {
    this.taskOrder = [task.id, ...this.taskOrder.filter(id => id !== task.id)];
    this.searchQuery = '';
    this.searchDropdownOpen = false;
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

  onDragEnd(): void { this.draggedId = null; }

  // ── Form ──────────────────────────────────────────────────────────────────

  openCreateForm(): void { this.editingTask = null; this.showForm = true; }
  openEditForm(task: Task): void { this.editingTask = task; this.showForm = true; }

  onSave(data: {
    title: string; description: string; completed: boolean;
    dateStarted: number; dateCompleted: number | null; completionInterval: number | null;
  }): void {
    if (this.editingTask) {
      this.taskService.updateTask(
        this.editingTask.id, data.title, data.description, data.completed,
        data.dateStarted, data.dateCompleted, data.completionInterval
      );
    } else {
      this.taskService.addTask(
        data.title, data.description, data.completed,
        data.dateStarted, data.completionInterval
      );
      setTimeout(() => this.syncOrder(), 200);
    }
    this.closeForm();
  }

  closeForm(): void { this.showForm = false; this.editingTask = null; }
}
