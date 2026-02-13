import { Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from './supabase-client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly ready = signal(false);
  readonly session = signal<Session | null>(null);

  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.init();
  }

  async ensureReady(): Promise<void> {
    await this.initPromise;
  }

  async signIn(email: string, password: string): Promise<string | null> {
    if (!supabase) return 'Supabase non configurato.';

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return error.message;
    }

    return null;
  }

  async signOut(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  private async init(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      this.ready.set(true);
      return;
    }

    const { data } = await supabase.auth.getSession();
    this.session.set(data.session);

    supabase.auth.onAuthStateChange((_event, newSession) => {
      this.session.set(newSession);
    });

    this.ready.set(true);
  }
}
