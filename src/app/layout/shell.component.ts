import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">AQUILE ADMIN</div>

        <nav class="nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Articoli
          </a>
          <a routerLink="/articles/new" routerLinkActive="active">Nuovo articolo</a>
        </nav>

        <button type="button" class="button secondary" (click)="logout()">Logout</button>
      </aside>

      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
})
export class ShellComponent {
  constructor(private readonly authService: AuthService) {}

  logout(): void {
    void this.authService.signOut();
  }
}
