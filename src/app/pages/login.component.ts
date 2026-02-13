import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login">
      <form class="login-card" (ngSubmit)="handleLogin()">
        <h2>Accesso admin</h2>
        <p>Inserisci le credenziali per gestire gli articoli.</p>

        <div class="editor-grid">
          <label>
            Email
            <input
              class="input"
              type="email"
              [(ngModel)]="email"
              name="email"
              required
            />
          </label>

          <label>
            Password
            <input
              class="input"
              type="password"
              [(ngModel)]="password"
              name="password"
              required
            />
          </label>

          <p *ngIf="error" style="color: #b6362c">{{ error }}</p>

          <button class="button" type="submit" [disabled]="loading">
            {{ loading ? 'Accesso...' : 'Entra' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    if (this.authService.session()) {
      void this.router.navigateByUrl('/');
    }
  }

  async handleLogin(): Promise<void> {
    this.error = '';
    this.loading = true;

    const loginError = await this.authService.signIn(this.email, this.password);

    if (loginError) {
      this.error = loginError;
      this.loading = false;
      return;
    }

    this.loading = false;
    await this.router.navigateByUrl('/');
  }
}
