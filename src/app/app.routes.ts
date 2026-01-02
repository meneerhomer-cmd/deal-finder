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
];
