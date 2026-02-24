import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Task } from '../task.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css'
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null; // null = create mode, Task = edit mode
  @Output() save = new EventEmitter<{ title: string; description: string; completed: boolean }>();
  @Output() cancel = new EventEmitter<void>();

  title = '';
  description = '';
  completed = false;

  get isEditMode(): boolean {
    return this.task !== null;
  }

  ngOnInit(): void {
    if (this.task) {
      this.title = this.task.title;
      this.description = this.task.description;
      this.completed = this.task.completed;
    }
  }

  onSave(): void {
    if (!this.title.trim()) return;
    this.save.emit({ title: this.title.trim(), description: this.description.trim(), completed: this.completed });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
