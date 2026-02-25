import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../task.service';
import { TaskFormComponent } from '../task-form/task-form';
import { Task } from '../task.model';
import { julianToDisplay } from '../julian-date.util';

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

  julianToDisplay = julianToDisplay;

  ngOnInit(): void {
    this.taskService.loadTasks();
  }

  get completedCount(): number {
    return this.tasks().filter(t => t.completed).length;
  }

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

  deleteTask(id: number): void {
    this.taskService.deleteTask(id);
  }
}
