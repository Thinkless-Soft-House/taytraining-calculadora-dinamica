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
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

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
        'Passa a maior parte do dia sentada e pratica o mínimo de exercício físico.',
    },
    {
      id: 'lightly-active',
      title: 'Pouco ativo',
      description:
        'Se movimenta pouco ao longo do dia e pratica exercício físico de 2 a 3 vezes por semana.',
    },
    {
      id: 'moderately-active',
      title: 'Moderadamente ativo',
      description:
        'Se movimento mais ao longo do dia e pratica exercício físico de 3 a 5 vezes por semana.',
    },
    {
      id: 'very-active',
      title: 'Muito ativo',
      description:
        'Se movimenta bastante ao longo do dia e pratica exercício físico de forma intensa de 6 a 7 vezes por semana.',
    },
    {
      id: 'extremely-active',
      title: 'Extremamente ativo',
      description:
        'Atleta que se exercita todos os dias de forma extremamente intensa, realizando até 2 treinos por dia.',
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

      // Log de entrada detalhado
      console.log('🎬 [DEBUG] ===== INICIANDO NOVA CALCULADORA CALÓRICA =====');
      console.log('📝 [DEBUG] Dados de entrada:', {
        idade: `${age} anos`,
        peso: `${weight} kg`,
        altura: `${height} cm`,
        percentualGordura: `${bodyFatPercentage}%`,
        nivelAtividade: activityLevel,
        objetivo: goal === 'fat-loss' ? 'Eliminar gordura' : goal === 'muscle-gain' ? 'Ganhar músculo' : 'Manter peso'
      });

      // Activity factors corrected according to nutritionist specifications
      const activityFactor = this.getActivityFactor(activityLevel);

      // ===== NEW NUTRITIONIST LOGIC =====
      console.log('🚀 [DEBUG] Iniciando cálculo com nova lógica da nutricionista');

      // STEP 1: Get body fat ranges for age
      const bodyFatRanges = this.getBodyFatRanges(age);

      // STEP 2: Classify body fat percentage
      const bodyFatIndex = this.getBodyFatIndex(bodyFatPercentage, bodyFatRanges);

      // STEP 3: Calculate caloric adjustment based on new logic
      const calorieAdjustment = this.getCalorieAdjustment(bodyFatIndex, goal, bodyFatPercentage, age);

      // BMR = 655.1 + (9.56 x W) + (1.85 x H) - (4.68 x A)
      // W = weight (kg) | H = height (cm) | A = age (years)
      const basalMetabolicRate = 655.1 + 9.56 * weight + 1.85 * height - 4.68 * age;
      console.log('🧮 [DEBUG] GEB (Harris-Benedict):', {
        formula: 'GEB = 655,1 + (9,56 × P) + (1,85 × E) - (4,68 × I)',
        peso: weight,
        altura: height,
        idade: age,
        GEB: basalMetabolicRate.toFixed(1)
      });

      const totalEnergyExpenditure = basalMetabolicRate * activityFactor;
      console.log('🔥 [DEBUG] GET (GEB × FA):', {
        GEB: basalMetabolicRate.toFixed(1),
        FA: activityFactor,
        GET: totalEnergyExpenditure.toFixed(1)
      });

      const adjustedEnergyExpenditure =
        calorieAdjustment.val === 0
          ? totalEnergyExpenditure
          : calorieAdjustment.op === 'plus'
          ? totalEnergyExpenditure * (1 + calorieAdjustment.val)
          : totalEnergyExpenditure * (1 - calorieAdjustment.val);

      console.log('🎯 [DEBUG] Cálculo Final:', {
        GET: totalEnergyExpenditure.toFixed(1),
        ajuste: `${calorieAdjustment.op === 'plus' ? '+' : '-'}${(calorieAdjustment.val * 100).toFixed(0)}%`,
        multiplicador: calorieAdjustment.op === 'plus'
          ? (1 + calorieAdjustment.val).toFixed(3)
          : (1 - calorieAdjustment.val).toFixed(3),
        gastoEnergeticoTotal: adjustedEnergyExpenditure.toFixed(1)
      });

      const finalCalories = Math.round(adjustedEnergyExpenditure);

      // Final result log COMPLETE
      console.log('✅ [DEBUG] RESULTADO FINAL:', {
        '=== DADOS ENTRADA ===': '👇',
        idade: `${age} anos`,
        peso: `${weight} kg`,
        altura: `${height} cm`,
        percentualGordura: `${bodyFatPercentage}%`,
        nivelAtividade: activityLevel,
        objetivo: goal,
        '=== CÁLCULOS ===': '👇',
        GEB: `${basalMetabolicRate.toFixed(1)} kcal`,
        fatorAtividade: activityFactor,
        GET: `${totalEnergyExpenditure.toFixed(1)} kcal`,
        ajusteCalórico: `${calorieAdjustment.op === 'plus' ? '+' : '-'}${(calorieAdjustment.val * 100).toFixed(0)}%`,
        caloriasFinal: `${finalCalories} kcal`,
        '=== CLASSIFICAÇÃO ===': '👇',
        faixaEtaria: `${Math.floor(age / 10) * 10}-${Math.floor(age / 10) * 10 + 9} anos`,
        classificacaoGordura: bodyFatIndex === 0 ? 'ATLETA' : bodyFatIndex === 1 ? 'BOM' : bodyFatIndex === 2 ? 'NORMAL' : bodyFatIndex === 3 ? 'ELEVADO' : 'MUITO ELEVADO'
      });
      try {
        const menu: any = await firstValueFrom(
          this.menuService.findByCalories(finalCalories)
        );
        const pdfUrl = menu?.pdfUrl || null;
        this.quizStore.updateMenuPdfUrl(pdfUrl);
        this.quizStore.updateMenuCalories(finalCalories); // Save calories used for PDF
        this.router.navigate(['/resultado-quiz']);
      } catch (error: any) {
        // If 404 error, find the closest match
        if (error?.status === 404) {
          console.warn('Menu não encontrado para as calorias:', finalCalories);
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
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
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

  /**
   * 🏃‍♀️ METHOD 1: Calculate activity factor
   * Corrected according to nutritionist specifications
   */
  private getActivityFactor(activityLevel: string): number {
    const activityFactors: { [id: string]: number } = {
      sedentary: 1.2,
      'lightly-active': 1.3,
      'moderately-active': 1.4,      // ✅ Corrected from 1.375 to 1.4
      'very-active': 1.5,            // ✅ Corrected from 1.55 to 1.5
      'extremely-active': 1.7,       // ✅ Corrected from 1.725 to 1.7
    };

    const factor = activityFactors[activityLevel] || 1.2;
    console.log('🏃‍♀️ [DEBUG] Fator de Atividade:', { activityLevel, factor });
    return factor;
  }

  /**
   * 📊 METHOD 2: Define body fat percentage ranges by age
   * Now with more detailed classifications (20-29, 30-39, 40-49, 50-59)
   */
  private getBodyFatRanges(age: number): Array<{ t?: number; b?: number }> {
    // Determine the correct age group
    let ageGroup: number;
    if (age >= 20 && age <= 29) ageGroup = 20;
    else if (age >= 30 && age <= 39) ageGroup = 30;
    else if (age >= 40 && age <= 49) ageGroup = 40;
    else if (age >= 50 && age <= 59) ageGroup = 50;
    else ageGroup = 50; // Default for ages > 60

    const bodyFatRangesByAge: { [key: number]: Array<{ t?: number; b?: number }> } = {
      20: [ // 20-29 years
        { t: 16 },          // Index 0: ≤16% (ATHLETE)
        { b: 16.1, t: 19 }, // Index 1: 16.1-19% (GOOD)
        { b: 20, t: 28 },   // Index 2: 20-28% (NORMAL)
        { b: 29, t: 31 },   // Index 3: 29-31% (HIGH)
        { b: 31.1 },        // Index 4: >31% (VERY HIGH)
      ],
      30: [ // 30-39 years
        { t: 17 },          // Index 0: ≤17% (ATHLETE)
        { b: 17.1, t: 20 }, // Index 1: 17.1-20% (GOOD)
        { b: 21, t: 29 },   // Index 2: 21-29% (NORMAL)
        { b: 30, t: 32 },   // Index 3: 30-32% (HIGH)
        { b: 32.1 },        // Index 4: >32% (VERY HIGH)
      ],
      40: [ // 40-49 years
        { t: 18 },          // Index 0: ≤18% (ATHLETE)
        { b: 18.1, t: 21 }, // Index 1: 18.1-21% (GOOD)
        { b: 22, t: 30 },   // Index 2: 22-30% (NORMAL)
        { b: 31, t: 33 },   // Index 3: 31-33% (HIGH)
        { b: 33.1 },        // Index 4: >33% (VERY HIGH)
      ],
      50: [ // 50-59 years
        { t: 19 },          // Index 0: ≤19% (ATHLETE)
        { b: 19.1, t: 22 }, // Index 1: 19.1-22% (GOOD)
        { b: 23, t: 31 },   // Index 2: 23-31% (NORMAL)
        { b: 32, t: 34 },   // Index 3: 32-34% (HIGH)
        { b: 34.1 },        // Index 4: >34% (VERY HIGH)
      ],
    };

    const ranges = bodyFatRangesByAge[ageGroup];
    console.log('📊 [DEBUG] Faixas de % Gordura:', {
      age,
      ageGroup: `${ageGroup}-${ageGroup + 9} anos`,
      ranges
    });

    return ranges;
  }

  /**
   * 🎯 METHOD 3: Find body fat percentage classification index
   */
  private getBodyFatIndex(bodyFatPercentage: number, ranges: Array<{ t?: number; b?: number }>): number {
    const index = ranges.findIndex((item) => {
      if (item.t !== undefined && bodyFatPercentage <= item.t) {
        return true;
      }
      if (item.b !== undefined && bodyFatPercentage >= item.b) {
        if (item.t !== undefined) {
          return bodyFatPercentage <= item.t;
        } else {
          return true; // Last range (no upper limit)
        }
      }
      return false;
    });

    const classificationLabels = [
      'ATLETA (Índice 0)',
      'BOM (Índice 1)',
      'NORMAL (Índice 2)',
      'ELEVADO (Índice 3)',
      'MUITO ELEVADO (Índice 4)'
    ];

    console.log('🎯 [DEBUG] Classificação % Gordura:', {
      bodyFatPercentage: `${bodyFatPercentage}%`,
      index,
      classification: classificationLabels[index] || 'NÃO ENCONTRADO'
    });

    return index >= 0 ? index : 4; // If not found, assume worst case
  }

  /**
   * ⚖️ METHOD 4: Calculate caloric adjustment based on new nutritionist logic
   */
  private getCalorieAdjustment(
    bodyFatIndex: number,
    goal: string,
    bodyFatPercentage: number,
    age: number
  ): { op: string; val: number } {
    console.log('⚖️ [DEBUG] Iniciando cálculo de ajuste calórico:', {
      bodyFatIndex,
      goal,
      bodyFatPercentage,
      age
    });

    // CASE 1: HIGH body fat (indexes 3-4) - FORCE weight loss
    if (bodyFatIndex >= 3) {
      const adjustment = bodyFatIndex === 3
        ? { op: 'minus', val: 0.25 } // -25%
        : { op: 'minus', val: 0.30 }; // -30%

      console.log('⚖️ [DEBUG] % Gordura ELEVADA - Forçando emagrecimento:', adjustment);
      return adjustment;
    }

    // CASE 2: ATHLETE body fat (index 0) - Special logic
    if (bodyFatIndex === 0) {
      return this.getAthleteAdjustment(bodyFatPercentage, goal, age);
    }

    // CASE 3: GOOD/NORMAL body fat (indexes 1-2) - RESPECT the goal
    console.log('⚖️ [DEBUG] % Gordura BOM/NORMAL - Respeitando objetivo escolhido');

    if (goal === 'fat-loss') {
      return { op: 'minus', val: 0.25 }; // -25%
    } else if (goal === 'muscle-gain') {
      return { op: 'plus', val: 0.10 };  // +10%
    } else {
      return { op: 'plus', val: 0 };     // No adjustment
    }
  }

  /**
   * 🏆 METHOD 5: Special logic for athletes (index 0)
   */
  private getAthleteAdjustment(bodyFatPercentage: number, goal: string, age: number): { op: string; val: number } {
    console.log('🏆 [DEBUG] Calculando ajuste para ATLETA:', { bodyFatPercentage, goal, age });

    // For ages 40-49 and 50-59, there's special subdivision
    const needsSpecialSubdivision = age >= 40;

    if (needsSpecialSubdivision) {
      // Check if in ultra-athlete range (≤17%) or normal athlete (17.1-18% or 17.1-19%)
      const isUltraAthlete = bodyFatPercentage <= 17;

      if (isUltraAthlete) {
        // Ultra athlete: more aggressive adjustments
        console.log('🏆 [DEBUG] SUPER-ATLETA (≤17%) - Ajustes agressivos');
        if (goal === 'fat-loss') return { op: 'minus', val: 0.20 }; // -20%
        if (goal === 'muscle-gain') return { op: 'plus', val: 0.12 }; // +12%
        return { op: 'plus', val: 0 }; // Maintain weight
      } else {
        // Normal athlete: standard adjustments
        console.log('🏆 [DEBUG] ATLETA NORMAL (17.1-18/19%) - Ajustes padrões');
        if (goal === 'fat-loss') return { op: 'minus', val: 0.25 }; // -25%
        if (goal === 'muscle-gain') return { op: 'plus', val: 0.10 }; // +10%
        return { op: 'plus', val: 0 }; // Maintain weight
      }
    } else {
      // For ages 20-29 and 30-39: always ultra-athlete
      console.log('🏆 [DEBUG] ATLETA JOVEM (20-39 anos) - Ajustes agressivos');
      if (goal === 'fat-loss') return { op: 'minus', val: 0.20 }; // -20%
      if (goal === 'muscle-gain') return { op: 'plus', val: 0.12 }; // +12%
      return { op: 'plus', val: 0 }; // Maintain weight
    }
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
        <p>
          Detectamos que você já possui um cardápio personalizado. O que deseja
          fazer?
        </p>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-button (click)="onContinue()" class="continue-btn">
          Ver meu cardápio
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="onRestart()"
          class="restart-btn"
        >
          Fazer novo quiz
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
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
      .continue-btn,
      .restart-btn {
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
        .continue-btn,
        .restart-btn {
          width: auto;
          flex: 1;
        }
      }
    `,
  ],
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
