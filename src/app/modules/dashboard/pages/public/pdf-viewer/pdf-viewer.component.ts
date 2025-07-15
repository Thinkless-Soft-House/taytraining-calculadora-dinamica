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
  // Debug mode
  debugMode: boolean;
  debugLogs: DebugLog[];
  currentPdfBlob: Blob | null;
}

interface DebugLog {
  timestamp: string;
  step: string;
  status: 'success' | 'error' | 'info' | 'warning';
  message: string;
  details?: any;
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
  private headerClickCount = 0;
  private headerClickTimer: any = null;

  state: PdfViewerState = {
    isLoading: true,
    hasError: false,
    errorMessage: '',
    pdfSrc: null,
    calories: null,
    totalPages: 0,
    currentPage: 1,
    zoom: .89,
    debugMode: false,
    debugLogs: [],
    currentPdfBlob: null
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
      this.state.currentPdfBlob = blob;

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

  // Sistema de debug - clique 10x no header para ativar
  onHeaderClick(): void {
    this.headerClickCount++;

    if (this.headerClickTimer) {
      clearTimeout(this.headerClickTimer);
    }

    this.headerClickTimer = setTimeout(() => {
      this.headerClickCount = 0;
    }, 2000); // Reset após 2 segundos

    if (this.headerClickCount >= 10) {
      this.state.debugMode = !this.state.debugMode;
      this.addDebugLog('system', this.state.debugMode ? 'success' : 'info',
        `Modo debug ${this.state.debugMode ? 'ATIVADO' : 'DESATIVADO'}`);
      this.headerClickCount = 0;
    }
  }

  private addDebugLog(step: string, status: 'success' | 'error' | 'info' | 'warning', message: string, details?: any): void {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      step,
      status,
      message,
      details
    };

    this.state.debugLogs.push(log);

    // Limita a 50 logs para não sobrecarregar
    if (this.state.debugLogs.length > 50) {
      this.state.debugLogs.shift();
    }
  }

  clearDebugLogs(): void {
    this.state.debugLogs = [];
    this.addDebugLog('system', 'info', 'Logs limpos - Nova tentativa de download');
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
    // Limpa logs anteriores
    this.clearDebugLogs();

    this.addDebugLog('init', 'info', 'Iniciando processo de download');

    if (!this.currentPdfBlob) {
      this.addDebugLog('validation', 'error', 'Nenhum PDF disponível para download');
      console.error('Nenhum PDF disponível para download');
      return;
    }

    this.addDebugLog('validation', 'success', `PDF encontrado: ${(this.currentPdfBlob.size / 1024 / 1024).toFixed(2)}MB`);

    try {
      const fileName = `cardapio_${this.state.calories}_calorias.pdf`;
      const isAndroid = this.isAndroidWebView();
      const isIOS = this.isIOSWebView();

      const userAgent = navigator.userAgent;
      this.addDebugLog('detection', 'info', `User Agent: ${userAgent}`);
      this.addDebugLog('detection', 'info', `Android WebView: ${isAndroid}`);
      this.addDebugLog('detection', 'info', `iOS WebView: ${isIOS}`);

      if (isAndroid) {
        this.addDebugLog('strategy', 'info', 'Usando estratégia Android WebView');
        this.downloadForAndroid(fileName);
      } else if (isIOS) {
        this.addDebugLog('strategy', 'info', 'Usando estratégia iOS WebView');
        this.downloadViaDataUrl(fileName);
      } else {
        this.addDebugLog('strategy', 'info', 'Usando estratégia Browser Normal');
        this.downloadViaBlobUrl(fileName);
      }

      this.addDebugLog('completion', 'success', 'Download iniciado com sucesso');
      console.log('✅ Download iniciado');
    } catch (error) {
      this.addDebugLog('error', 'error', 'Erro no processo de download', error);
      console.error('❌ Erro no download:', error);
      // Fallback: tenta abrir em nova janela
      this.fallbackDownload();
    }
  }

  isAndroidWebView(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('android') &&
           (userAgent.includes('wv') || userAgent.includes('version/'));
  }

  isIOSWebView(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('applewebkit') && !userAgent.includes('safari');
  }

  get userAgent(): string {
    return navigator.userAgent;
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  private downloadForAndroid(fileName: string): void {
    this.addDebugLog('android-method1', 'info', 'Tentando método 1: Blob URL com clique imediato');

    try {
      // Método 1: Tenta navegação direta (mais compatível com Android)
      const url = URL.createObjectURL(this.currentPdfBlob!);
      this.addDebugLog('android-method1', 'success', 'Blob URL criada com sucesso');

      // Cria link invisível mas não usa setTimeout
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      this.addDebugLog('android-method1', 'info', 'Link elemento criado');

      document.body.appendChild(link);
      this.addDebugLog('android-method1', 'info', 'Link adicionado ao DOM');

      // Clique imediato sem delay
      link.click();
      this.addDebugLog('android-method1', 'info', 'Clique executado');

      // Cleanup imediato
      document.body.removeChild(link);
      this.addDebugLog('android-method1', 'info', 'Link removido do DOM');

      setTimeout(() => {
        URL.revokeObjectURL(url);
        this.addDebugLog('android-method1', 'success', 'Blob URL revogada - Método 1 concluído');
      }, 100);

    } catch (error) {
      this.addDebugLog('android-method1', 'error', 'Método 1 falhou', error);
      console.error('Método 1 falhou, tentando método 2:', error);

      // Método 2: Fallback para window.open
      this.addDebugLog('android-method2', 'info', 'Tentando método 2: window.open');
      try {
        const url = URL.createObjectURL(this.currentPdfBlob!);
        this.addDebugLog('android-method2', 'success', 'Blob URL criada para window.open');

        const newWindow = window.open(url, '_blank');
        this.addDebugLog('android-method2', 'info', `Window.open executado, resultado: ${newWindow ? 'sucesso' : 'falhou'}`);

        setTimeout(() => {
          URL.revokeObjectURL(url);
          this.addDebugLog('android-method2', 'success', 'Blob URL revogada - Método 2 concluído');
        }, 1000);

      } catch (error2) {
        this.addDebugLog('android-method2', 'error', 'Método 2 falhou', error2);
        console.error('Método 2 falhou, tentando método 3:', error2);

        // Método 3: Data URL como último recurso
        this.addDebugLog('android-method3', 'info', 'Tentando método 3: Data URL como último recurso');
        this.downloadViaDataUrl(fileName);
      }
    }
  }

  // Método para detectar possíveis problemas
  private detectDownloadIssues(): void {
    const userAgent = navigator.userAgent;
    const isAndroid = this.isAndroidWebView();
    const blobSize = this.currentPdfBlob?.size || 0;

    console.log('🔍 Diagnóstico de Download:', {
      userAgent,
      isAndroid,
      blobSize: `${(blobSize / 1024 / 1024).toFixed(2)}MB`,
      supportsBlob: typeof URL.createObjectURL === 'function',
      supportsDataURL: typeof FileReader !== 'undefined',
      isSecureContext: window.isSecureContext
    });
  }

  private downloadViaDataUrl(fileName: string): void {
    this.addDebugLog('dataurl', 'info', 'Iniciando conversão para Data URL');

    const reader = new FileReader();

    reader.onload = () => {
      this.addDebugLog('dataurl', 'success', 'PDF convertido para Data URL com sucesso');

      const dataUrl = reader.result as string;
      const dataUrlSize = dataUrl.length;
      this.addDebugLog('dataurl', 'info', `Tamanho da Data URL: ${(dataUrlSize / 1024 / 1024).toFixed(2)}MB`);

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      link.style.display = 'none';
      this.addDebugLog('dataurl', 'info', 'Link com Data URL criado');

      document.body.appendChild(link);
      this.addDebugLog('dataurl', 'info', 'Link adicionado ao DOM');

      // Para iOS: pode usar setTimeout
      // Para Android: clique imediato é melhor
      const isAndroid = this.isAndroidWebView();

      if (isAndroid) {
        this.addDebugLog('dataurl', 'info', 'Android detectado - clique imediato');
        // Android: clique imediato
        link.click();
        document.body.removeChild(link);
        this.addDebugLog('dataurl', 'success', 'Download Data URL Android concluído');
      } else {
        this.addDebugLog('dataurl', 'info', 'iOS detectado - clique com delay');
        // iOS: com delay (método original que funciona)
        setTimeout(() => {
          link.click();
          this.addDebugLog('dataurl', 'info', 'Clique executado (iOS)');
          setTimeout(() => {
            document.body.removeChild(link);
            this.addDebugLog('dataurl', 'success', 'Download Data URL iOS concluído');
          }, 100);
        }, 100);
      }
    };

    reader.onerror = (error) => {
      this.addDebugLog('dataurl', 'error', 'Erro ao converter PDF para Data URL', error);
      console.error('Erro ao converter PDF para Data URL');
      // Fallback: tenta blob URL
      this.addDebugLog('dataurl-fallback', 'info', 'Tentando fallback para Blob URL');
      this.downloadViaBlobUrl(fileName);
    };

    reader.readAsDataURL(this.currentPdfBlob!);
    this.addDebugLog('dataurl', 'info', 'FileReader.readAsDataURL iniciado');
  }

  private downloadViaBlobUrl(fileName: string): void {
    this.addDebugLog('bloburl', 'info', 'Iniciando download via Blob URL');

    try {
      const url = URL.createObjectURL(this.currentPdfBlob!);
      this.addDebugLog('bloburl', 'success', 'Blob URL criada com sucesso');

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      this.addDebugLog('bloburl', 'info', 'Link elemento criado');

      document.body.appendChild(link);
      this.addDebugLog('bloburl', 'info', 'Link adicionado ao DOM');

      link.click();
      this.addDebugLog('bloburl', 'info', 'Clique executado');

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.addDebugLog('bloburl', 'success', 'Download Blob URL concluído');
      }, 100);

    } catch (error) {
      this.addDebugLog('bloburl', 'error', 'Erro no download via Blob URL', error);
      // Fallback final
      this.addDebugLog('fallback', 'info', 'Tentando fallback final');
      this.fallbackDownload();
    }
  }

  private fallbackDownload(): void {
    this.addDebugLog('fallback', 'info', 'Último recurso: abre em nova janela/tab');

    try {
      const url = URL.createObjectURL(this.currentPdfBlob!);
      this.addDebugLog('fallback', 'success', 'Blob URL criada para fallback');

      const newWindow = window.open(url, '_blank');
      this.addDebugLog('fallback', 'info', `Window.open resultado: ${newWindow ? 'sucesso' : 'falhou (popup bloqueado)'}`);

      if (!newWindow) {
        this.addDebugLog('fallback', 'warning', 'Popup bloqueado - tentando navegação direta');
        // Se popup bloqueado, tenta navegação direta
        window.location.href = url;
        this.addDebugLog('fallback', 'info', 'Navegação direta executada');
      }

      setTimeout(() => {
        URL.revokeObjectURL(url);
        this.addDebugLog('fallback', 'success', 'Fallback concluído');
      }, 1000);

    } catch (error) {
      this.addDebugLog('fallback', 'error', 'Fallback falhou completamente', error);
    }
  }

  // Print que funciona no webview (Android/iOS)
  printPdf(): void {
    if (!this.currentPdfBlob) {
      console.error('Nenhum PDF disponível para impressão');
      return;
    }

    try {
      const isAndroid = this.isAndroidWebView();
      const isIOS = this.isIOSWebView();

      if (isAndroid || isIOS) {
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
