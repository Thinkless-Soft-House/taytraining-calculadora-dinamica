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
    private quizStore: QuizStoreService
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
      console.log('Quiz completed!', this.quizStore.getCurrentData());
      // Navigate to results or process data
    }
  }

  onStepChange(event: any): void {
    this.currentStep = event.selectedIndex + 1;
  }
}
