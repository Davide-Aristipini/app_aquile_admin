import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';
import { isSupabaseConfigured } from './core/supabase-client';
import { ConfigMissingComponent } from './shared/config-missing.component';
import { LoadingScreenComponent } from './shared/loading-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoadingScreenComponent, ConfigMissingComponent],
  template: `
    <app-loading-screen *ngIf="!authService.ready(); else appReady" />

    <ng-template #appReady>
      <app-config-missing *ngIf="!isConfigured; else appRouter" />
      <ng-template #appRouter>
        <router-outlet />
      </ng-template>
    </ng-template>
  `,
})
export class AppComponent {
  readonly isConfigured = isSupabaseConfigured;

  constructor(public readonly authService: AuthService) {}
}
