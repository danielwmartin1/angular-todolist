import { Component, OnInit, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

const supabaseUrl = 'https://afhmppsklvgzzqlipkki.supabase.co';
const supabaseKey = environment.supabaseKey;
if (!supabaseKey) {
  throw new Error('Supabase key is not defined. Please check your environment variables.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angular-todolist';
  newTodo = '';
  todos: { text: string, completed: boolean, createdAt: string, updatedAt: string, editing?: boolean }[] = [];
  currentYear: number = new Date().getFullYear();

  @ViewChild('editInput') editInput!: ElementRef;
  private documentClickListener: (() => void) | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    console.log('AppComponent initialized');
  }

  async ngOnInit() {
    console.log('ngOnInit called');
    try {
      const { data: todos, error } = await supabase
        .from('todos')
        .select('*');
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
        const { error } = await supabase
          .from('todos')
          .insert([{ text: this.newTodo, completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
        if (error) {
          console.error('Error adding todo:', error);
        } else {
          this.todos.push({ text: this.newTodo, completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
          this.newTodo = '';
          console.log('Todo added:', this.todos);
        }
      } catch (error) {
        console.error('Error adding todo:', error);
      }
    }
  }

  async removeTodo(todo: { text: string, completed: boolean, createdAt: string, updatedAt: string, editing?: boolean }) {
    console.log('removeTodo called with todo:', todo);
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('text', todo.text);
      if (error) {
        console.error('Error removing todo:', error);
      } else {
        this.todos = this.todos.filter(t => t.text !== todo.text);
        console.log('Todo removed:', this.todos);
      }
    } catch (error) {
      console.error('Error removing todo:', error);
    }
  }

  async toggleTodoCompletion(todo: { text: string, completed: boolean, createdAt: string, updatedAt: string, editing?: boolean }) {
    console.log('toggleTodoCompletion called with todo:', todo);
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: todo.completed, updatedAt: new Date().toISOString() })
        .eq('text', todo.text);
      if (error) {
        console.error('Error updating todo:', error);
      } else {
        todo.updatedAt = new Date().toISOString();
        console.log('Todo completion toggled:', todo);
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  }

  async updateTodoText(todo: { text: string, completed: boolean, createdAt: string, updatedAt: string, editing?: boolean }) {
    console.log('updateTodoText called with todo:', todo);
    todo.editing = false;
    const originalTodo = this.todos.find(t => t.createdAt === todo.createdAt);
    if (originalTodo && originalTodo.text === todo.text) {
      return;
    }
    try {
      const { error } = await supabase
        .from('todos')
        .update({ text: todo.text, updatedAt: new Date().toISOString() })
        .eq('createdAt', todo.createdAt);
      if (error) {
        console.error('Error updating todo text:', error);
      } else {
        todo.updatedAt = new Date().toISOString();
        console.log('Todo text updated:', todo);
      }
    } catch (error) {
      console.error('Error updating todo text:', error);
    }
  }

  editTodoText(todo: { text: string, completed: boolean, createdAt: string, updatedAt: string, editing?: boolean }, inputElement: ElementRef | null) {
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

  exitEdit(todo: { text: string, completed: boolean, createdAt: string, updatedAt: string, editing?: boolean }) {
    console.log('exitEdit called with todo:', todo);
    todo.editing = false;
    if (this.documentClickListener) {
      this.documentClickListener();
      this.documentClickListener = null;
    }
  }
}
