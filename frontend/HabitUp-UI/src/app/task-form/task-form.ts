import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Task, IntervalUnit } from '../task.model';
import { TaskService } from '../task.service';

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
    intervalValue: number;
    intervalUnit: IntervalUnit;
    startDate: string;
  }>();
  @Output() cancel = new EventEmitter<void>();

  title = '';
  description = '';
  completed = false;
  intervalValue = 1;
  intervalUnit: IntervalUnit = 'days';
  startDate = '';

  readonly intervalUnits: { value: IntervalUnit; label: string }[] = [
    { value: 'days',   label: 'Day(s)' },
    { value: 'weeks',  label: 'Week(s)' },
    { value: 'months', label: 'Month(s)' },
  ];

  constructor(private taskService: TaskService) {}

  get isEditMode(): boolean {
    return this.task !== null;
  }

  ngOnInit(): void {
    if (this.task) {
      this.title         = this.task.title;
      this.description   = this.task.description;
      this.completed     = this.task.completed;
      this.intervalValue = this.task.intervalValue;
      this.intervalUnit  = this.task.intervalUnit;
      this.startDate     = this.task.startDate;
    } else {
      this.startDate = this.taskService.todayStr();
    }
  }

  onSave(): void {
    if (!this.title.trim() || !this.startDate) return;
    this.save.emit({
      title:         this.title.trim(),
      description:   this.description.trim(),
      completed:     this.completed,
      intervalValue: this.intervalValue,
      intervalUnit:  this.intervalUnit,
      startDate:     this.startDate,
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
