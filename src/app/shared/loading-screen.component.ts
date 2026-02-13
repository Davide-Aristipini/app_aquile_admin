import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login">
      <div class="login-card">
        <h2>Caricamento...</h2>
        <p>Stiamo preparando il pannello.</p>
      </div>
    </div>
  `,
})
export class LoadingScreenComponent {}
