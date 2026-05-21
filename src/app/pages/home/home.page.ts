import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
  IonButton, IonIcon, IonBadge, IonSpinner, IonButtons, IonSearchbar
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForward, timerOutline, searchOutline, bookOutline, notificationsOutline, closeOutline, logInOutline } from 'ionicons/icons';
import { DealService } from '../../services/deal.service';
import { DealCardComponent } from '../../components/deal-card/deal-card.component';
import { Deal, Opportunity, isFoodDeal, getCategoryEmoji } from '../../models/deal.model';
import { PosthogService } from '../../services/posthog.service';
import { UserDataService } from '../../services/user-data.service';
import { AuthService } from '../../services/auth.service';
import { HapticsService } from '../../services/haptics.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonButton, IonIcon, IonBadge, IonSpinner, IonButtons, IonSearchbar,
    DealCardComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        @if (searchOpen()) {
          <ion-searchbar
            placeholder="Zoek een product of merk..."
            [debounce]="400"
            (ionInput)="onSearch($event)"
            (ionCancel)="searchOpen.set(false)"
            [showCancelButton]="'always'"
            cancelButtonText="X"
            animated
          ></ion-searchbar>
        } @else {
          <ion-title>Deal Finder</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="searchOpen.set(true)" aria-label="Zoek een product of merk">
              <ion-icon name="search-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Biggest opportunity today -->
      @if (opportunity(); as opp) {
        <a class="opportunity-banner" [routerLink]="['/product', opp.fingerprint]">
          <div class="ob-media">
            @if (opp.canonicalImageUrl) {
              <img [src]="opp.canonicalImageUrl" [alt]="opp.canonicalName" />
            } @else {
              <span class="ob-emoji">{{ getCategoryEmoji(opp.category) }}</span>
            }
          </div>
          <div class="ob-body">
            <span class="ob-kicker">Vandaag bespaar je het meest op</span>
            <span class="ob-name">{{ opp.canonicalName }}</span>
            <span class="ob-saving">Bespaar €{{ opp.savingEur | number:'1.2-2' }}</span>
            <span class="ob-meta">€{{ opp.currentPrice | number:'1.2-2' }} bij {{ opp.cheapestRetailer }}</span>
          </div>
          <ion-icon name="arrow-forward" class="ob-arrow"></ion-icon>
        </a>
      }

      @if (dealService.totalDeals() === 0 && !dealService.loading()) {
        <div class="scraping-banner">
          <ion-spinner name="crescent"></ion-spinner>
          <div>
            <strong>Deals worden geladen...</strong>
            <p>De server verzamelt de nieuwste promoties.</p>
          </div>
        </div>
      }

      <!-- First-launch skeletons (no cached data yet) — keeps the open instant -->
      @if (dealService.loading() && topDeals().length === 0) {
        <div class="section">
          <div class="section-header"><h2>Topdeals van de week</h2></div>
          <div class="deal-carousel">
            @for (s of [1,2,3,4]; track s) {
              <div class="carousel-item"><div class="skeleton-card"></div></div>
            }
          </div>
        </div>
      }

      <!-- Retailers -->
      @if (filteredRetailers().length > 0) {
        <div class="retailer-scroll">
          @for (r of filteredRetailers(); track r.slug) {
            <a [routerLink]="['/retailer', r.slug]" class="retailer-bubble">
              @if (getRetailerLogo(r.slug)) {
                <img [src]="getRetailerLogo(r.slug)" [alt]="r.name" class="retailer-logo" />
              } @else {
                <span class="retailer-logo retailer-logo--mono" [attr.aria-label]="r.name">{{ monogram(r.name) }}</span>
              }
            </a>
          }
        </div>
      }

      <!-- Folders link -->
      @if (filteredRetailers().length > 0) {
        <div class="folders-bar">
          <ion-icon name="book-outline"></ion-icon>
          <span>Bekijk de folders van je favoriete winkels</span>
          <a routerLink="/retailers" class="folders-link">Folders <ion-icon name="arrow-forward"></ion-icon></a>
        </div>
      }

      <!-- Sign-in CTA: anonymous-only, dismissible -->
      @if (showSignInCta()) {
        <div class="signin-cta">
          <button class="signin-cta-dismiss" (click)="dismissSignInCta()" aria-label="Sluit">
            <ion-icon name="close-outline"></ion-icon>
          </button>
          <div class="signin-cta-icon">
            <ion-icon name="notifications-outline"></ion-icon>
          </div>
          <div class="signin-cta-body">
            <strong>Sync op meerdere toestellen</strong>
            <p>Log in zodat je producten en merken op al je toestellen beschikbaar blijven.</p>
            <button class="signin-cta-btn" (click)="signIn()">
              <ion-icon name="log-in-outline"></ion-icon>
              Inloggen met Google
            </button>
          </div>
        </div>
      }

      <!-- Favorite brands -->
      @if (favoriteBrandDeals().length > 0) {
        <div class="section">
          <div class="section-header">
            <h2>Jouw merken in promo</h2>
            <a routerLink="/brands" class="see-all">Beheer <ion-icon name="arrow-forward"></ion-icon></a>
          </div>
          <div class="deal-carousel">
            @for (deal of favoriteBrandDeals(); track deal.id) {
              <div class="carousel-item"><app-deal-card [deal]="deal"></app-deal-card></div>
            }
          </div>
        </div>
      }

      <!-- Top deals -->
      @if (topDeals().length > 0) {
        <div class="section">
          <div class="section-header">
            <h2>Topdeals van de week</h2>
            <a routerLink="/deals" class="see-all">Alles <ion-icon name="arrow-forward"></ion-icon></a>
          </div>
          <div class="deal-carousel">
            @for (deal of topDeals(); track deal.id) {
              <div class="carousel-item"><app-deal-card [deal]="deal"></app-deal-card></div>
            }
          </div>
        </div>
      }

      <!-- Cashback: genuinely free after reimbursement -->
      @if (cashbackDeals().length > 0) {
        <div class="section">
          <div class="section-header">
            <h2>Gratis na cashback</h2>
          </div>
          <div class="deal-carousel">
            @for (deal of cashbackDeals(); track deal.id) {
              <div class="carousel-item"><app-deal-card [deal]="deal"></app-deal-card></div>
            }
          </div>
        </div>
      }

      <!-- Recent -->
      @if (recentDeals().length > 0) {
        <div class="section">
          <div class="section-header">
            <h2>Nieuw deze week</h2>
          </div>
          <div class="deal-carousel">
            @for (deal of recentDeals(); track deal.id) {
              <div class="carousel-item"><app-deal-card [deal]="deal"></app-deal-card></div>
            }
          </div>
        </div>
      }

      <!-- Expiring -->
      @if (expiringDeals().length > 0) {
        <div class="section">
          <div class="section-header expiring">
            <h2><ion-icon name="timer-outline"></ion-icon> Laatste kans</h2>
          </div>
          <div class="deal-carousel">
            @for (deal of expiringDeals(); track deal.id) {
              <div class="carousel-item"><app-deal-card [deal]="deal"></app-deal-card></div>
            }
          </div>
        </div>
      }

      <div style="height: 16px;"></div>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background:
        radial-gradient(circle at 1px 1px, rgba(10,10,10,0.05) 0.5px, transparent 0.5px) 0 0 / 6px 6px,
        var(--retro-newsprint, #faf7f0);
    }

    ion-searchbar {
      --background: rgba(255,255,255,0.15);
      --color: white;
      --placeholder-color: rgba(255,255,255,0.7);
      --icon-color: rgba(255,255,255,0.8);
      --cancel-button-color: white;
    }

    .opportunity-banner {
      display: flex; align-items: center; gap: 12px;
      margin: 12px 14px; padding: 12px;
      text-decoration: none;
      background:
        radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 0.5px, transparent 0.5px) 0 0 / 5px 5px,
        var(--retro-newsprint-bright, #fffdf7);
      border: 2px solid var(--retro-ink, #0a0a0a);
      box-shadow: 4px 4px 0 0 var(--retro-ink, #0a0a0a);
      color: var(--retro-ink, #0a0a0a);
      transition: transform 0.05s ease;
    }
    .opportunity-banner:active { transform: translate(1px, 1px); box-shadow: 3px 3px 0 0 var(--retro-ink, #0a0a0a); }
    .ob-media {
      width: 76px; height: 76px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid var(--retro-ink, #0a0a0a);
      background: var(--retro-newsprint, #faf7f0);
      overflow: hidden;
    }
    .ob-media img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .ob-emoji { font-size: 2.2rem; opacity: 0.6; }
    .ob-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .ob-kicker {
      font-family: 'Space Mono', monospace;
      font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--retro-ink-soft, #4a4540);
    }
    .ob-name {
      font-family: 'Newsreader', Georgia, serif;
      font-size: 1.05rem; font-weight: 500; line-height: 1.15;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ob-saving {
      font-family: 'Anton', sans-serif;
      font-size: 1.6rem; line-height: 1.05;
      color: var(--retro-red, #e30613);
      font-variant-numeric: tabular-nums;
    }
    .ob-meta {
      font-family: 'Space Mono', monospace;
      font-size: 0.7rem; color: var(--retro-ink-soft, #4a4540);
      font-variant-numeric: tabular-nums;
    }
    .ob-arrow { font-size: 1.3rem; color: var(--retro-ink, #0a0a0a); flex-shrink: 0; }

    .scraping-banner {
      display: flex; align-items: center; gap: 16px;
      margin: 12px; padding: 16px; border-radius: 14px;
      background: var(--ion-card-background, white);
      border-left: 4px solid var(--ion-color-primary);
    }
    .scraping-banner p { margin: 4px 0 0; font-size: 0.85rem; color: var(--ion-color-medium); }

    .retailer-scroll {
      display: flex; gap: 12px; padding: 12px 14px;
      overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;
    }
    .retailer-scroll::-webkit-scrollbar { display: none; }
    .retailer-bubble {
      display: flex; flex-direction: column; align-items: center;
      gap: 4px; text-decoration: none; flex-shrink: 0; position: relative;
    }
    .retailer-logo {
      width: 52px; height: 52px;
      border-radius: 0;
      object-fit: contain;
      background: var(--retro-newsprint-bright);
      padding: 5px;
      border: 2px solid var(--retro-ink);
      box-shadow: 2px 2px 0 0 var(--retro-ink);
    }
    .retailer-logo--mono {
      display: flex; align-items: center; justify-content: center;
      box-sizing: border-box;
      font-family: 'Anton', sans-serif;
      font-size: 0.82rem;
      letter-spacing: 0.02em;
      color: var(--retro-ink);
    }

    .folders-bar {
      display: flex; align-items: center; gap: 8px;
      margin: 0 14px 8px; padding: 10px 14px;
      background: var(--ion-card-background, white);
      border-radius: 12px; font-size: 0.82rem;
      color: var(--ion-color-medium);
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .folders-bar ion-icon { font-size: 1.2rem; color: var(--ion-color-primary); flex-shrink: 0; }
    .folders-bar span { flex: 1; }
    .folders-link {
      display: flex; align-items: center; gap: 3px;
      font-weight: 600; color: var(--ion-color-primary);
      text-decoration: none; white-space: nowrap;
    }
    .folders-link ion-icon { font-size: 0.85rem; }

    .section { margin-bottom: 4px; }
    .section-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 14px 2px;
    }
    .section-header h2 {
      margin: 0;
      font-family: 'Anton', 'Archivo Narrow', sans-serif;
      font-size: 1.3rem; font-weight: 400;
      text-transform: uppercase; letter-spacing: 0.01em;
      color: var(--retro-ink, #0a0a0a);
      display: flex; align-items: center; gap: 6px;
    }
    .section-header.expiring h2 { color: var(--retro-red, #e30613); }
    .see-all {
      display: flex; align-items: center; gap: 3px;
      font-family: 'Archivo Narrow', system-ui, sans-serif;
      font-size: 0.78rem; font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--retro-ink); text-decoration: underline;
      text-decoration-thickness: 1.5px;
      text-underline-offset: 3px;
    }

    .deal-carousel {
      display: flex; gap: 8px; padding: 6px 14px 10px;
      overflow-x: auto; -webkit-overflow-scrolling: touch;
      scrollbar-width: none; scroll-snap-type: x mandatory;
    }
    .deal-carousel::-webkit-scrollbar { display: none; }
    .carousel-item { flex-shrink: 0; width: 160px; display: flex; scroll-snap-align: start; }
    .carousel-item app-deal-card { flex: 1; min-width: 0; }
    .skeleton-card {
      height: 230px;
      border: 2px solid var(--retro-ink, #0a0a0a);
      background:
        linear-gradient(100deg, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0.09) 50%, rgba(0,0,0,0.04) 70%),
        var(--retro-newsprint-bright, #fffdf7);
      background-size: 220% 100%;
      animation: skeleton-shimmer 1.2s ease-in-out infinite;
    }
    @keyframes skeleton-shimmer {
      0% { background-position: 180% 0; }
      100% { background-position: -80% 0; }
    }
    .signin-cta {
      position: relative;
      display: flex; gap: 14px; align-items: flex-start;
      margin: 8px 12px 16px; padding: 16px;
      background: var(--retro-red, #e30613); color: white;
      border: 2px solid var(--retro-ink, #1a1a1a);
      box-shadow: 4px 4px 0 var(--retro-ink, #1a1a1a);
    }
    .signin-cta-dismiss {
      position: absolute; top: 6px; right: 6px;
      background: transparent; border: 0; color: white;
      padding: 4px; cursor: pointer; line-height: 0;
    }
    .signin-cta-dismiss ion-icon { font-size: 1.3rem; }
    .signin-cta-icon { flex-shrink: 0; }
    .signin-cta-icon ion-icon { font-size: 2.2rem; color: var(--retro-yellow, #ffe14d); }
    .signin-cta-body { flex: 1; min-width: 0; padding-right: 16px; }
    .signin-cta-body strong {
      display: block; font-family: var(--font-display, Anton), sans-serif;
      font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .signin-cta-body p { margin: 0 0 10px; font-size: 0.85rem; line-height: 1.35; opacity: 0.95; }
    .signin-cta-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--retro-yellow, #ffe14d); color: var(--retro-ink, #1a1a1a);
      border: 2px solid var(--retro-ink, #1a1a1a); padding: 8px 14px;
      font-family: var(--font-mono, 'Space Mono'), monospace; font-weight: 700;
      text-transform: uppercase; font-size: 0.8rem; cursor: pointer;
      box-shadow: 2px 2px 0 var(--retro-ink, #1a1a1a);
    }
    .signin-cta-btn:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--retro-ink, #1a1a1a); }
    .signin-cta-btn ion-icon { font-size: 1rem; }
  `]
})
export class HomePage implements OnInit {
  dealService = inject(DealService);
  private router = inject(Router);
  private posthog = inject(PosthogService);
  private userData = inject(UserDataService);
  private auth = inject(AuthService);
  private toastCtrl = inject(ToastController);
  private haptics = inject(HapticsService);

  searchOpen = signal(false);
  opportunity = signal<Opportunity | null>(null);
  cashbackDeals = signal<Deal[]>([]);
  getCategoryEmoji = getCategoryEmoji;
  private signInCtaDismissed = signal(localStorage.getItem('signin-cta-dismissed') === '1');

  // Show the CTA for both anonymous and signed-out users; hide only once
  // they've actually linked a real account (Google) — at that point their data
  // is already synced.
  showSignInCta = computed(() => !this.auth.isLinkedAccount() && !this.signInCtaDismissed());

  async signIn() {
    this.posthog.posthog.capture('signin_cta_tapped', { source: 'home' });
    try {
      await this.auth.signInWithGoogle();
    } catch (e) {
      const toast = await this.toastCtrl.create({
        message: 'Inloggen mislukt. Probeer opnieuw.',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
    }
  }

  dismissSignInCta() {
    localStorage.setItem('signin-cta-dismissed', '1');
    this.signInCtaDismissed.set(true);
    this.posthog.posthog.capture('signin_cta_dismissed', { source: 'home' });
  }

  private retailerLogos: Record<string, string> = {
    'lidl': 'https://cdn.jafolders.com/shops/3edf1b56-8ba7-4ae3-8a9f-91a482933067/small.png?v=63931455152',
    'kruidvat': 'https://cdn.jafolders.com/shops/6f42f980-41b1-4016-9b39-c2d668616e9f/small.png?v=63931455078',
    'carrefour': 'https://cdn.jafolders.com/shops/bee9decf-340a-4f48-8777-60335ad8cc57/small.png?v=63931453348',
    'delhaize': 'https://cdn.jafolders.com/shops/1898f67e-c834-4606-9f93-9f427df4468f/small.png?v=63931453833',
    'aldi': 'https://cdn.jafolders.com/shops/83bb328e-de66-47bc-8676-eb6a64ab1459/small.png?v=63931452771',
    'albert-heijn': 'https://cdn.jafolders.com/shops/74c1e78c-ac4c-48dc-84cc-a7ebb61be62a/small.png?v=63931452692',
    'jumbo': 'https://cdn.jafolders.com/shops/cafd54d7-c55b-4f09-8a61-81e1c5045c0c/small.png?v=63931454955',
    'spar': 'https://cdn.jafolders.com/shops/9d399cc4-dcfe-4f58-a666-a9fc239dfbc5/small.png?v=63931455726',
    'carrefour-market': 'https://cdn.jafolders.com/shops/f97d2dd4-27d6-4cb9-bc72-3d454a02e468/small.png?v=63931453359',
    'intermarche': 'https://cdn.jafolders.com/shops/64cf36b0-c448-4714-b197-8c88acb44c0e/small.png?v=63931454929',
    'gamma': 'https://cdn.jafolders.com/shops/102b4525-b46b-4095-b8ed-c8b831e09647/small.png?v=63931454094',
    'brico-bricoplanit': 'https://cdn.jafolders.com/shops/60b0026c-1f32-4b62-9a7d-dcac1ef05644/small.png?v=63931453056',
    'mediamarkt': 'https://cdn.jafolders.com/shops/21a3343f-b472-4bca-a2ca-76fe56258c4c/small.png?v=63931455331',
    'ikea': 'https://cdn.jafolders.com/shops/869aa8ce-3645-4223-bf66-65e82f01522c/small.png?v=63931454918',
    'renmans': 'https://cdn.jafolders.com/shops/b767e806-b139-4f31-893a-74bab5e6e7b9/small.png?v=63931455703',
    'bol-com': 'https://cdn.jafolders.com/shops/32c6e714-939e-4a51-b1cd-fba5989f889c/small.png?v=63931453081',
  };

  getRetailerLogo(slug: string): string {
    return this.retailerLogos[slug] || '';
  }

  /** Letter monogram fallback when a retailer has no logo (e.g. Colruyt) — beats a broken image. */
  monogram(name: string): string {
    return (name || '?').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || '?';
  }

  private isFood(d: Deal): boolean {
    return isFoodDeal(d);
  }

  filteredRetailers = computed(() => {
    const deals = this.dealService.deals();
    const counts = new Map<string, number>();
    for (const d of deals) {
      if (this.isFood(d)) {
        counts.set(d.retailerSlug, (counts.get(d.retailerSlug) || 0) + 1);
      }
    }
    return this.dealService.retailers()
      .map(r => ({ ...r, filteredCount: counts.get(r.slug) || 0 }))
      .filter(r => r.filteredCount > 0)
      .sort((a, b) => b.filteredCount - a.filteredCount);
  });

  topDeals = computed(() =>
    [...this.dealService.deals()]
      .filter(d => this.isFood(d))
      .sort((a, b) => b.discountPercentage - a.discountPercentage)
      .slice(0, 10)
  );

  recentDeals = computed(() => {
    const topIds = new Set(this.topDeals().map(d => d.id));
    return [...this.dealService.deals()]
      .filter(d => this.isFood(d) && !topIds.has(d.id))
      .slice(0, 8);
  });

  expiringDeals = computed(() =>
    this.dealService.deals()
      .filter(d => d.expiringSoon && this.isFood(d))
      .sort((a, b) => (a.validUntil ?? '').localeCompare(b.validUntil ?? ''))
      .slice(0, 6)
  );

  favoriteBrandDeals = computed(() => {
    const favs = this.userData.favoriteBrands();
    if (favs.size === 0) return [];
    return this.dealService.deals()
      .filter(d => d.brand && favs.has(d.brand))
      .sort((a, b) => b.discountPercentage - a.discountPercentage)
      .slice(0, 8);
  });

  constructor() {
    addIcons({ arrowForward, timerOutline, searchOutline, bookOutline, notificationsOutline, closeOutline, logInOutline });
  }

  private pollInterval: any;

  ngOnInit() {
    // Paint last-known data instantly so launch never opens to a spinner/blank
    // while Cloud Run cold-starts; the live fetch in loadData() overwrites it.
    this.dealService.hydrateFromCache();
    const cachedOpp = this.dealService.readCachedOpportunity();
    if (cachedOpp) this.opportunity.set(cachedOpp);

    this.loadData();
    this.startPollingIfEmpty();
    this.trackSignInCtaShownOnce();
  }

  private trackSignInCtaShownOnce() {
    if (!this.showSignInCta()) return;
    if (sessionStorage.getItem('signin-cta-shown-this-session') === '1') return;
    sessionStorage.setItem('signin-cta-shown-this-session', '1');
    this.posthog.posthog.capture('signin_cta_shown', { source: 'home' });
  }

  loadData() {
    this.dealService.loadDeals().subscribe();
    this.dealService.loadRetailers().subscribe();
    this.dealService.getOpportunity().subscribe(o => this.opportunity.set(o));
    this.dealService.getCashbackDeals().subscribe(d => this.cashbackDeals.set(d));
  }

  private startPollingIfEmpty() {
    this.pollInterval = setInterval(() => {
      if (this.dealService.totalDeals() === 0) {
        this.loadData();
      } else {
        clearInterval(this.pollInterval);
      }
    }, 10000);
  }

  doRefresh(event: any) {
    this.haptics.medium();
    this.dealService.loadDeals().subscribe({ complete: () => event.target.complete() });
    this.dealService.loadRetailers().subscribe();
    this.dealService.getOpportunity().subscribe(o => this.opportunity.set(o));
  }

  onSearch(event: CustomEvent) {
    const q = event.detail.value?.trim();
    if (q && q.length >= 2) {
      this.searchOpen.set(false);
      this.router.navigate(['/search'], { queryParams: { q } });
    }
  }
}
