import { Routes } from '@angular/router';
import { RouteMarker } from './route-marker';
import { authenticatedGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'discover', component: RouteMarker },
  { path: 'artists', component: RouteMarker },
  { path: 'artists/:id', component: RouteMarker },
  { path: 'login', component: RouteMarker },
  { path: 'register', component: RouteMarker },
  { path: 'favorites', component: RouteMarker, canActivate: [authenticatedGuard] },
  { path: 'songs/:id/edit', component: RouteMarker, canActivate: [authenticatedGuard] },
  { path: 'songs/:id', component: RouteMarker },
  { path: 'add', component: RouteMarker, canActivate: [authenticatedGuard] },
  { path: '', pathMatch: 'full', component: RouteMarker },
  { path: '**', redirectTo: '' },
];
