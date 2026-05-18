import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonBadge, IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { CATEGORIES, FOOD_CATEGORIES, NON_FOOD_CATEGORIES, FOOD_SLUGS } from '../../models/deal.model';
import { DealService } from '../../services/deal.service';
import { PosthogService } from '../../services/posthog.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonBadge, IonButtons, IonBackButton],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/more"></ion-back-button>
        </ion-buttons>
        <ion-title>Categorieën</ion-title>
      </ion-toolbar>
      <div class="mode-toggle">
        <button class="mode-btn" [class.active]="mode() === 'food'" (click)="setMode('food')">Voeding</button>
        <button class="mode-btn" [class.active]="mode() === 'nonfood'" (click)="setMode('nonfood')">Non-food</button>
      </div>
    </ion-header>

    <ion-content>
      <div class="category-grid">
        @if (activeCategories().length === 0) {
          <p class="empty-hint">Deals worden geladen…</p>
        }
        @for (cat of activeCategories(); track cat.slug) {
          <div class="category-card" (click)="openCategory(cat.slug)">
            <span class="category-emoji">{{ cat.emoji }}</span>
            <span class="category-name">{{ cat.name }}</span>
            @if (getCategoryCount(cat.slug); as count) {
              <ion-badge>{{ count }}</ion-badge>
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .category-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      padding: 14px;
    }

    .category-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 18px 6px 14px;
      background: var(--retro-newsprint-bright);
      border: 2px solid var(--retro-ink);
      border-radius: 0;
      box-shadow: 2px 2px 0 0 var(--retro-ink);
      cursor: pointer;
      transition: transform 0.12s ease, box-shadow 0.12s ease;
      position: relative;

      &:active {
        transform: translate(2px, 2px);
        box-shadow: 0 0 0 0 var(--retro-ink);
      }
    }

    .category-emoji {
      font-size: 1.8rem;
      line-height: 1;
    }

    .category-name {
      font-family: 'Archivo Narrow', system-ui, sans-serif;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      text-align: center;
      color: var(--retro-ink);
      line-height: 1.15;
    }

    ion-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      --background: var(--retro-red);
      --color: #fff;
      border: 2px solid var(--retro-ink);
      border-radius: 0;
      font-family: 'Space Mono', monospace;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      padding: 2px 5px;
      box-shadow: 1.5px 1.5px 0 0 var(--retro-ink);
    }

    .empty-hint {
      grid-column: 1 / -1;
      padding: 32px 16px;
      text-align: center;
      font-family: 'Newsreader', Georgia, serif;
      font-style: italic;
      color: var(--retro-ink-soft);
    }

    .mode-toggle {
      display: flex;
      background: var(--retro-newsprint);
      padding: 8px 12px 10px;
      gap: 0;
      border-bottom: 2px solid var(--retro-ink);
    }
    .mode-btn {
      flex: 1;
      min-height: 44px;
      padding: 11px 0 10px;
      border: 2px solid var(--retro-ink);
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      font-size: 0.95rem;
      font-weight: 400;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      cursor: pointer;
      background: var(--retro-newsprint-bright);
      color: var(--retro-ink);
      transition: background-color 0.1s ease;
    }
    .mode-btn + .mode-btn { border-left-width: 0; }
    .mode-btn.active {
      background: var(--retro-yellow);
      color: var(--retro-ink);
      box-shadow: inset 0 -4px 0 0 var(--retro-ink);
    }
  `]
})
export class CategoriesPage {
  private router = inject(Router);
  private dealService = inject(DealService);
  private posthog = inject(PosthogService);

  constructor() {
    if (this.dealService.deals().length === 0) {
      this.dealService.loadDeals().subscribe();
    }
  }

  mode = signal<'food' | 'nonfood'>(
    (localStorage.getItem('dealfinder-mode') as 'food' | 'nonfood') || 'food'
  );

  activeCategories = computed(() => {
    const list = this.mode() === 'food' ? FOOD_CATEGORIES : NON_FOOD_CATEGORIES;
    return list.filter(c => this.getCategoryCount(c.slug) > 0);
  });

  getCategoryCount(slug: string): number {
    return this.dealService.deals().filter(d => d.categorySlug === slug).length;
  }

  setMode(m: 'food' | 'nonfood') {
    this.mode.set(m);
    localStorage.setItem('dealfinder-mode', m);
  }

  openCategory(slug: string) {
    const cat = [...FOOD_CATEGORIES, ...NON_FOOD_CATEGORIES].find(c => c.slug === slug);
    this.posthog.posthog.capture('category_selected', {
      category_slug: slug,
      category_name: cat?.name ?? slug,
      deal_count: this.getCategoryCount(slug),
      mode: this.mode(),
    });
    this.dealService.setFilter('category', slug);
    this.router.navigate(['/deals']);
  }
}
