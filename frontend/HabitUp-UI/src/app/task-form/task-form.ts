import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Task } from '../task.model';
import { toJulian, fromJulian, toISODate } from '../julian-date.util';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css'
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null;

  @Output() save = new EventEmitter<{
    title: string;
    description: string;
    completed: boolean;
    dateStarted: number;
    dateCompleted: number | null;
    completionInterval: number | null;
  }>();
  @Output() cancel = new EventEmitter<void>();

  title = '';
  description = '';
  completed = false;
  dateStartedISO = toISODate(new Date());
  dateCompletedISO = '';
  completionIntervalRaw = '';

  get isEditMode(): boolean {
    return this.task !== null;
  }

  get completionInterval(): number | null {
    const parsed = parseInt(this.completionIntervalRaw, 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : null;
  }

  ngOnInit(): void {
    if (this.task) {
      this.title = this.task.title;
      this.description = this.task.description;
      this.completed = this.task.completed;
      this.dateStartedISO = toISODate(fromJulian(this.task.dateStarted));
      this.dateCompletedISO = this.task.dateCompleted
        ? toISODate(fromJulian(this.task.dateCompleted))
        : '';
      this.completionIntervalRaw =
        this.task.completionInterval !== null ? String(this.task.completionInterval) : '';
    }
  }

  onSave(): void {
    if (!this.title.trim()) return;
    this.save.emit({
      title: this.title.trim(),
      description: this.description.trim(),
      completed: this.completed,
      dateStarted: toJulian(this.dateStartedISO),
      dateCompleted: this.dateCompletedISO ? toJulian(this.dateCompletedISO) : null,
      completionInterval: this.completionInterval,
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
