import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Question, ExamConfig, ExamYear } from '../models/question.interface';

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
    passingScore: 70,
    examYear: '2023',
    subsetType: 'full',
    randomize: undefined
  };
  private remainingTime = new BehaviorSubject<number>(120 * 60); // seconds
  private timer: any;

  private availableYears: ExamYear[] = [
    { year: '2023', totalQuestions: 50, subsetSize: 10 },
    { year: '2022', totalQuestions: 50, subsetSize: 10 },
    { year: '2021', totalQuestions: 50, subsetSize: 10 }
  ];

  constructor(private http: HttpClient) {}

  getQuestions(): Question[] {
    return this.questions;
  }

  setQuestions(questions: Question[]): void {
    let processedQuestions = this.processQuestions(questions);
    
    // Handle randomization if enabled
    if (this.examConfig.randomize) {
      processedQuestions = this.shuffleArray(processedQuestions);
    }
    
    this.questions = processedQuestions;
  }


  getAvailableYears(): ExamYear[] {
    return this.availableYears;
  }

  getSubsetOptions(year: string): { id: string; name: string }[] {
    const yearConfig = this.availableYears.find(y => y.year === year);
    if (!yearConfig) return [];

    const options = [
      { id: 'full', name: 'Complete Exam' }
    ];

    // Generate range options
    const totalSubsets = Math.ceil(yearConfig.totalQuestions / yearConfig.subsetSize);
    for (let i = 0; i < totalSubsets; i++) {
      const start = i * yearConfig.subsetSize + 1;
      const end = Math.min((i + 1) * yearConfig.subsetSize, yearConfig.totalQuestions);
      options.push({
        id: `range_${start}_${end}`,
        name: `Questions ${start}-${end}`
      });
    }

    // Add random option
    options.push({
      id: 'random',
      name: `Random ${yearConfig.subsetSize} Questions`
    });

    return options;
  }

  loadQuestions(year: string): Observable<Question[]> {
    return this.http.get<{questions: Question[]}>(`assets/questions-SFCT${year}.json`)
      .pipe(
        map(response => response.questions)
      );
  }

  processQuestions(questions: Question[]): Question[] {
    let processedQuestions = [...questions];
    
    switch (this.examConfig.subsetType) {
      case 'range':
        if (this.examConfig.questionRange) {
          const { start, end } = this.examConfig.questionRange;
          processedQuestions = processedQuestions.slice(start - 1, end);
        }
        break;
      
      case 'random':
        if (this.examConfig.randomCount) {
          processedQuestions = this.shuffleArray(processedQuestions)
            .slice(0, this.examConfig.randomCount);
        }
        break;
      
      // 'full' case doesn't need special processing
      default:
        break;
    }

    // Tracking properties to each question
    return processedQuestions.map(q => ({
      ...q,
      isAnswered: false,
      isSkipped: false
    }));
  }

   // Method to set current question index
  setCurrentQuestionIndex(index: number): void {
    this.currentQuestionIndex.next(index);
  }

  // Enhanced question status tracking
  markQuestionAnswered(questionId: number): void {
    const question = this.questions.find(q => q.id === questionId);
    if (question) {
      question.isAnswered = true;
      question.isSkipped = false;
    }
  }

  // Method to check if a question has been answered
  isQuestionAnswered(questionId: number): boolean {
    const question = this.questions.find(q => q.id === questionId);
    return question?.isAnswered || false;
  }

  // Method to get user answers for a specific question
  getUserAnswersForQuestion(questionId: number): number[] {
    return this.userAnswers.get(questionId) || [];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  parseSubsetOption(optionId: string): Partial<ExamConfig> {
    if (optionId === 'full') {
      return { subsetType: 'full' };
    }
    
    if (optionId === 'random') {
      const yearConfig = this.availableYears.find(y => y.year === this.examConfig.examYear);
      return {
        subsetType: 'random',
        randomCount: yearConfig?.subsetSize || 10
      };
    }
    
    if (optionId.startsWith('range_')) {
      const [start, end] = optionId.replace('range_', '').split('_').map(Number);
      return {
        subsetType: 'range',
        questionRange: { start, end }
      };
    }

    return {};
  }

  startTimer(): void {
    this.remainingTime.next(this.examConfig.timeLimit * 60);
    this.timer = setInterval(() => {
      const currentTime = this.remainingTime.getValue();
      if (currentTime > 0) {
        this.remainingTime.next(currentTime - 1);
      } else {
        this.stopTimer();
        // Implement auto-submit functionality
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  getRemainingTime(): Observable<number> {
    return this.remainingTime.asObservable();
  }

  skipQuestion(questionId: number): void {
    const question = this.questions.find(q => q.id === questionId);
    if (question) {
      question.isSkipped = true;
    }
  }

  getQuestionStatus(): {
    answered: number,
    skipped: number,
    remaining: number
  } {
    const answered = this.questions.filter(q => q.isAnswered).length;
    const skipped = this.questions.filter(q => q.isSkipped).length;
    return {
      answered,
      skipped,
      remaining: this.questions.length - answered - skipped
    };
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