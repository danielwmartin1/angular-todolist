import { Component, OnInit, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { enableProdMode } from '@angular/core';
import { environment } from '../environments/environment';

const supabaseUrl = 'https://afhmppsklvgzzqlipkki.supabase.co';
const supabaseKey = environment.SUPABASE_KEY;
if (!supabaseKey) {
  throw new Error('Supabase key is not defined. Please check your environment variables.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

if (environment.production) {
  enableProdMode();
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angular-todolist';
  newTodo = '';
  todos: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, editing?: boolean }[] = [];
  currentYear: number = new Date().getFullYear();

  @ViewChild('editInput') editInput!: ElementRef;
  private documentClickListener: (() => void) | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    console.log('AppComponent initialized');
  }

  async ngOnInit() {
    console.log('ngOnInit called');
    await this.fetchTodos();
  }

  async fetchTodos() {
    console.log('fetchTodos called');
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
          updatedAt: todo.updatedAt || new Date().toISOString()
        }));
        console.log('Fetched todos:', this.todos);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  }

  async addTodo() {
    console.log('addTodo called with newTodo:', this.newTodo);
    if (this.newTodo.trim()) {
      try {
        const { data, error } = await supabase
          .from('todos')
          .insert([{ text: this.newTodo, completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
          .select(); // Select the inserted row to get the id
        if (error) {
          console.error('Error adding todo:', error);
        } else {
          const newTodo = data[0];
          this.todos.push({ ...newTodo, editing: false });
          this.sortTodos();
          this.newTodo = '';
          console.log('Todo added:', this.todos);
        }
      } catch (error) {
        console.error('Error adding todo:', error);
      }
    }
  }

  async removeTodo(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, editing?: boolean }) {
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
        this.sortTodos();
        console.log('Todo removed:', this.todos);
      }
    } catch (error) {
      console.error('Error removing todo:', error);
    }
  }

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
        this.sortTodos();
        console.log('Todo completion toggled:', todo);
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  }

  async updateTodoText(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, editing?: boolean }) {
    console.log('updateTodoText called with todo:', todo);
    todo.editing = false;
    const originalTodo = this.todos.find(t => t.id === todo.id);
    if (originalTodo && originalTodo.text === todo.text) {
      return;
    }
    try {
      const { data, error } = await supabase
        .from('todos')
        .update({ text: todo.text, updatedAt: new Date().toISOString(), other_column: 'otherValue' }) // Update text and other_column
        .eq('id', todo.id)
        .select(); // Use id instead of createdAt
      if (error) {
        console.error('Error updating todo text:', error);
      } else {
        if (data && data.length > 0) {
          const updatedTodo = this.todos.find(t => t.id === todo.id);
          if (updatedTodo) {
            updatedTodo.text = todo.text;
            updatedTodo.updatedAt = new Date().toISOString();
            this.sortTodos();
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

  editTodoText(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, editing?: boolean }, inputElement: ElementRef | null) {
    console.log('editTodoText called with todo:', todo);
    todo.editing = true;
    setTimeout(() => {
      if (inputElement) {
        inputElement.nativeElement.focus();
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

  exitEdit(todo: { id: number, text: string, completed: boolean, createdAt: string, updatedAt: string, editing?: boolean }) {
    console.log('exitEdit called with todo:', todo);
    todo.editing = false;
    if (this.documentClickListener) {
      this.documentClickListener();
      this.documentClickListener = null;
    }
  }

  sortTodos() {
    this.todos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

