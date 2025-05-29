import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { LoginComponent } from './pages/public/login/login.component';
import { MenuComponent } from './pages/private/menu/menu.component';
import { HomeQuizComponent } from './pages/public/home-quiz/home-quiz.component';
import { authGuard } from '../../shared/guards/auth.guard';

export const dashboardRoutes: Routes = [
  {
    path: 'admin',
    component: DashboardComponent,
    children: [
      {
        path: '',
        component: MenuComponent,
        canActivate: [authGuard],
      },
      {
        path: 'login',
        component: LoginComponent,
      },
    ],
  },
];
