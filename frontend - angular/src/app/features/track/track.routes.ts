import { Routes } from '@angular/router';

export const trackRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./track.component').then(m => m.TrackComponent),
  },
];
