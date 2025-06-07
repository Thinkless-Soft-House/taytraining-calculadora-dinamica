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
  menuCalories: number | null = null;

  constructor(
    private router: Router,
    private quizStore: QuizStoreService,
    private menuService: MenuService
  ) {
    this.menuPdfUrl = this.quizStore.getMenuPdfUrl();
    // Tenta obter o valor de calorias do store, se existir
    if ((this.quizStore as any).getMenuCalories) {
      this.menuCalories = (this.quizStore as any).getMenuCalories();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  baixarPdf() {
    if (this.menuCalories) {
      this.menuService.getFileByCalories(this.menuCalories).subscribe((blob: Blob) => {
        const fileName = `cardapio_${this.menuCalories}.pdf`;
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(link.href);
      });
      return;
    }
    // Fallback: se não tem calorias, tenta abrir o pdfUrl direto (não recomendado)
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
