import { Component, OnInit, ElementRef, Renderer2, ViewChild, AfterViewInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { enableProdMode } from '@angular/core';
import { environment } from '../environments/environment';

// Initialize Supabase client
const supabaseUrl = 'https://afhmppsklvgzzqlipkki.supabase.co';
const supabaseKey = environment.SUPABASE_KEY;
if (!supabaseKey) {
  throw new Error('Supabase key is not defined. Please check your environment variables.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Enable production mode if environment is set to production
if (environment.production) {
  enableProdMode();
}

/**
 * AppComponent is the root component of the Angular Todo List application.
 * It manages the state and behavior of the todo list, including fetching,
 * adding, updating, and removing todos.
 */
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
  showEmptyTodoWarning = false; // New property to control the warning message
  isClickOutside = false; // New property to track if the blur event was triggered by clicking outside

  @ViewChild('editInput', { static: false }) editInput!: ElementRef; // Reference to the input element for editing
  @ViewChild('todoInput', { static: false }) todoInput!: ElementRef; // Reference to the addTodo input element
  private documentClickListener: (() => void) | null = null; // Listener for document clicks

  constructor(private el: ElementRef, private renderer: Renderer2) {
    console.log('AppComponent initialized');
  }

  /**
   * Lifecycle hook that is called after Angular has initialized all data-bound properties.
   * Fetches todos from the database.
   */
  async ngOnInit() {
    console.log('ngOnInit called');
    await this.fetchTodos(); // Fetch todos on component initialization
  }

  /**
   * Lifecycle hook that is called after Angular has fully initialized a component's view.
   * Focuses on the addTodo input element and sets up a document click listener.
   */
  ngAfterViewInit() {
    this.focusAddTodoInput(); // Focus on the addTodo input element after view initialization
    this.setupDocumentClickListener(); // Setup document click listener to handle blur
  }

  /**
   * Focuses on the addTodo input element.
   * Uses setTimeout to ensure the focus is set after the view has been initialized.
   */
  private focusAddTodoInput() {
    setTimeout(() => {
      if (this.todoInput && this.todoInput.nativeElement) {
        this.todoInput.nativeElement.focus(); // Focus on the addTodo input element
      }
    }, 0);
  }

  /**
   * Sets up a document click listener to handle clicks outside the addTodo input element.
   * If a click is detected outside the input, the input is blurred and its value is cleared.
   */
  private setupDocumentClickListener() {
    this.documentClickListener = this.renderer.listen('document', 'click', (event: Event) => {
      if (this.todoInput && !this.el.nativeElement.contains(event.target)) {
        this.newTodo = ''; // Revert the state of the addTodo input element to blank
        this.todoInput.nativeElement.blur(); // Blur the addTodo input element
      }
    });
  }

  /**
   * Fetches todos from the database and updates the component's state.
   * Sorts the todos by updatedAt in descending order.
   */
  async fetchTodos() {
    try {
      const { data: todos, error } = await supabase
        .from('todos')
        .select('*')
        .order('updatedAt', { ascending: false }); // Sort by updatedAt in descending order
      if (error) {
        console.error('Error fetching todos:', error);
      } else {
        this.todos = todos.map(todo => ({
          ...todo,
          completed: todo.completed || false,
          createdAt: todo.createdAt || new Date().toISOString(),
          updatedAt: todo.updatedAt || new Date().toISOString(),
          completedAt: todo.completed ? todo.updatedAt : undefined,
          originalText: todo.text // Store the original text
        }));
        console.log('Fetched todos:', this.todos);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  }

  /**
   * Adds a new todo to the database and updates the component's state.
   * If the input is empty, shows a warning message.
   */
  async addTodo() {
    console.log('addTodo called with newTodo:', this.newTodo);
    this.newTodo = this.newTodo.trim(); // Trim the text input
    if (this.newTodo) {
      this.showEmptyTodoWarning = false; // Hide warning if input is not empty
      try {
        const { data, error } = await supabase
          .from('todos')
          .insert([{ text: this.newTodo, completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
          .select(); // Select the inserted row to get the id
        if (error) {
          console.error('Error adding todo:', error);
        } else {
          const newTodo = data[0];
          this.todos.push({ ...newTodo, editing: false, originalText: newTodo.text });
          this.sortTodos(); // Sort todos after adding a new one
          this.newTodo = ''; // Clear the input field
          this.focusAddTodoInput(); // Focus on the addTodo input element
          console.log('Todo added:', this.todos);
        }
      } catch (error) {
        console.error('Error adding todo:', error);
      }
    } else {
      this.showEmptyTodoWarning = true; // Show warning if input is empty
      console.log('Warning: Please enter a todo.');
    }
  }

  /**
   * Updates the text of an existing todo in the database and updates the component's state.
   * If the text is unchanged and updateTimestamp is false, cancels the edit.
   * @param todo The todo to update.
   * @param updateTimestamp Whether to update the updatedAt timestamp.
   */
  async updateTodoText(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string }, updateTimestamp: boolean = false) {
    console.log('updateTodoText called with todo:', todo);
    todo.editing = false;
    todo.text = todo.text.trim(); // Trim the text input
    const originalTodo = this.todos.find(t => t.id === todo.id);
    if (originalTodo && originalTodo.text === todo.text && !updateTimestamp) {
      this.cancelEdit(todo); // Cancel edit if text is unchanged
      return;
    }
    const newUpdatedAt = new Date().toISOString();
    if (updateTimestamp) {
      todo.updatedAt = newUpdatedAt; // Update the updatedAt date immediately
    }
    this.todos = this.todos.map(t => t.id === todo.id ? { ...t, text: todo.text, updatedAt: newUpdatedAt } : t); // Trigger change detection
    this.sortTodos(); // Sort todos immediately after updating the date
    try {
      const { data, error } = await supabase
        .from('todos')
        .update({ text: todo.text, updatedAt: newUpdatedAt }) // Update text and updatedAt
        .eq('id', todo.id)
        .select(); // Use id instead of createdAt
      if (error) {
        console.error('Error updating todo text:', error);
      } else {
        if (data && data.length > 0) {
          const updatedTodo = this.todos.find(t => t.id === todo.id);
          if (updatedTodo) {
            updatedTodo.text = todo.text;
            updatedTodo.updatedAt = newUpdatedAt;
            this.todos = [...this.todos]; // Trigger change detection
            console.log('Todo text updated:', updatedTodo);
          }
        } else {
          console.error('No data returned from update query.');
        }
      }
    } catch (error) {
      console.error('Error updating todo text:', error);
    }
  }

  /**
   * Removes a todo from the database and updates the component's state.
   * @param todo The todo to remove.
   */
  async removeTodo(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean }) {
    console.log('removeTodo called with todo:', todo);
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todo.id); // Use id instead of text
      if (error) {
        console.error('Error removing todo:', error);
      } else {
        this.todos = this.todos.filter(t => t.id !== todo.id);
        this.sortTodos(); // Sort todos after removing one
        console.log('Todo removed:', this.todos);
      }
    } catch (error) {
      console.error('Error removing todo:', error);
    }
  }

  /**
   * Toggles the completion status of a todo in the database and updates the component's state.
   * @param todo The todo to toggle.
   */
  async toggleTodoCompletion(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, editing?: boolean }) {
    console.log('toggleTodoCompletion called with todo:', todo);
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: todo.completed, updatedAt: new Date().toISOString() })
        .eq('id', todo.id); // Use id instead of text
      if (error) {
        console.error('Error updating todo:', error);
      } else {
        todo.updatedAt = new Date().toISOString();
        this.sortTodos(); // Sort todos after toggling completion
        console.log('Todo completion toggled:', todo);
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  }

  /**
   * Enables editing mode for a todo and focuses on the input element.
   * Sets up a document click listener to handle clicks outside the input element.
   * @param todo The todo to edit.
   * @param inputElement The input element to focus on.
   */
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
        this.isClickOutside = true; // Set the flag if clicked outside
        this.exitEdit(todo);
      }
    });
  }

  /**
   * Exits editing mode for a todo and updates the text if it has changed.
   * If the text is unchanged, cancels the edit.
   * @param todo The todo to exit editing mode for.
   */
  exitEdit(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, completedAt?: string, editing?: boolean, originalText?: string }) {
    console.log('exitEdit called with todo:', todo);
    todo.text = todo.originalText || ''; // Revert text to original, provide default value
    if (this.isClickOutside) {
      this.isClickOutside = false; // Reset the flag and do not update the UI
      this.cancelEdit(todo); // Call cancelEdit to revert changes
      return;
    }
    const originalTodo = this.todos.find(t => t.id === todo.id);
    if (originalTodo && originalTodo.text !== todo.text) {
      this.updateTodoText(todo, true); // Update changes using updateTodoText
    } else {
      this.cancelEdit(todo); // Revert changes using cancelEdit
    }
  }

  /**
   * Cancels editing mode for a todo and reverts the text to its original value.
   * @param todo The todo to cancel editing mode for.
   */
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

  /**
   * Prevents the blur event from being triggered.
   * @param event The mouse event to prevent.
   */
  preventBlur(event: MouseEvent) {
    event.preventDefault();
  }

  /**
   * Sorts the todos by updatedAt in descending order.
   */
  sortTodos() {
    this.todos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); // Sort todos by updatedAt in descending order
  }
}

