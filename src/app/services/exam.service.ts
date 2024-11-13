import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Question, ExamConfig } from '../models/question.interface';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private questions: Question[] = [];
  private currentQuestionIndex = new BehaviorSubject<number>(0);
  private userAnswers = new Map<number, number[]>();
  private examConfig: ExamConfig = {
    showAnswersImmediately: false,
    timeLimit: 120,
    passingScore: 70
  };

  constructor(private http: HttpClient) {}

  loadQuestions(): Observable<{questions: Question[]}> {
    return this.http.get<{questions: Question[]}>('assets/questions.json');
  }

  setQuestions(questions: Question[]): void {
    this.questions = questions;
  }

  setExamConfig(config: ExamConfig): void {
    this.examConfig = config;
  }

  getCurrentQuestion(): Question {
    return this.questions[this.currentQuestionIndex.value];
  }

  submitAnswer(questionId: number, selectedAnswers: number[]): boolean {
    this.userAnswers.set(questionId, selectedAnswers);
    
    if (this.examConfig.showAnswersImmediately) {
      return this.checkAnswer(questionId);
    }
    return true;
  }

  private checkAnswer(questionId: number): boolean {
    const question = this.questions.find(q => q.id === questionId);
    const userAnswer = this.userAnswers.get(questionId) || [];
    
    const correctAnswers = question?.answers
      .filter(a => a.isCorrect)
      .map(a => a.id);
    
    return JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswers?.sort());
  }

  calculateScore(): number {
    let correctAnswers = 0;
    this.userAnswers.forEach((answers, questionId) => {
      if (this.checkAnswer(questionId)) {
        correctAnswers++;
      }
    });
    
    return (correctAnswers / this.questions.length) * 100;
  }
}