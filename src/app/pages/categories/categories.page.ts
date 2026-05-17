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
        @for (cat of activeCategories(); track cat.slug) {
          <div class="category-card" (click)="openCategory(cat.slug)">
            <span class="category-emoji">{{ cat.emoji }}</span>
            <span class="category-name">{{ cat.name }}</span>
            @if (getCategoryCount(cat.slug); as count) {
              <ion-badge color="primary">{{ count }}</ion-badge>
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
      gap: 8px;
      padding: 12px;
    }

    .category-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 16px 8px;
      background: var(--ion-card-background, white);
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.15s;
      position: relative;

      &:active {
        transform: scale(0.95);
      }
    }

    .category-emoji {
      font-size: 2rem;
    }

    .category-name {
      font-size: 0.8rem;
      font-weight: 500;
      text-align: center;
    }

    ion-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 0.65rem;
    }

    .mode-toggle {
      display: flex;
      background: var(--ion-color-primary);
      padding: 0 14px 10px;
    }
    .mode-btn {
      flex: 1; padding: 7px 0; border: none;
      font-size: 0.85rem; font-weight: 600; cursor: pointer;
      background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.7);
      transition: all 0.2s ease;
    }
    .mode-btn:first-child { border-radius: 8px 0 0 8px; }
    .mode-btn:last-child { border-radius: 0 8px 8px 0; }
    .mode-btn.active { background: white; color: var(--ion-color-primary); }
  `]
})
export class CategoriesPage {
  private router = inject(Router);
  private dealService = inject(DealService);
  private posthog = inject(PosthogService);

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
