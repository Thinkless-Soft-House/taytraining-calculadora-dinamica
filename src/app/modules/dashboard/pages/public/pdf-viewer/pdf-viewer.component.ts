import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    MatSnackBarModule,
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
    private menuService: MenuService,
    private snackBar: MatSnackBar
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

  async baixarPdf(): Promise<void> {
    if (!this.menuCalories) {
      this.snackBar.open('Erro ao baixar PDF: informações não encontradas.', 'Fechar', {
        duration: 4000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isDownloading = true;

    // Verificações antes do download
    const permissionsCheck = await this.checkPermissionsAndSpace();
    if (!permissionsCheck.canDownload) {
      this.isDownloading = false;
      this.snackBar.open(permissionsCheck.message, 'Fechar', {
        duration: 6000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    // Se há algum aviso mas pode continuar
    if (permissionsCheck.message !== 'OK') {
      this.snackBar.open(permissionsCheck.message, 'Continuar', {
        duration: 4000,
        panelClass: ['warning-snackbar']
      });
    }

    // Detecta se está em WebView
    if (this.isWebView()) {
      // Para WebView: usar link direto em vez de blob
      this.downloadForWebView();
      return;
    }

    this.menuService.getFileByCalories(this.menuCalories).subscribe({
      next: (blob: Blob) => {
        const fileName = `cardapio_${this.menuCalories}_calorias.pdf`;

        try {
          // Método 1: Usar FileSaver.js (melhor compatibilidade com mobile)
          console.log('Iniciando download com FileSaver.js');
          saveAs(blob, fileName);

          // Feedback de sucesso para mobile
          if (this.isMobile()) {
            setTimeout(() => {
              this.snackBar.open('Download iniciado! Verifique a pasta de downloads do seu dispositivo.', 'OK', {
                duration: 5000,
                panelClass: ['success-snackbar']
              });
            }, 500);
          }

          console.log('FileSaver executou com sucesso');
        } catch (error) {
          console.error('ERRO NO FILESAVER:', error);

          // Verificar o tipo específico de erro
          if (error instanceof Error) {
            if (error.message.includes('Permission denied') || error.message.includes('denied')) {
              this.snackBar.open('Permissão negada para download. Verifique as configurações do navegador.', 'Fechar', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
              this.isDownloading = false;
              return;
            }

            if (error.message.includes('space') || error.message.includes('quota')) {
              this.snackBar.open('Espaço insuficiente para download. Libere espaço e tente novamente.', 'Fechar', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
              this.isDownloading = false;
              return;
            }
          }
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
        this.snackBar.open('Erro ao baixar o PDF. Tente novamente.', 'Fechar', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
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
      this.snackBar.open('Popup bloqueado. Por favor, permita popups para este site e tente novamente.', 'Fechar', {
        duration: 5000,
        panelClass: ['warning-snackbar']
      });
    } else {
      // Informar ao usuário como salvar
      setTimeout(() => {
        this.snackBar.open('O PDF foi aberto em uma nova aba. Use a opção "Salvar como" do navegador para baixar o arquivo.', 'OK', {
          duration: 6000,
          panelClass: ['info-snackbar']
        });
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

  private isWebView(): boolean {
    const userAgent = navigator.userAgent;
    // Detecta WebView através de user agents específicos
    return /wv\)|Version\/.*Chrome/i.test(userAgent) ||
           userAgent.includes('WebView') ||
           userAgent.includes('Instagram') ||
           userAgent.includes('FBAN') ||
           userAgent.includes('FBAV') ||
           // Padrão genérico para apps Android
           (userAgent.includes('Android') && !userAgent.includes('Chrome'));
  }

  private downloadForWebView(): void {
    // Para WebView: usar URL direta que o app pode interceptar
    const downloadUrl = `/api/menu/download/${this.menuCalories}`;

    try {
      // Método 1: Tentar abrir URL direta
      window.location.href = downloadUrl;

      this.isDownloading = false;

      setTimeout(() => {
        this.snackBar.open('Se o download não iniciou, toque no link e escolha "Abrir com" ou "Baixar".', 'OK', {
          duration: 5000,
          panelClass: ['info-snackbar']
        });
      }, 1000);

    } catch (error) {
      console.error('Erro no download para WebView:', error);

      // Fallback: criar link clicável
      this.createDownloadLink(downloadUrl);
    }
  }

  private async checkPermissionsAndSpace(): Promise<{canDownload: boolean, message: string}> {
    try {
      // 1. Verificar permissões de download (se suportado)
      if ('permissions' in navigator) {
        try {
          // @ts-ignore - Permission API pode não estar totalmente tipada
          const permission = await navigator.permissions.query({name: 'downloads'});
          if (permission.state === 'denied') {
            return {
              canDownload: false,
              message: 'Permissão de download negada. Verifique as configurações do navegador.'
            };
          }
        } catch (permError) {
          console.log('Permissões de download não suportadas:', permError);
          // Continua - não é crítico
        }
      }

      // 2. Verificar espaço de armazenamento (se suportado)
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          const quota = estimate.quota || 0;
          const usage = estimate.usage || 0;
          const available = quota - usage;

          // PDF típico ~2MB, verificar se tem pelo menos 5MB livres
          const minRequired = 5 * 1024 * 1024; // 5MB

          if (available < minRequired) {
            return {
              canDownload: false,
              message: `Espaço insuficiente. Disponível: ${this.formatBytes(available)}. Libere espaço e tente novamente.`
            };
          }

          console.log(`Espaço disponível: ${this.formatBytes(available)}`);
        } catch (storageError) {
          console.log('Verificação de espaço não suportada:', storageError);
          // Continua - não é crítico
        }
      }

      // 3. Verificar se pode criar blobs (memória)
      try {
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        if (!testBlob) {
          return {
            canDownload: false,
            message: 'Memória insuficiente para criar o arquivo. Feche outras abas e tente novamente.'
          };
        }
      } catch (blobError) {
        return {
          canDownload: false,
          message: 'Erro de memória. Reinicie o navegador e tente novamente.'
        };
      }

      // 4. Verificar se está em modo privado (limitações de download)
      if (await this.isPrivateMode()) {
        return {
          canDownload: true, // Pode tentar, mas com aviso
          message: 'Modo privado detectado. Downloads podem ter limitações.'
        };
      }

      return { canDownload: true, message: 'OK' };

    } catch (error) {
      console.error('Erro nas verificações:', error);
      return { canDownload: true, message: 'OK' }; // Em caso de erro, permite tentar
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async isPrivateMode(): Promise<boolean> {
    try {
      // Método 1: Tentar usar IndexedDB
      if ('indexedDB' in window) {
        try {
          const db = indexedDB.open('test');
          await new Promise((resolve, reject) => {
            db.onsuccess = resolve;
            db.onerror = reject;
          });
          return false; // Não é modo privado
        } catch {
          return true; // Provavelmente modo privado
        }
      }

      // Método 2: Verificar localStorage
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return false;
      } catch {
        return true;
      }
    } catch {
      return false; // Em caso de erro, assume que não é privado
    }
  }

  private createDownloadLink(url: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = `cardapio_${this.menuCalories}_calorias.pdf`;

    // Adicionar link visível na página
    link.textContent = 'Clique aqui para baixar seu cardápio';
    link.style.cssText = `
      display: block;
      padding: 12px 20px;
      background: #f52a8a;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px auto;
      text-align: center;
      max-width: 300px;
    `;

    // Substituir botão de download
    const downloadButton = document.querySelector('.download-button');
    if (downloadButton && downloadButton.parentNode) {
      downloadButton.parentNode.insertBefore(link, downloadButton.nextSibling);
    }

    this.isDownloading = false;
    this.snackBar.open('Link de download criado abaixo do botão. Clique para baixar.', 'OK', {
      duration: 4000,
      panelClass: ['success-snackbar']
    });
  }
}
