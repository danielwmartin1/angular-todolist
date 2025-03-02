import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-todo-item',
  templateUrl: './todo-item.component.html',
  styleUrls: ['./todo-item.component.css'] // Change from .scss to .css
})
export class TodoItemComponent {
  // Input property to receive a single todo item from the parent component
  @Input() todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string } = {
    id: 0,
    text: '',
    completed: false,
    createdAt: '',
    updatedAt: ''
  };
  
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
