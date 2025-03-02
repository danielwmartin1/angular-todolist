import { Component, OnInit, ElementRef, Renderer2, ViewChild, AfterViewInit } from '@angular/core';
import { TodoService } from './services/todo.service';
import { enableProdMode } from '@angular/core';
import { environment } from '../environments/environment';

if (environment.production) {
  enableProdMode();
}

@Component({
  selector: 'app-root', // The selector used in HTML to identify this component
  templateUrl: './app.component.html', // The HTML template file for this component
  styleUrls: ['./app.component.css'] // The CSS file(s) for styling this component
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'angular-todolist'; // Title of the application
  newTodo = ''; // Model for the new todo input field
  todos: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string }[] = []; // Array to store todo items
  currentYear: number = new Date().getFullYear(); // Current year, used for display purposes
  private originalNewTodo = ''; // Backup for the new todo input field

  @ViewChild('editInput', { static: false }) editInput!: ElementRef; // Reference to the edit input element
  @ViewChild('todoInput', { static: false }) todoInput!: ElementRef; // Reference to the new todo input element
  private documentClickListener: (() => void) | null = null; // Listener for document click events

  constructor(private el: ElementRef, private renderer: Renderer2, private todoService: TodoService) {
    console.log('AppComponent initialized'); // Log message when the component is initialized
  }

  async ngOnInit() {
    console.log('ngOnInit called'); // Log message when ngOnInit lifecycle hook is called
    await this.fetchTodos(); // Fetch the list of todos from the service
  }

  ngAfterViewInit() {
    this.focusAddTodoInput(); // Focus the new todo input field after the view initializes
    this.setupDocumentClickListener(); // Set up the document click listener
  }

  private focusAddTodoInput() {
    setTimeout(() => {
      if (this.todoInput && this.todoInput.nativeElement) {
        this.todoInput.nativeElement.focus(); // Focus the new todo input field
      }
    }, 0);
  }

  private setupDocumentClickListener() {
    this.documentClickListener = this.renderer.listen('document', 'click', (event: Event) => {
      if (this.todoInput && !this.el.nativeElement.contains(event.target)) {
        this.newTodo = ''; // Clear the new todo input field if the click is outside the component
        this.todoInput.nativeElement.blur(); // Remove focus from the new todo input field
      }
    });
  }

  async fetchTodos() {
    try {
      const todos = await this.todoService.fetchTodos(); // Fetch todos from the service
      this.todos = todos.map(todo => ({
        ...todo,
        completed: todo.completed || false, // Ensure completed property is set
        createdAt: todo.createdAt || new Date().toISOString(), // Ensure createdAt property is set
        updatedAt: todo.updatedAt || new Date().toISOString(), // Ensure updatedAt property is set
        completedAt: todo.completed ? todo.updatedAt : undefined, // Set completedAt if the todo is completed
        originalText: todo.text // Backup the original text
      }));
      console.log('Fetched todos:', this.todos); // Log the fetched todos
    } catch (error) {
      console.error('Error fetching todos:', error); // Log any errors that occur during fetching
    }
  }

  async addTodo() {
    console.log('addTodo called with newTodo:', this.newTodo); // Log the new todo text
    this.newTodo = this.newTodo.trim(); // Trim whitespace from the new todo text
    if (this.newTodo) {
      try {
        const newTodo = await this.todoService.addTodo(this.newTodo); // Add the new todo via the service
        this.todos.push({ ...newTodo, editing: false, originalText: newTodo.text }); // Add the new todo to the list
        this.sortTodos(); // Sort the todos
        this.newTodo = ''; // Clear the new todo input field
        this.focusAddTodoInput(); // Focus the new todo input field
        console.log('Todo added:', this.todos); // Log the updated list of todos
      } catch (error) {
        console.error('Error adding todo:', error); // Log any errors that occur during adding
      }
    }
  }

  async updateTodoText(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string }) {
    console.log('updateTodoText called with todo:', todo); // Log the todo to be updated
    todo.editing = false; // Exit editing mode
    todo.text = todo.text.trim(); // Trim whitespace from the todo text
    if (todo.originalText === todo.text) {
      console.log('No changes detected, exiting update.'); // Log if no changes are detected
      return;
    }
    const newUpdatedAt = new Date().toLocaleString('en-US', { timeZoneName: 'short' }); // Get the current timestamp
    try {
      const updatedTodo = await this.todoService.updateTodoText(todo.id, todo.text, newUpdatedAt); // Update the todo via the service
      if (updatedTodo) {
        const todoToUpdate = this.todos.find(t => t.id === todo.id); // Find the todo to update in the list
        if (todoToUpdate) {
          todoToUpdate.text = updatedTodo.text; // Update the text
          todoToUpdate.updatedAt = updatedTodo.updatedAt; // Update the updatedAt timestamp
          this.todos = this.todos.map(t => t.id === todo.id ? todoToUpdate : t); // Update the list of todos
          console.log('Todo text updated:', todoToUpdate); // Log the updated todo
        }
      } else {
        console.error('No data returned from update query.'); // Log if no data is returned from the update query
      }
    } catch (error) {
      console.error('Error updating todo text:', error); // Log any errors that occur during updating
    }
  }

  async removeTodo(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean }) {
    console.log('removeTodo called with todo:', todo); // Log the todo to be removed
    try {
      await this.todoService.removeTodo(todo.id); // Remove the todo via the service
      this.todos = this.todos.filter(t => t.id !== todo.id); // Remove the todo from the list
      this.sortTodos(); // Sort the todos
      console.log('Todo removed:', this.todos); // Log the updated list of todos
    } catch (error) {
      console.error('Error removing todo:', error); // Log any errors that occur during removal
    }
  }

  async toggleTodoCompletion(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, editing?: boolean }) {
    console.log('toggleTodoCompletion called with todo:', todo); // Log the todo to be toggled
    try {
      const newUpdatedAt = new Date().toISOString(); // Get the current timestamp
      await this.todoService.toggleTodoCompletion(todo.id, todo.completed); // Toggle the completion status via the service
      todo.updatedAt = newUpdatedAt; // Update the updatedAt timestamp
      this.sortTodos(); // Sort the todos
      console.log('Todo completion toggled:', todo); // Log the toggled todo
    } catch (error) {
      console.error('Error updating todo:', error); // Log any errors that occur during toggling
    }
  }

  editTodoText(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string }, inputElement: ElementRef | null) {
    if (todo.completed) {
      console.log('Cannot edit a completed todo.'); // Log if trying to edit a completed todo
      return;
    }
    console.log('editTodoText called with todo:', todo); // Log the todo to be edited
    todo.originalText = todo.text; // Backup the original text
    todo.editing = true; // Enter editing mode
    setTimeout(() => {
      if (this.editInput) {
        this.editInput.nativeElement.focus(); // Focus the edit input field
      }
    }, 0);

    if (this.documentClickListener) {
      this.documentClickListener(); // Remove the existing document click listener
    }

    this.documentClickListener = this.renderer.listen('document', 'click', (event: Event) => {
      if (!this.el.nativeElement.contains(event.target)) {
        this.exitEdit(todo); // Exit edit mode if the click is outside the component
      }
    });
  }

  exitEdit(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string }) {
    console.log('exitEdit called with todo:', todo); // Log the todo to exit edit mode
    const originalTodo = this.todos.find(t => t.id === todo.id); // Find the original todo in the list
    if (originalTodo && originalTodo.text !== todo.originalText) {
      this.updateTodoText(todo); // Update the todo text if changes are detected
    } else {
      todo.editing = false; // Exit editing mode if no changes are detected
      console.log('No changes detected, exiting edit mode.'); // Log if no changes are detected
    }
  }

  cancelEdit(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string }) {
    console.log('cancelEdit called with todo:', todo); // Log the todo to cancel edit mode
    const originalTodo = this.todos.find(t => t.id === todo.id); // Find the original todo in the list
    if (originalTodo) {
      todo.text = originalTodo.text; // Revert the text to the original
    }
    todo.editing = false; // Exit editing mode
    if (this.documentClickListener) {
      this.documentClickListener(); // Remove the document click listener
      this.documentClickListener = null;
    }
  }

  preventBlur(event: MouseEvent) {
    event.preventDefault(); // Prevent blur event
  }

  sortTodos() {
    this.todos.sort((a, b) => b.id - a.id); // Sort the todos by id in descending order
  }

  formatDateWithTimezone(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
      timeZoneName: 'short'
    };
    return new Date(dateString).toLocaleString('en-US', options);
  }
}

