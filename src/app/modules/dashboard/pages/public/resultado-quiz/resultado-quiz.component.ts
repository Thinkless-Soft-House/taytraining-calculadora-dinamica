import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { QuizStoreService } from '../quiz/quiz.store';
import { MenuService } from '../../../../../api/services/menu.service';

@Component({
  selector: 'app-resultado-quiz',
  templateUrl: './resultado-quiz.component.html',
  styleUrls: ['./resultado-quiz.component.scss']
})
export class ResultadoQuizComponent {
  menuPdfUrl: string | null = null;
  menuId: number | null = null;
  menuCalories: number | null = null;  constructor(
    private router: Router,
    private quizStore: QuizStoreService,
    private menuService: MenuService
  ) {
    // Primeiro verifica se tem calorias no sessionStorage
    const caloriesFromStorage = sessionStorage.getItem('menuCalories');
    if (caloriesFromStorage) {
      this.menuCalories = parseInt(caloriesFromStorage, 10);
    }

    // Se não tem no sessionStorage, tenta buscar do store
    if (!this.menuCalories) {
      this.menuPdfUrl = this.quizStore.getMenuPdfUrl();
      if ((this.quizStore as any).getMenuCalories) {
        this.menuCalories = (this.quizStore as any).getMenuCalories();
      }
    }

    // Salva as calorias no sessionStorage para futuras visitas
    if (this.menuCalories) {
      sessionStorage.setItem('menuCalories', this.menuCalories.toString());
    }

    // Se não tem calorias de lugar nenhum, redireciona para o quiz
    if (!this.menuCalories) {
      this.router.navigate(['/quiz']);
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  baixarPdf() {
    // Agora navega para o visualizador de PDF ao invés de baixar diretamente
    if (this.menuCalories) {
      this.router.navigate(['/visualizar-pdf']);
      return;
    }

    // Fallback: se não tem calorias, vai pro quiz
    alert('Informações do cardápio não encontradas. Refaça o quiz.');
    this.router.navigate(['/quiz']);
  }

  refazerQuiz() {
    // Limpa o sessionStorage ao refazer o quiz
    sessionStorage.removeItem('menuCalories');
    // Limpa o store também
    this.quizStore.clearData();
    this.router.navigate(['/quiz']);
  }
}
