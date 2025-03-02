import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css']
})
export class TodoListComponent {
  // Input property to receive the list of todos from the parent component
  @Input() todos: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string }[] = [];
  
  // Output events to communicate actions back to the parent component
  @Output() toggleTodoCompletion = new EventEmitter<any>();
  @Output() editTodoText = new EventEmitter<any>();
  @Output() exitEdit = new EventEmitter<any>();
  @Output() cancelEdit = new EventEmitter<any>();
  @Output() updateTodoText = new EventEmitter<any>();
  @Output() removeTodo = new EventEmitter<any>();
  @Output() preventBlur = new EventEmitter<any>();

  // ViewChild to reference the input element for editing
  @ViewChild('editInput') editInput!: ElementRef;
}
