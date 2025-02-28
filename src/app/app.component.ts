import { Component, OnInit, ElementRef, Renderer2, ViewChild, AfterViewInit } from '@angular/core';
import { TodoService } from './services/todo.service';
import { enableProdMode } from '@angular/core';
import { environment } from '../environments/environment';

// Enable production mode if environment is set to production
if (environment.production) {
  enableProdMode();
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'angular-todolist';
  newTodo = ''; // New todo text input
  todos: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string }[] = [];
  currentYear: number = new Date().getFullYear(); // Current year for footer
  private originalNewTodo = ''; // Store the original newTodo text

  @ViewChild('editInput', { static: false }) editInput!: ElementRef; // Reference to the input element for editing
  @ViewChild('todoInput', { static: false }) todoInput!: ElementRef; // Reference to the addTodo input element
  private documentClickListener: (() => void) | null = null; // Listener for document clicks

  constructor(private el: ElementRef, private renderer: Renderer2, private todoService: TodoService) {
    console.log('AppComponent initialized');
  }

  async ngOnInit() {
    console.log('ngOnInit called');
    await this.fetchTodos(); // Fetch todos on component initialization
  }

  ngAfterViewInit() {
    this.focusAddTodoInput(); // Focus on the addTodo input element after view initialization
    this.setupDocumentClickListener(); // Setup document click listener to handle blur
  }

  private focusAddTodoInput() {
    setTimeout(() => {
      if (this.todoInput && this.todoInput.nativeElement) {
        this.todoInput.nativeElement.focus(); // Focus on the addTodo input element
      }
    }, 0);
  }

  private setupDocumentClickListener() {
    this.documentClickListener = this.renderer.listen('document', 'click', (event: Event) => {
      if (this.todoInput && !this.el.nativeElement.contains(event.target)) {
        this.newTodo = ''; // Revert the state of the addTodo input element to blank
        this.todoInput.nativeElement.blur(); // Blur the addTodo input element
      }
    });
  }

  async fetchTodos() {
    try {
      const todos = await this.todoService.fetchTodos();
      this.todos = todos.map(todo => ({
        ...todo,
        completed: todo.completed || false,
        createdAt: todo.createdAt || new Date().toISOString(),
        updatedAt: todo.updatedAt || new Date().toISOString(),
        completedAt: todo.completed ? todo.updatedAt : undefined,
        originalText: todo.text // Store the original text
      }));
      console.log('Fetched todos:', this.todos);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  }

  async addTodo() {
    console.log('addTodo called with newTodo:', this.newTodo);
    this.newTodo = this.newTodo.trim(); // Trim the text input
    if (this.newTodo) {
      try {
        const newTodo = await this.todoService.addTodo(this.newTodo);
        this.todos.push({ ...newTodo, editing: false, originalText: newTodo.text });
        this.sortTodos(); // Sort todos after adding a new one
        this.newTodo = ''; // Clear the input field
        this.focusAddTodoInput(); // Focus on the addTodo input element
        console.log('Todo added:', this.todos);
      } catch (error) {
        console.error('Error adding todo:', error);
      }
    }
  }

  async updateTodoText(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string }, updateTimestamp: boolean = false) {
    console.log('updateTodoText called with todo:', todo);
    todo.editing = false;
    todo.text = todo.text.trim(); // Trim the text input
    if (todo.originalText === todo.text) {
      console.log('No changes detected, exiting update.');
      return; // Exit without updating if originalText is equal to todo.text
    }
    const newUpdatedAt = new Date().toISOString();
    if (updateTimestamp) {
      todo.updatedAt = newUpdatedAt; // Update the updatedAt date immediately
    }
    try {
      const updatedTodo = await this.todoService.updateTodoText(todo.id, todo.text, newUpdatedAt);
      if (updatedTodo) {
        const todoToUpdate = this.todos.find(t => t.id === todo.id);
        if (todoToUpdate) {
          todoToUpdate.text = updatedTodo.text;
          todoToUpdate.updatedAt = updatedTodo.updatedAt;
          this.todos = this.todos.map(t => t.id === todo.id ? todoToUpdate : t); // Trigger change detection
          console.log('Todo text updated:', todoToUpdate);
        }
      } else {
        console.error('No data returned from update query.');
      }
    } catch (error) {
      console.error('Error updating todo text:', error);
    }
  }

  async removeTodo(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean }) {
    console.log('removeTodo called with todo:', todo);
    try {
      await this.todoService.removeTodo(todo.id);
      this.todos = this.todos.filter(t => t.id !== todo.id);
      this.sortTodos(); // Sort todos after removing one
      console.log('Todo removed:', this.todos);
    } catch (error) {
      console.error('Error removing todo:', error);
    }
  }

  async toggleTodoCompletion(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, editing?: boolean }) {
    console.log('toggleTodoCompletion called with todo:', todo);
    try {
      const newUpdatedAt = new Date().toISOString();
      await this.todoService.toggleTodoCompletion(todo.id, todo.completed, newUpdatedAt);
      todo.updatedAt = newUpdatedAt;
      this.sortTodos(); // Sort todos after toggling completion
      console.log('Todo completion toggled:', todo);
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  }

  editTodoText(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string }, inputElement: ElementRef | null) {
    if (todo.completed) {
      console.log('Cannot edit a completed todo.');
      return;
    }
    console.log('editTodoText called with todo:', todo);
    todo.originalText = todo.text; // Store the original text
    todo.editing = true;
    setTimeout(() => {
      if (this.editInput) {
        this.editInput.nativeElement.focus(); // Focus on the input element
      }
    }, 0);

    if (this.documentClickListener) {
      this.documentClickListener();
    }

    this.documentClickListener = this.renderer.listen('document', 'click', (event: Event) => {
      if (!this.el.nativeElement.contains(event.target)) {
        this.exitEdit(todo);
      }
    });
  }

  exitEdit(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string }) {
    console.log('exitEdit called with todo:', todo);
    const originalTodo = this.todos.find(t => t.id === todo.id);
    if (originalTodo && originalTodo.text !== todo.originalText) {
      this.updateTodoText(todo, true); // Update changes using updateTodoText
    } else {
      todo.editing = false; // Ensure editing is set to false
      console.log('No changes detected, exiting edit mode.');
    }
  }

  cancelEdit(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string }) {
    console.log('cancelEdit called with todo:', todo);
    const originalTodo = this.todos.find(t => t.id === todo.id);
    if (originalTodo) {
      todo.text = originalTodo.text; // Revert text if it was changed
    }
    todo.editing = false;
    if (this.documentClickListener) {
      this.documentClickListener();
      this.documentClickListener = null;
    }
  }

  preventBlur(event: MouseEvent) {
    event.preventDefault();
  }

  sortTodos() {
    this.todos.sort((a, b) => b.id - a.id); // Sort todos by id in descending order
  }
}

