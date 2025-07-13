import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { saveAs } from 'file-saver';

import { QuizStoreService } from '../quiz/quiz.store';
import { MenuService } from '../../../../../api/services/menu.service';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PdfViewerModule
  ],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss'
})
export class PdfViewerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  pdfSrc: any = null;
  isLoading = true;
  hasError = false;
  errorMessage = '';
  menuCalories: number | null = null;
  isDownloading = false;

  constructor(
    private router: Router,
    private quizStore: QuizStoreService,
    private menuService: MenuService
  ) {}

  ngOnInit(): void {
    this.loadPdfData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadPdfData(): Promise<void> {
    try {
      // Busca as calorias do store
      this.menuCalories = this.quizStore.getMenuCalories();

      // Fallback: tenta buscar no sessionStorage se não tem no store
      if (!this.menuCalories) {
        const caloriesFromStorage = sessionStorage.getItem('menuCalories');
        if (caloriesFromStorage) {
          this.menuCalories = parseInt(caloriesFromStorage, 10);
        }
      }

      // Se ainda não tem calorias, mostra erro
      if (!this.menuCalories) {
        this.handleError('Não foi possível encontrar as informações do cardápio. Refaça o quiz.');
        return;
      }

      // Salva no sessionStorage para futuras visitas
      sessionStorage.setItem('menuCalories', this.menuCalories.toString());

      // Busca o PDF do servidor
      this.menuService.getFileByCalories(this.menuCalories)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (blob: Blob) => {
            // Converte o blob em URL para o pdf-viewer
            this.pdfSrc = URL.createObjectURL(blob);
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erro ao carregar PDF:', error);
            this.handleError('Erro ao carregar o cardápio. Tente novamente.');
          }
        });

    } catch (error) {
      console.error('Erro ao buscar dados do PDF:', error);
      this.handleError('Erro ao carregar o cardápio. Tente novamente.');
    }
  }

  private handleError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.isLoading = false;
  }

  onPdfLoadComplete(): void {
    this.isLoading = false;
  }

  onPdfError(error: any): void {
    console.error('Erro no PDF viewer:', error);
    this.handleError('Erro ao exibir o PDF. Tente baixar o arquivo.');
  }

  voltarParaResultado(): void {
    this.router.navigate(['/resultado-quiz']);
  }

  voltarParaQuiz(): void {
    this.router.navigate(['/quiz']);
  }

  baixarPdf(): void {
    if (!this.menuCalories) {
      alert('Erro ao baixar PDF: informações não encontradas.');
      return;
    }

    this.isDownloading = true;

    this.menuService.getFileByCalories(this.menuCalories).subscribe({
      next: (blob: Blob) => {
        const fileName = `cardapio_${this.menuCalories}_calorias.pdf`;

        try {
          // Método 1: Usar FileSaver.js (melhor compatibilidade com mobile)
          saveAs(blob, fileName);

          // Feedback de sucesso para mobile
          if (this.isMobile()) {
            setTimeout(() => {
              alert('Download iniciado! Verifique a pasta de downloads do seu dispositivo.');
            }, 500);
          }
        } catch (error) {
          console.warn('FileSaver falhou, tentando método alternativo:', error);

          try {
            // Método 2: Fallback para browsers que não suportam FileSaver
            this.downloadWithFallback(blob, fileName);
          } catch (fallbackError) {
            console.error('Todos os métodos de download falharam:', fallbackError);

            // Método 3: Último recurso - abrir em nova aba
            this.openInNewTab(blob);
          }
        }

        this.isDownloading = false;
      },
      error: (error) => {
        console.error('Erro ao baixar PDF:', error);
        this.isDownloading = false;
        alert('Erro ao baixar o PDF. Tente novamente.');
      }
    });
  }

  private downloadWithFallback(blob: Blob, fileName: string): void {
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);

    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  private openInNewTab(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');

    if (!newWindow) {
      alert('Popup bloqueado. Por favor, permita popups para este site e tente novamente.');
    } else {
      // Informar ao usuário como salvar
      setTimeout(() => {
        alert('O PDF foi aberto em uma nova aba. Use a opção "Salvar como" do navegador para baixar o arquivo.');
      }, 1000);
    }

    // Cleanup after a delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 10000);
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}
