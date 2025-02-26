import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = 'https://afhmppsklvgzzqlipkki.supabase.co';
    const supabaseKey = environment.SUPABASE_KEY;
    if (!supabaseKey) {
      throw new Error('Supabase key is not defined. Please check your environment variables.');
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async fetchTodos() {
    const { data: todos, error } = await this.supabase
      .from('todos')
      .select('*')
      .order('updatedAt', { ascending: false });
    if (error) {
      throw error;
    }
    return todos;
  }

  async addTodo(text: string) {
    const { data, error } = await this.supabase
      .from('todos')
      .insert([{ text, completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
      .select();
    if (error) {
      throw error;
    }
    return data[0];
  }

  async updateTodoText(id: number, text: string, updatedAt: string) {
    const { data, error } = await this.supabase
      .from('todos')
      .update({ text, updatedAt })
      .eq('id', id)
      .select();
    if (error) {
      throw error;
    }
    return data[0];
  }

  async removeTodo(id: number) {
    const { error } = await this.supabase
      .from('todos')
      .delete()
      .eq('id', id);
    if (error) {
      throw error;
    }
  }

  async toggleTodoCompletion(id: number, completed: boolean, updatedAt: string) {
    const { error } = await this.supabase
      .from('todos')
      .update({ completed, updatedAt })
      .eq('id', id);
    if (error) {
      throw error;
    }
  }
}
