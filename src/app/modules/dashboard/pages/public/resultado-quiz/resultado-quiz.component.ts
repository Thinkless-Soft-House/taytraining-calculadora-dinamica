import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resultado-quiz',
  templateUrl: './resultado-quiz.component.html',
  styleUrls: ['./resultado-quiz.component.scss']
})
export class ResultadoQuizComponent {

  constructor(
    private router: Router
  ) { }

  baixarPdf() {
    window.open('/assets/cardapio-ganho-de-massa.pdf', '_blank');
  }

  refazerQuiz() {
    this.router.navigate(['/quiz']);
  }
}
