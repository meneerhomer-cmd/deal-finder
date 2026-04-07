import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonBadge
} from '@ionic/angular/standalone';
import { CATEGORIES } from '../../models/deal.model';
import { DealService } from '../../services/deal.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonBadge],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Categorieën</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="category-grid">
        @for (cat of categories; track cat.slug) {
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
  `]
})
export class CategoriesPage {
  private router = inject(Router);
  private dealService = inject(DealService);
  categories = CATEGORIES;

  getCategoryCount(slug: string): number {
    return this.dealService.deals().filter(d => d.categorySlug === slug).length;
  }

  openCategory(slug: string) {
    this.dealService.setFilter('category', slug);
    this.router.navigate(['/deals']);
  }
}
