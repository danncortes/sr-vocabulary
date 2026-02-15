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
        path: '',
        loadComponent: () =>
            import('./components/main-layout/main-layout.component').then(
                (m) => m.MainLayoutComponent,
            ),
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./components/dashboard/dashboard.component').then(
                        (m) => m.DashboardComponent,
                    ),
            },
            {
                path: 'vocabulary',
                loadComponent: () =>
                    import(
                        './components/vocabulary-view/vocabulary-view.component'
                    ).then((m) => m.VocabularyViewComponent),
            },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
    },
    { path: '**', redirectTo: 'dashboard' },
];
