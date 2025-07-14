import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { QuizStoreService } from '../quiz/quiz.store';
import { MenuService } from '../../../../../api/services/menu.service';

interface PdfViewerState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  pdfSrc: Uint8Array | null;
  calories: number | null;
  totalPages: number;
  currentPage: number;
  zoom: number;
}

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    PdfViewerModule
  ],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss'
})
export class PdfViewerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private currentPdfBlob: Blob | null = null;

  state: PdfViewerState = {
    isLoading: true,
    hasError: false,
    errorMessage: '',
    pdfSrc: null,
    calories: null,
    totalPages: 0,
    currentPage: 1,
    zoom: .89
  };

  constructor(
    private router: Router,
    private quizStore: QuizStoreService,
    private menuService: MenuService
  ) {}

  ngOnInit(): void {
    this.initializePdfViewer();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializePdfViewer(): void {
    const calories = this.getCaloriesValue();

    if (!calories) {
      this.setErrorState('Não foi possível encontrar as informações do cardápio. Refaça o quiz.');
      return;
    }

    this.state.calories = calories;
    this.loadPdfFromServer(calories);
  }

  private getCaloriesValue(): number | null {
    let calories = this.quizStore.getMenuCalories();

    if (!calories) {
      const stored = localStorage.getItem('menuCalories');
      if (stored) {
        calories = parseInt(stored, 10);
        if (isNaN(calories)) {
          return null;
        }
      }
    }

    if (calories) {
      localStorage.setItem('menuCalories', calories.toString());
    }

    return calories;
  }

  private loadPdfFromServer(calories: number): void {
    console.log(`🔍 Carregando PDF para ${calories} calorias`);

    this.menuService.getFileByCalories(calories)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.state.isLoading = false;
        })
      )
      .subscribe({
        next: (blob: Blob) => this.handlePdfBlob(blob),
        error: (error) => this.handlePdfError(error)
      });
  }

  private async handlePdfBlob(blob: Blob): Promise<void> {
    console.log(`📄 PDF recebido: ${blob.size} bytes, tipo: ${blob.type}`);

    if (!blob || blob.size === 0) {
      this.setErrorState('Arquivo PDF não encontrado no servidor.');
      return;
    }

    try {
      // Armazena o blob para download/print
      this.currentPdfBlob = blob;

      // Converte blob para Uint8Array para ng2-pdf-viewer
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      this.state.pdfSrc = uint8Array;
      console.log('✅ PDF convertido para ng2-pdf-viewer');

    } catch (error) {
      console.error('❌ Erro ao processar PDF:', error);
      this.setErrorState('Erro ao processar o arquivo PDF.');
    }
  }

  private handlePdfError(error: any): void {
    console.error('❌ Erro ao carregar PDF:', error);

    let errorMessage = 'Erro ao carregar o cardápio.';

    if (error.status === 404) {
      errorMessage = 'Cardápio não encontrado para essas calorias.';
    } else if (error.status === 0) {
      errorMessage = 'Erro de conexão. Verifique sua internet.';
    }

    this.setErrorState(errorMessage);
  }

  private setErrorState(message: string): void {
    this.state.hasError = true;
    this.state.errorMessage = message;
    this.state.isLoading = false;
  }

  // Métodos públicos para navegação
  goBackToResult(): void {
    this.router.navigate(['/resultado-quiz']);
  }

  retakeQuiz(): void {
    this.router.navigate(['/quiz']);
  }

  // Métodos para controle do PDF
  onLoadComplete(pdf: any): void {
    this.state.totalPages = pdf.numPages;
    console.log('✅ PDF carregado com sucesso! Total de páginas:', pdf.numPages);
  }

  onError(error: any): void {
    console.error('❌ Erro no PDF viewer:', error);
    this.setErrorState('Erro ao exibir o PDF. Tente recarregar a página.');
  }

  // Controles de navegação
  previousPage(): void {
    if (this.state.currentPage > 1) {
      this.state.currentPage--;
    }
  }

  nextPage(): void {
    if (this.state.currentPage < this.state.totalPages) {
      this.state.currentPage++;
    }
  }

  zoomIn(): void {
    this.state.zoom = Math.min(this.state.zoom + 0.25, 3.0);
  }

  zoomOut(): void {
    this.state.zoom = Math.max(this.state.zoom - 0.25, 0.5);
  }

  resetZoom(): void {
    this.state.zoom = 1.0;
  }

  // Download que funciona no webview (Android/iOS)
  downloadPdf(): void {
    if (!this.currentPdfBlob) {
      console.error('Nenhum PDF disponível para download');
      return;
    }

    try {
      // Detecta se está em webview mobile
      const isWebView = this.isInWebView();
      const fileName = `cardapio_${this.state.calories}_calorias.pdf`;

      if (isWebView) {
        // Para webview: usa data URL que é mais compatível
        this.downloadViaDataUrl(fileName);
      } else {
        // Para browsers normais: usa blob URL
        this.downloadViaBlobUrl(fileName);
      }

      console.log('✅ Download iniciado');
    } catch (error) {
      console.error('❌ Erro no download:', error);
      // Fallback: tenta abrir em nova janela
      this.fallbackDownload();
    }
  }

  private isInWebView(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroidWebView = userAgent.includes('wv') || userAgent.includes('version/') && userAgent.includes('chrome');
    const isIOSWebView = userAgent.includes('applewebkit') && !userAgent.includes('safari');

    return isAndroidWebView || isIOSWebView ||
           (window as any).ReactNativeWebView !== undefined ||
           (window as any).webkit?.messageHandlers !== undefined;
  }

  private downloadViaDataUrl(fileName: string): void {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;

      // Para webview, força o download
      link.style.display = 'none';
      document.body.appendChild(link);

      // Simula clique com delay para webview
      setTimeout(() => {
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      }, 100);
    };
    reader.readAsDataURL(this.currentPdfBlob!);
  }

  private downloadViaBlobUrl(fileName: string): void {
    const url = URL.createObjectURL(this.currentPdfBlob!);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }

  private fallbackDownload(): void {
    // Último recurso: abre em nova janela/tab
    const url = URL.createObjectURL(this.currentPdfBlob!);
    const newWindow = window.open(url, '_blank');

    if (!newWindow) {
      // Se popup bloqueado, tenta navegação direta
      window.location.href = url;
    }

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Print que funciona no webview (Android/iOS)
  printPdf(): void {
    if (!this.currentPdfBlob) {
      console.error('Nenhum PDF disponível para impressão');
      return;
    }

    try {
      const isWebView = this.isInWebView();

      if (isWebView) {
        // Para webview: converte para data URL
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          this.openPrintWindow(dataUrl);
        };
        reader.readAsDataURL(this.currentPdfBlob);
      } else {
        // Para browsers normais: usa blob URL
        const url = URL.createObjectURL(this.currentPdfBlob);
        this.openPrintWindow(url);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) {
      console.error('❌ Erro na impressão:', error);
      // Fallback: abre PDF em nova janela
      this.fallbackDownload();
    }
  }

  private openPrintWindow(url: string): void {
    const printWindow = window.open(url, '_blank', 'width=800,height=600');

    if (printWindow) {
      printWindow.onload = () => {
        // Delay para garantir que o PDF carregou
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } else {
      // Se popup bloqueado, navega para o PDF
      window.open(url, '_blank');
    }
  }
}
