import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material imports
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { QuizStoreService } from './quiz.store';
import { Router } from '@angular/router';
import { MenuService } from '../../../../../api/services/menu.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss',
})
export class QuizComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentStep = 1;
  totalSteps = 3;

  step1Form: FormGroup;
  step2Form: FormGroup;
  step3Form: FormGroup;

  goalOptions = [
    {
      id: 'fat-loss',
      title: 'Eliminar gordura',
      description: 'Para potencializar queima de gordura',
    },
    {
      id: 'muscle-gain',
      title: 'Ganhar músculo',
      description: 'Aumentar massa muscular',
    },
    {
      id: 'maintain-weight',
      title: 'Manter o peso',
      description: 'Melhorar performance',
    },
  ];

  activityLevels = [
    {
      id: 'sedentary',
      title: 'Sedentário',
      description:
        'Passa a maior parte do dia sentado e pratica o mínimo de exercício físico.',
    },
    {
      id: 'lightly-active',
      title: 'Levemente ativo',
      description: 'Pratica exercício físico de 1 a 3 vezes por semana.',
    },
    {
      id: 'moderately-active',
      title: 'Moderadamente ativo',
      description:
        'Pratica exercício físico de forma moderada, de 3 a 5 vezes por semana.',
    },
    {
      id: 'very-active',
      title: 'Muito ativo',
      description:
        'Pratica exercício físico de forma intensa, de 6 a 7 vezes por semana',
    },
    {
      id: 'extremely-active',
      title: 'Extremamente ativo',
      description:
        'Atleta que se exercita de forma extremamente intensa, realizando até dois treinos por dia.',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private quizStore: QuizStoreService,
    private router: Router,
    private menuService: MenuService,
    private dialog: MatDialog
  ) {
    this.step1Form = this.fb.group({
      goal: ['', Validators.required],
    });

    this.step2Form = this.fb.group({
      age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      height: ['', [Validators.required, Validators.min(1)]],
      weight: ['', [Validators.required, Validators.min(1)]],
      bodyFatPercentage: [
        '',
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
    });

    this.step3Form = this.fb.group({
      activityLevel: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Verifica se já existe um cardápio salvo no sessionStorage
    this.checkExistingResult();

    // Load existing data from store
    this.quizStore.quizData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data.goal) this.step1Form.patchValue({ goal: data.goal });
        if (data.personalData) this.step2Form.patchValue(data.personalData);
        if (data.activityLevel)
          this.step3Form.patchValue({ activityLevel: data.activityLevel });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onStep1Change(): void {
    if (this.step1Form.valid) {
      this.quizStore.updateGoal(this.step1Form.value.goal);
    }
  }

  onStep2Change(): void {
    if (this.step2Form.valid) {
      this.quizStore.updatePersonalData(this.step2Form.value);
    }
  }

  onStep3Change(): void {
    if (this.step3Form.valid) {
      this.quizStore.updateActivityLevel(this.step3Form.value.activityLevel);
    }
  }

  selectGoal(goalId: string): void {
    this.step1Form.patchValue({ goal: goalId });
    this.onStep1Change();
  }

  selectActivityLevel(levelId: string): void {
    this.step3Form.patchValue({ activityLevel: levelId });
    this.onStep3Change();
  }

  async onQuizComplete(): Promise<void> {
    if (this.step1Form.valid && this.step2Form.valid && this.step3Form.valid) {
      const { age, weight, height, bodyFatPercentage } = this.step2Form.value;
      const activityLevel = this.step3Form.value.activityLevel;
      const goal = this.step1Form.value.goal;

      // Log de entrada (manter para validação)
      console.log('Dados:', { age, weight, height, bodyFatPercentage, activityLevel, goal });

      const activityFactors: { [id: string]: number } = {
        sedentary: 1.2,
        'lightly-active': 1.3,
        'moderately-active': 1.375,
        'very-active': 1.55,
        'extremely-active': 1.725,
      };
      const FA = activityFactors[activityLevel] || 1.2;

      // Tipos auxiliares para faixaSituacao
      type FaixaItem = { t?: number; b?: number };
      type FaixaSituacaoType = { [key: number]: FaixaItem[] };

      // Ajustar faixaSituacao para trabalhar com percentual de gordura em porcentagem (0-100)
      const faixaSituacao: FaixaSituacaoType = {
        20: [
          { t: 16 },
          { b: 16, t: 19 },
          { b: 20, t: 28 },
          { b: 29, t: 31 },
          { b: 31 },
        ],
        30: [
          { t: 17 },
          { b: 17, t: 20 },
          { b: 21, t: 29 },
          { b: 30, t: 32 },
          { b: 32 },
        ],
        40: [
          { t: 18 },
          { b: 18, t: 21 },
          { b: 22, t: 30 },
          { b: 31, t: 33 },
          { b: 33 },
        ],
        50: [
          { t: 19 },
          { b: 19, t: 22 },
          { b: 23, t: 31 },
          { b: 32, t: 34 },
          { b: 34 },
        ],
      };

      const gastoEnergetico = [
        { op: 'plus', val: 0.12 },
        { op: 'plus', val: 0.08 },
        { op: 'plus', val: 0 },
        { op: 'minus', val: 0.15 },
        { op: 'minus', val: 0.25 },
      ];

      // Pegar o index da dezena da idade
      const dezenaIdade = Math.floor(age / 10) * 10;
      const faixaCorretasituacao =
        faixaSituacao[dezenaIdade] || faixaSituacao[50];

      // Encontrar índice do percentual de gordura
      const percentualGorduraIndex = faixaCorretasituacao.findIndex(
        (item: FaixaItem) => {
          if (item.t !== undefined && bodyFatPercentage <= item.t) {
            return true;
          }
          if (item.b !== undefined && bodyFatPercentage >= item.b) {
            if (item.t !== undefined) {
              return bodyFatPercentage <= item.t;
            } else {
              return true;
            }
          }
          return false;
        }
      );

      const gastoEnergeticoForIndex = [
        { op: 'plus', val: 0.1 }, // fat-loss
        { op: 'plus', val: 0.1 }, // muscle-gain
        { op: 'plus', val: 0 }, // maintain-weight
      ];

      let valorGastoEnergetico;

      if (percentualGorduraIndex >= 0 && percentualGorduraIndex <= 2) {
        // Seleciona o valor conforme o objetivo (goal)
        let goalIndex = 0;
        if (goal === 'muscle-gain') goalIndex = 1;
        else if (goal === 'maintain-weight') goalIndex = 2;
        valorGastoEnergetico = gastoEnergeticoForIndex[goalIndex];
      } else {
        valorGastoEnergetico =
          gastoEnergetico[
            percentualGorduraIndex >= 0
              ? percentualGorduraIndex
              : gastoEnergetico.length - 1
          ];
      }

      // GEB = 655,1 + (9,56 x P) + (1,85 x E) - (4,68 x I)
      // P = peso (kg) | E = estatura (cm) | I = idade (anos)
      const GEB = 655.1 + 9.56 * weight + 1.85 * height - 4.68 * age;

      const gastoEnergeticoComFA = GEB * FA;

      const gastoEnergeticoTotal =
        valorGastoEnergetico.val === 0
          ? gastoEnergeticoComFA
          : valorGastoEnergetico.op === 'plus'
          ? gastoEnergeticoComFA * (1 + valorGastoEnergetico.val)
          : gastoEnergeticoComFA * (1 - valorGastoEnergetico.val);

      const calorias = Math.round(gastoEnergeticoTotal);

      // Log do resultado final (manter para validação)
      console.log('Resultado:', { GEB, FA, gastoEnergeticoComFA, valorGastoEnergetico, gastoEnergeticoTotal, calorias });
      try {
        const menu: any = await firstValueFrom(
          this.menuService.findByCalories(calorias)
        );
        const pdfUrl = menu?.pdfUrl || null;
        this.quizStore.updateMenuPdfUrl(pdfUrl);
        this.quizStore.updateMenuCalories(calorias); // Salva as calorias usadas para o PDF
        this.router.navigate(['/resultado-quiz']);
      } catch (error: any) {
        // Se for erro 404, buscar o mais próximo
        if (error?.status === 404) {
          console.warn('Menu não encontrado para as calorias:', calorias);
          this.router.navigate(['/resultado-quiz']);
        } else {
          alert(
            'Não foi possível encontrar um cardápio para sua faixa calórica.'
          );
        }
      }
    }
  }

  private checkExistingResult(): void {
    const existingCalories = sessionStorage.getItem('menuCalories');
    if (existingCalories) {
      this.showConfirmationDialog();
    }
  }

  private showConfirmationDialog(): void {
    const dialogRef = this.dialog.open(QuizConfirmationDialogComponent, {
      width: '90%',
      maxWidth: '400px',
      disableClose: true,
      panelClass: 'quiz-confirmation-dialog',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'restart') {
        // Limpa o sessionStorage e continua no quiz
        sessionStorage.removeItem('menuCalories');
        this.quizStore.clearData();
      } else if (result === 'continue') {
        // Vai para a página de resultado
        this.router.navigate(['/resultado-quiz']);
      }
    });
  }

  onStepChange(event: any): void {
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scrolla para o topo ao mudar de step
    this.currentStep = event.selectedIndex + 1;
  }
}

// Componente de diálogo de confirmação
@Component({
  selector: 'app-quiz-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Você já tem um cardápio!</h2>
      <mat-dialog-content>
        <p>Detectamos que você já possui um cardápio personalizado. O que deseja fazer?</p>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-button (click)="onContinue()" class="continue-btn">Ver meu cardápio</button>
        <button mat-raised-button color="primary" (click)="onRestart()" class="restart-btn">Fazer novo quiz</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 8px;
    }
    h2 {
      color: #111827;
      font-size: 1.4rem;
      margin: 0 0 16px 0;
      text-align: center;
      font-weight: 700;
    }
    mat-dialog-content {
      margin: 16px 0;
      text-align: center;
      color: #6b7280;
      line-height: 1.5;
    }
    mat-dialog-actions {
      display: flex;
      flex-direction: row;
      gap: 8px;
      margin-top: 16px;
      padding: 0;
    }
    .continue-btn, .restart-btn {
      width: 100%;
      height: 44px;
      font-size: 1rem;
      font-weight: 600;
    }
    .restart-btn {
      background: #f52a8a !important;
      color: white;
    }
    @media (min-width: 480px) {
      mat-dialog-actions {
        flex-direction: row;
        justify-content: space-between;
      }
      .continue-btn, .restart-btn {
        width: auto;
        flex: 1;
      }
    }
  `]
})
export class QuizConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<QuizConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onRestart(): void {
    this.dialogRef.close('restart');
  }

  onContinue(): void {
    this.dialogRef.close('continue');
  }
}
