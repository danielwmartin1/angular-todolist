import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css']
})
export class TodoListComponent {
  @Input() todos: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string }[] = [];
  @Output() toggleTodoCompletion = new EventEmitter<any>();
  @Output() editTodoText = new EventEmitter<any>();
  @Output() exitEdit = new EventEmitter<any>();
  @Output() cancelEdit = new EventEmitter<any>();
  @Output() updateTodoText = new EventEmitter<any>();
  @Output() removeTodo = new EventEmitter<any>();
  @Output() preventBlur = new EventEmitter<any>();
}
