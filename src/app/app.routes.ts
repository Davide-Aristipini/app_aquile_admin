import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { ShellComponent } from './layout/shell.component';
import { ArticleEditorComponent } from './pages/article-editor.component';
import { DashboardComponent } from './pages/dashboard.component';
import { LoginComponent } from './pages/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'articles/new', component: ArticleEditorComponent },
      { path: 'articles/:id', component: ArticleEditorComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
