import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./components/login/login.component').then(
                (m) => m.LoginComponent,
            ),
        canActivate: [loginGuard],
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./components/dashboard/dashboard.component').then(
                (m) => m.DashboardComponent,
            ),
        canActivate: [authGuard],
    },
    { path: '**', redirectTo: 'dashboard' },
];
