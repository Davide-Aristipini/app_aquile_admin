import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-config-missing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login">
      <div class="login-card">
        <h2>Configurazione mancante</h2>
        <p>Le variabili Supabase mancano o non sono valide.</p>
        <div style="margin-top: 12px">
          <code>VITE_SUPABASE_URL</code>
          <br />
          <code>VITE_SUPABASE_ANON_KEY</code>
        </div>
        <p style="margin-top: 12px">
          <code>VITE_SUPABASE_URL</code> deve iniziare con <code>https://</code>
        </p>
        <p style="margin-top: 12px">
          Se fai deploy manuale, ricostruisci il progetto dopo aver creato il file
          <code>.env</code> e ricarica la cartella <code>dist</code>.
        </p>
      </div>
    </div>
  `,
})
export class ConfigMissingComponent {}
