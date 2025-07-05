import { Routes } from '@angular/router';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { HomeQuizComponent } from './modules/dashboard/pages/public/home-quiz/home-quiz.component';
import { QuizComponent } from './modules/dashboard/pages/public/quiz/quiz.component';
import { ResultadoQuizComponent } from './modules/dashboard/pages/public/resultado-quiz/resultado-quiz.component';
import { PdfViewerComponent } from './modules/dashboard/pages/public/pdf-viewer/pdf-viewer.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeQuizComponent
  },
  {
    path: 'quiz',
    component: QuizComponent
  },
  {
    path: 'resultado-quiz',
    component: ResultadoQuizComponent
  },
  {
    path: 'visualizar-pdf',
    component: PdfViewerComponent
  },
  ...dashboardRoutes,
];
