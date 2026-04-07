import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
  },
  {
    path: 'deals',
    loadComponent: () => import('./pages/deals/deals.page').then(m => m.DealsPage),
  },
  {
    path: 'retailers',
    loadComponent: () => import('./pages/retailers/retailers.page').then(m => m.RetailersPage),
  },
  {
    path: 'retailer/:slug',
    loadComponent: () => import('./pages/deals/deals.page').then(m => m.DealsPage),
  },
  {
    path: 'deal/:id',
    loadComponent: () => import('./pages/deal-detail/deal-detail.page').then(m => m.DealDetailPage),
  },
  {
    path: 'shopping-list',
    loadComponent: () => import('./pages/shopping-list/shopping-list.page').then(m => m.ShoppingListPage),
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.page').then(m => m.SearchPage),
  },
  {
    path: 'brands',
    loadComponent: () => import('./pages/brands/brands.page').then(m => m.BrandsPage),
  },
  {
    path: 'flyer/:shopSlug/:brochureId',
    loadComponent: () => import('./pages/flyer-viewer/flyer-viewer.page').then(m => m.FlyerViewerPage),
  },
  {
    path: 'optimizer',
    loadComponent: () => import('./pages/optimizer/optimizer.page').then(m => m.OptimizerPage),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
