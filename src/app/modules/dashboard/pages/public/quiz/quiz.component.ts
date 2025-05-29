import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material imports
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import { QuizStoreService } from './quiz.store';
import { Router } from '@angular/router';

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
    MatIconModule
  ],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss'
})
export class QuizComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentStep = 1;
  totalSteps = 3;

  step1Form: FormGroup;
  step2Form: FormGroup;
  step3Form: FormGroup;

  goalOptions = [
    { id: 'fat-loss', title: 'Eliminar gordura', description: 'Para quem tem % de gordura alto' },
    { id: 'muscle-gain', title: 'Ganhar músculo', description: 'Aumentar massa muscular' },
    { id: 'maintain-weight', title: 'Manter o peso', description: 'Melhorar performance' }
  ];

  activityLevels = [
    {
      id: 'sedentary',
      title: 'Sedentário',
      description: 'Passa a maior parte do dia sentado e pratica o mínimo de exercício físico.'
    },
    {
      id: 'lightly-active',
      title: 'Levemente ativo',
      description: 'Pratica exercício físico de 1 a 3 vezes por semana.'
    },
    {
      id: 'moderately-active',
      title: 'Moderadamente ativo',
      description: 'Pratica exercício físico de forma moderada, de 3 a 5 vezes por semana.'
    },
    {
      id: 'very-active',
      title: 'Muito ativo',
      description: 'Pratica exercício físico de forma intensa, de 6 a 7 vezes por semana'
    },
    {
      id: 'extremely-active',
      title: 'Extremamente ativo',
      description: 'Atleta que se exercita de forma extremamente intensa, realizando até dois treinos por dia.'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private quizStore: QuizStoreService,
    private router: Router
  ) {
    this.step1Form = this.fb.group({
      goal: ['', Validators.required]
    });

    this.step2Form = this.fb.group({
      age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      height: ['', [Validators.required, Validators.min(1)]],
      weight: ['', [Validators.required, Validators.min(1)]],
      bodyFatPercentage: ['', [Validators.required, Validators.min(0), Validators.max(100)]]
    });

    this.step3Form = this.fb.group({
      activityLevel: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Load existing data from store
    this.quizStore.quizData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data.goal) this.step1Form.patchValue({ goal: data.goal });
        if (data.personalData) this.step2Form.patchValue(data.personalData);
        if (data.activityLevel) this.step3Form.patchValue({ activityLevel: data.activityLevel });
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

  onQuizComplete(): void {
    if (this.step1Form.valid && this.step2Form.valid && this.step3Form.valid) {
      // Obter dados do formulário
      const { age, weight, height, bodyFatPercentage } = this.step2Form.value;

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
          { b: 31 }
        ],
        30: [
          { t: 16 },
          { b: 16, t: 19 },
          { b: 20, t: 28 },
          { b: 29, t: 31 },
          { b: 31 }
        ],
        40: [
          { t: 16 },
          { b: 16, t: 19 },
          { b: 20, t: 28 },
          { b: 29, t: 31 },
          { b: 31 }
        ],
        50: [
          { t: 16 },
          { b: 16, t: 19 },
          { b: 20, t: 28 },
          { b: 29, t: 31 },
          { b: 31 }
        ]
      };

      const gastoEnergetico = [
        { op: "plus", val: 0.12 },
        { op: "plus", val: 0.08 },
        { op: "plus", val: 0 },
        { op: "minus", val: 0.08 },
        { op: "minus", val: 0.12 }
      ];

      // Pegar o index da dezena da idade
      const dezenaIdade = Math.floor(age / 10) * 10;
      const faixaCorretasituacao = faixaSituacao[dezenaIdade] || faixaSituacao[50];

      // Encontrar índice do percentual de gordura
      const percentualGorduraIndex = faixaCorretasituacao.findIndex((item: FaixaItem) => {
        if (item.t !== undefined && bodyFatPercentage <= item.t) {
          return true;
        }
        if (item.b !== undefined && bodyFatPercentage >= item.b) {
          return true;
        }
        return false;
      });

      const valorGastoEnergetico = gastoEnergetico[
        percentualGorduraIndex >= 0 ? percentualGorduraIndex : gastoEnergetico.length - 1
      ];

      // GEB = 655,1 + (9,56 x P) + (1,85 x E) - (4,68 x I)
      // P = peso (kg) | E = estatura (cm) | I = idade (anos)
      const GEB = 655.1 + 9.56 * weight + 1.85 * height - 4.68 * age;
      const gastoEnergeticoTotal =
        valorGastoEnergetico.val === 0
          ? GEB
          : valorGastoEnergetico.op === "plus"
          ? GEB * (1 + valorGastoEnergetico.val)
          : GEB * (1 - valorGastoEnergetico.val);

      // Exibir resultado no console (ou prossiga conforme necessário)
      console.log('Quiz completed!', {
        ...this.quizStore.getCurrentData(),
        gastoEnergeticoTotal: Math.round(gastoEnergeticoTotal)
      });

      this.router.navigate(['/resultado-quiz']);
    }
  }

  onStepChange(event: any): void {
    this.currentStep = event.selectedIndex + 1;
  }
}
