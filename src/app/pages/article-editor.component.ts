import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuillModule } from 'ngx-quill';

import { MAX_STORAGE_BYTES, StorageService } from '../core/storage.service';
import { supabase } from '../core/supabase-client';

interface Category {
  id: string;
  title: string;
  type: string;
}

interface Attachment {
  id: string;
  label: string;
  file_url: string;
}

@Component({
  selector: 'app-article-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
  template: `
    <div class="top-row">
      <div>
        <h1>{{ isEditing ? 'Modifica articolo' : 'Nuovo articolo' }}</h1>
        <p>Costruisci contenuti ricchi con testo, immagini e allegati.</p>
      </div>
      <button class="button" type="button" (click)="handleSave()">
        {{ saving ? 'Salvataggio...' : 'Salva' }}
      </button>
    </div>

    <div class="card" style="margin-top: 20px">
      <h3>Spazio disponibile</h3>
      <div class="usage-bar" style="margin-top: 8px">
        <span [style.width.%]="usagePercent * 100"></span>
      </div>
      <p style="margin-top: 8px">{{ formatGb(usage) }} / 1 GB</p>
    </div>

    <div class="card" style="margin-top: 24px">
      <div class="stepper">
        <div
          *ngFor="let label of stepLabels; let i = index"
          class="step"
          [class.active]="i === step"
          [class.done]="i < step"
        >
          <div class="step-dot">{{ i + 1 }}</div>
          <span>{{ label }}</span>
        </div>
      </div>
    </div>

    <div *ngIf="step === 0" class="card" style="margin-top: 18px">
      <h3>1. Scegli la categoria</h3>
      <div *ngIf="categories.length === 0" style="margin-top: 12px">
        <p>Nessuna categoria trovata. Crea le 4 categorie base per l app.</p>
        <button type="button" class="button" (click)="handleSeedCategories()">Crea categorie</button>
      </div>
      <div *ngIf="categories.length > 0" class="grid two" style="margin-top: 12px">
        <button
          *ngFor="let category of categories"
          type="button"
          class="category-tile"
          [class.selected]="categoryId === category.id"
          (click)="categoryId = category.id"
        >
          <span>{{ category.title }}</span>
        </button>
      </div>
    </div>

    <div *ngIf="step === 1" class="editor-grid" style="margin-top: 18px">
      <div class="card">
        <h3>2. Titolo e copertina</h3>
        <label>
          Titolo
          <input class="input" [(ngModel)]="title" name="title" />
        </label>

        <label style="margin-top: 12px">
          Descrizione breve
          <textarea class="input" rows="3" [(ngModel)]="summary" name="summary"></textarea>
        </label>

        <div class="grid two" style="margin-top: 12px">
          <label>
            Minuti lettura
            <input class="input" type="number" min="1" [(ngModel)]="readMinutes" name="readMinutes" />
          </label>

          <label>
            Tag (virgole)
            <input class="input" [(ngModel)]="tags" name="tags" />
          </label>
        </div>

        <label style="margin-top: 12px">
          Video (URL)
          <input class="input" [(ngModel)]="videoUrl" name="videoUrl" />
        </label>

        <div style="margin-top: 16px">
          <input type="file" accept="image/*" (change)="handleCoverUpload($event)" />
          <img
            *ngIf="coverUrl"
            [src]="coverUrl"
            alt="cover"
            style="margin-top: 12px; width: 100%; border-radius: 12px"
          />
        </div>
      </div>
    </div>

    <div *ngIf="step === 2" class="editor-grid" style="margin-top: 18px">
      <div class="card">
        <h3>3. Contenuto stile WordPress</h3>
        <quill-editor [(ngModel)]="content" name="content" theme="snow" />
      </div>

      <div class="card">
        <h3>Allegati</h3>
        <p>Carica PDF o documenti per i giochi.</p>
        <input type="file" (change)="handleAttachmentUpload($event)" />

        <div class="list" style="margin-top: 12px">
          <div *ngFor="let attachment of attachments" class="list-item">
            <span>{{ attachment.label }}</span>
            <a [href]="attachment.file_url" target="_blank" rel="noreferrer">Apri</a>
          </div>
        </div>
      </div>
    </div>

    <div class="toolbar" style="margin-top: 24px">
      <button class="button secondary" type="button" (click)="goBack()" [disabled]="step === 0">
        Indietro
      </button>

      <button *ngIf="step < 2" class="button" type="button" (click)="goNext()" [disabled]="!canGoNext()">
        Avanti
      </button>

      <button *ngIf="step === 2" class="button" type="button" (click)="handleSave()">
        {{ saving ? 'Salvataggio...' : 'Salva' }}
      </button>
    </div>
  `,
})
export class ArticleEditorComponent implements OnInit {
  id: string | null = null;

  categories: Category[] = [];
  title = '';
  summary = '';
  categoryId = '';
  tags = '';
  readMinutes = 5;
  coverUrl = '';
  content = '';
  videoUrl = '';
  attachments: Attachment[] = [];
  saving = false;
  usage = 0;
  step = 0;

  readonly stepLabels = ['Categoria', 'Titolo e cover', 'Contenuto'];
  readonly maxStorageBytes = MAX_STORAGE_BYTES;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly storageService: StorageService
  ) {}

  get isEditing(): boolean {
    return Boolean(this.id);
  }

  get usagePercent(): number {
    return Math.min(1, this.usage / this.maxStorageBytes);
  }

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get('id');
    await this.loadData();
  }

  async handleCoverUpload(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    const path = `covers/${crypto.randomUUID()}-${file.name}`;

    try {
      this.coverUrl = await this.storageService.uploadWithLimit({
        file,
        bucket: 'covers',
        path,
      });
      this.usage += file.size;
    } catch (error) {
      alert(this.errorMessage(error));
    }
  }

  async handleAttachmentUpload(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file || !this.id || !supabase) {
      alert('Salva prima l articolo.');
      return;
    }

    const label = prompt('Nome allegato');
    if (!label) return;

    const path = `attachments/${crypto.randomUUID()}-${file.name}`;

    try {
      const url = await this.storageService.uploadWithLimit({
        file,
        bucket: 'attachments',
        path,
      });

      const { data } = await supabase
        .from('attachments')
        .insert({
          article_id: this.id,
          label,
          file_url: url,
        })
        .select('id, label, file_url')
        .single();

      if (data) {
        this.attachments = [...this.attachments, data as Attachment];
      }

      this.usage += file.size;
    } catch (error) {
      alert(this.errorMessage(error));
    }
  }

  async handleSave(): Promise<void> {
    if (!supabase) return;

    this.saving = true;

    const payload = {
      title: this.title,
      summary: this.summary,
      category_id: this.categoryId,
      cover_url: this.coverUrl,
      video_url: this.videoUrl || null,
      content: { html: this.content },
      tags: this.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      read_minutes: this.readMinutes,
    };

    if (this.isEditing && this.id) {
      await supabase.from('articles').update(payload).eq('id', this.id);
    } else {
      await supabase.from('articles').insert(payload).select('id').single();
    }

    this.saving = false;
    await this.router.navigateByUrl('/');
  }

  async handleSeedCategories(): Promise<void> {
    if (!supabase) return;

    const defaults = [
      { title: 'Bans', slug: 'bans', type: 'articles' },
      { title: 'Idee attivita', slug: 'attivita', type: 'articles' },
      { title: 'Canti', slug: 'canti', type: 'articles' },
      { title: 'Giochi', slug: 'giochi', type: 'articles' },
    ];

    await supabase.from('categories').insert(defaults);

    const { data: categoryData } = await supabase
      .from('categories')
      .select('id, title, type')
      .order('title');

    const articleCategories = ((categoryData ?? []) as Category[]).filter(
      (category) => category.type === 'articles'
    );

    this.categories = articleCategories;

    if (this.categories.length > 0) {
      this.categoryId = this.categories[0].id;
    }
  }

  canGoNext(): boolean {
    if (this.step === 0) return Boolean(this.categoryId);
    if (this.step === 1) return Boolean(this.title.trim() && this.summary.trim());
    return true;
  }

  goBack(): void {
    this.step = Math.max(0, this.step - 1);
  }

  goNext(): void {
    this.step = Math.min(2, this.step + 1);
  }

  formatGb(bytes: number): string {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  private async loadData(): Promise<void> {
    if (!supabase) return;

    const { data: categoryData } = await supabase
      .from('categories')
      .select('id, title, type')
      .order('title');

    const articleCategories = ((categoryData ?? []) as Category[]).filter(
      (category) => category.type === 'articles'
    );

    this.categories = articleCategories;

    if (this.categories.length > 0 && !this.categoryId) {
      this.categoryId = this.categories[0].id;
    }

    if (this.isEditing && this.id) {
      const { data: article } = await supabase
        .from('articles')
        .select('id, title, summary, category_id, content, cover_url, video_url, tags, read_minutes')
        .eq('id', this.id)
        .single();

      if (article) {
        const typed = article as {
          title?: string;
          summary?: string;
          category_id?: string;
          content?: { html?: string };
          cover_url?: string;
          video_url?: string;
          tags?: string[];
          read_minutes?: number;
        };

        this.title = typed.title || '';
        this.summary = typed.summary || '';
        this.categoryId = typed.category_id || '';
        this.coverUrl = typed.cover_url || '';
        this.videoUrl = typed.video_url || '';
        this.content = typed.content?.html || '';
        this.tags = (typed.tags || []).join(', ');
        this.readMinutes = typed.read_minutes || 5;
      }

      const { data: attachmentData } = await supabase
        .from('attachments')
        .select('id, label, file_url')
        .eq('article_id', this.id);

      this.attachments = (attachmentData ?? []) as Attachment[];
    }

    try {
      this.usage = await this.storageService.fetchStorageUsage();
    } catch {
      // no-op
    }
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'Errore imprevisto.';
  }
}
