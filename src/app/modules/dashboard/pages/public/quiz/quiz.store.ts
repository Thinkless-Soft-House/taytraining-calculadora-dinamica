import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PersonalData {
  age: number;
  height: number;
  weight: number;
  bodyFatPercentage: number;
}

export interface QuizData {
  goal: string | null;
  personalData: PersonalData | null;
  activityLevel: string | null;
  menuPdfUrl?: string | null;
  menuCalories?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class QuizStoreService {
  private initialData: QuizData = {
    goal: null,
    personalData: null,
    activityLevel: null,
    menuPdfUrl: null,
    menuCalories: null
  };

  private quizDataSubject = new BehaviorSubject<QuizData>(this.initialData);
  public quizData$: Observable<QuizData> = this.quizDataSubject.asObservable();

  constructor() {}

  getCurrentData(): QuizData {
    return this.quizDataSubject.value;
  }

  updateGoal(goal: string): void {
    const currentData = this.getCurrentData();
    this.quizDataSubject.next({
      ...currentData,
      goal
    });
  }

  updatePersonalData(personalData: PersonalData): void {
    const currentData = this.getCurrentData();
    this.quizDataSubject.next({
      ...currentData,
      personalData
    });
  }

  updateActivityLevel(activityLevel: string): void {
    const currentData = this.getCurrentData();
    this.quizDataSubject.next({
      ...currentData,
      activityLevel
    });
  }

  updateMenuPdfUrl(menuPdfUrl: string | null): void {
    const currentData = this.getCurrentData();
    this.quizDataSubject.next({
      ...currentData,
      menuPdfUrl
    });
  }

  updateMenuCalories(menuCalories: number | null): void {
    const currentData = this.getCurrentData();
    this.quizDataSubject.next({
      ...currentData,
      menuCalories
    });
  }

  clearData(): void {
    this.quizDataSubject.next(this.initialData);
  }

  isQuizComplete(): boolean {
    const data = this.getCurrentData();
    return !!(data.goal && data.personalData && data.activityLevel);
  }

  // Helper methods for specific data access
  getGoal(): string | null {
    return this.getCurrentData().goal;
  }

  getPersonalData(): PersonalData | null {
    return this.getCurrentData().personalData;
  }

  getActivityLevel(): string | null {
    return this.getCurrentData().activityLevel;
  }

  getMenuPdfUrl(): string | null {
    return this.getCurrentData().menuPdfUrl || null;
  }

  getMenuCalories(): number | null {
    return this.getCurrentData().menuCalories ?? null;
  }
}
