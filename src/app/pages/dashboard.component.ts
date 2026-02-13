import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { StorageService, MAX_STORAGE_BYTES } from '../core/storage.service';
import { supabase } from '../core/supabase-client';

interface Category {
  id: string;
  title: string;
}

interface Article {
  id: string;
  title: string;
  summary: string;
  category_id: string;
  published_at: string | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="top-row">
      <div>
        <h1>Articoli</h1>
        <p>Gestisci gli articoli per Bans, Canti, Giochi e Attivita.</p>
      </div>
      <a class="button" routerLink="/articles/new">Nuovo articolo</a>
    </div>

    <div class="grid two" style="margin-top: 20px">
      <div class="card">
        <h3>Spazio usato</h3>
        <div class="usage-bar" style="margin-top: 8px">
          <span [style.width.%]="usagePercent * 100"></span>
        </div>
        <p style="margin-top: 8px">{{ formatGb(usage) }} / 1 GB</p>
      </div>

      <div class="card">
        <h3>Ricerca veloce</h3>
        <input
          class="input"
          placeholder="Cerca titolo o descrizione breve..."
          [(ngModel)]="query"
          name="query"
        />
      </div>
    </div>

    <div class="card" style="margin-top: 24px">
      <h3>Ultimi articoli</h3>
      <div class="list" style="margin-top: 12px">
        <div *ngFor="let article of filteredArticles()" class="list-item">
          <div>
            <strong>{{ article.title }}</strong>
            <div style="margin-top: 6px; color: #4b4b4f">{{ article.summary }}</div>
            <div style="margin-top: 8px; display: flex; gap: 8px">
              <span class="tag">{{ categoryLabel(article.category_id) }}</span>
              <span class="tag">{{ article.published_at ? 'Pubblicato' : 'Bozza' }}</span>
            </div>
          </div>
          <a class="button secondary" [routerLink]="'/articles/' + article.id">Modifica</a>
        </div>

        <p *ngIf="filteredArticles().length === 0">Nessun articolo trovato. Crea il primo!</p>
      </div>
    </div>
  `,
  host: { class: 'dashboard' },
})
export class DashboardComponent implements OnInit {
  articles: Article[] = [];
  categories: Category[] = [];
  usage = 0;
  query = '';
  readonly maxStorageBytes = MAX_STORAGE_BYTES;

  constructor(private readonly storageService: StorageService) {}

  get usagePercent(): number {
    return Math.min(1, this.usage / this.maxStorageBytes);
  }

  async ngOnInit(): Promise<void> {
    if (!supabase) return;

    const { data: categoryData } = await supabase
      .from('categories')
      .select('id, title')
      .order('title');

    this.categories = (categoryData ?? []) as Category[];

    const { data: articleData } = await supabase
      .from('articles')
      .select('id, title, summary, category_id, published_at')
      .order('created_at', { ascending: false });

    this.articles = (articleData ?? []) as Article[];

    try {
      this.usage = await this.storageService.fetchStorageUsage();
    } catch {
      // no-op
    }
  }

  filteredArticles(): Article[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.articles;

    return this.articles.filter((article) =>
      `${article.title ?? ''} ${article.summary ?? ''}`.toLowerCase().includes(q)
    );
  }

  categoryLabel(categoryId: string): string {
    return this.categories.find((category) => category.id === categoryId)?.title || 'Categoria';
  }

  formatGb(bytes: number): string {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}
