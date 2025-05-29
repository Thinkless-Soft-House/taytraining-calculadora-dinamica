import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { QuizStoreService } from '../quiz/quiz.store';

@Component({
  selector: 'app-resultado-quiz',
  templateUrl: './resultado-quiz.component.html',
  styleUrls: ['./resultado-quiz.component.scss']
})
export class ResultadoQuizComponent {
  menuPdfUrl: string | null = null;

  constructor(
    private router: Router,
    private quizStore: QuizStoreService
  ) {
    this.menuPdfUrl = this.quizStore.getMenuPdfUrl();
  }

  baixarPdf() {
    if (this.menuPdfUrl) {
      window.open(this.menuPdfUrl, '_blank');
    } else {
      alert('PDF não encontrado.');
    }
  }

  refazerQuiz() {
    this.router.navigate(['/quiz']);
  }
}
