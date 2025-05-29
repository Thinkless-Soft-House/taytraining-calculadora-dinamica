import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-quiz',
  templateUrl: './home-quiz.component.html',
  styleUrl: './home-quiz.component.scss'
})
export class HomeQuizComponent {

  constructor(private router: Router) {}

  startQuiz(): void {
    // Navigate to quiz page or trigger quiz start logic
    console.log('Iniciando quiz...');
    this.router.navigate(['/dashboard/quiz']);
  }
}
