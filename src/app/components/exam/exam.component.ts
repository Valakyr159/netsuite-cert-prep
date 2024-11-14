import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ExamService } from '../../services/exam.service';
import { Question, ExamConfig, Answer, ExamYear } from '../../models/question.interface';
import { QuestionNavComponent } from '../question-nav/question-nav.component';
import { CircularTimerComponent } from '../circular-timer/circular-timer.component';


interface AnswerState {
  selected: boolean;
  correct?: boolean;
  revealed?: boolean;
}

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, QuestionNavComponent, CircularTimerComponent],
  template: `
    <div class="min-h-screen bg-gray-100 p-4 lg:p-6">
      <!-- Config Section -->
      <div *ngIf="!examStarted" class="max-w-xl mx-auto">
        <div class="bg-white shadow-lg rounded-2xl p-6 lg:p-8">
          <h2 class="text-2xl font-bold mb-6 text-gray-800">NetSuite Foundation Certification Practice Exam</h2>
          
          <!-- Exam Selection -->
          <div class="space-y-6">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Select Exam Year</label>
                <select [(ngModel)]="selectedYear" 
                        (ngModelChange)="updateSubsetOptions()"
                        class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option *ngFor="let exam of availableYears" [value]="exam.year">
                    {{exam.year}} Certification Exam
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Select Question Set</label>
                <select [(ngModel)]="selectedSubset"
                        class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option *ngFor="let option of subsetOptions" [value]="option.id">
                    {{option.name}}
                  </option>
                </select>
              </div>
            </div>

            <div class="space-y-4">
              <label class="flex items-center space-x-3">
                <input
                  type="checkbox"
                  [(ngModel)]="examConfig.showAnswersImmediately"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="text-gray-700">Show answers immediately after each question</span>
              </label>

              <label class="flex items-center space-x-3">
                <input
                  type="checkbox"
                  [(ngModel)]="examConfig.randomize"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="text-gray-700">Randomize questions</span>
              </label>
            </div>

            <button
              (click)="startExam()"
              class="w-full py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Start Exam
            </button>
          </div>
        </div>
      </div>

      <!-- Exam Section -->
      <div *ngIf="examStarted" class="max-w-4xl mx-auto">
        <!-- Top Stats Bar -->
        <div class="bg-white shadow-md rounded-lg p-4 mb-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Timer -->
            <div class="flex items-center justify-center sm:justify-start">
              <app-circular-timer [remainingTime]="remainingTimeDisplay"></app-circular-timer>
            </div>

            <!-- Question Counter -->
            <div class="flex items-center justify-center text-gray-700">
              Question {{currentQuestionIndex + 1}} of {{questions.length}}
            </div>

            <!-- Status -->
            <div class="flex justify-center sm:justify-end gap-4 text-sm">
              <span class="text-green-600">✓ {{questionStatus.answered}}</span>
              <span class="text-yellow-600">↷ {{questionStatus.skipped}}</span>
              <span class="text-gray-600">○ {{questionStatus.remaining}}</span>
            </div>
          </div>
        </div>

        <!-- Question Navigation -->
        <app-question-nav
          [questions]="questions"
          [currentIndex]="currentQuestionIndex"
          (questionSelected)="goToQuestion($event)"
        ></app-question-nav>

        <!-- Question Content -->
        <div class="bg-white shadow-lg rounded-lg p-4 lg:p-8" *ngIf="currentQuestion">
          <!-- Question Type Badge -->
          <div class="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4"
               [ngClass]="currentQuestion.type === 'single' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
            {{currentQuestion.type === 'single' ? 'Single Choice' : 'Multiple Choice'}}
          </div>

          <!-- Question Text -->
          <div class="text-lg font-medium mb-6 text-gray-800">
            {{currentQuestion.text}}
          </div>

          <!-- Answers -->
          <div class="space-y-3">
            <div *ngFor="let answer of currentQuestion.answers"
                 (click)="toggleAnswer(answer)"
                 [class]="getAnswerClasses(answer)"
                 >
              <div class="p-4">
                {{answer.text}}
              </div>
            </div>
          </div>

          <!-- Answer Feedback -->
          <div *ngIf="showingFeedback" class="mt-6">
            <div class="p-4 rounded-lg" 
                 [ngClass]="isCurrentQuestionCorrect() ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
              <p class="font-medium mb-2">
                {{isCurrentQuestionCorrect() ? '✓ Correct!' : '✗ Incorrect'}}
              </p>
              <p>{{currentQuestion.explanation}}</p>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex flex-wrap gap-3 mt-6">
            <button
              *ngIf="currentQuestionIndex > 0"
              (click)="previousQuestion()"
              class="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Previous
            </button>

            <button
              *ngIf="!showingFeedback"
              (click)="skipQuestion()"
              class="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              Skip
            </button>

            <button
              *ngIf="!showingFeedback"
              (click)="submitCurrentAnswer()"
              class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Submit
            </button>

            <button
              *ngIf="currentQuestionIndex < questions.length - 1"
              [disabled]="examConfig.showAnswersImmediately && !showingFeedback"
              (click)="nextQuestion()"
              class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>

            <button
              *ngIf="currentQuestionIndex === questions.length - 1 && showingFeedback"
              (click)="submitExam()"
              class="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Finish Exam
            </button>
          </div>
        </div>
      </div>

      <!-- Results Modal -->
      <div *ngIf="showResults" 
           class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
        <div class="relative max-w-md w-full bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <div class="text-center">
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Exam Results</h3>
            <div class="mb-6">
              <p class="text-5xl font-bold mb-3" 
                 [class]="score >= examConfig.passingScore ? 'text-green-600' : 'text-red-600'">
                {{score.toFixed(1)}}%
              </p>
              <p class="text-gray-600">
                {{getScoreMessage()}}
              </p>
            </div>
            <button
              (click)="resetExam()"
              class="w-full py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ExamComponent implements OnInit, OnDestroy {
  examStarted = false;
  questions: Question[] = [];
  currentQuestion?: Question;
  currentQuestionIndex = 0;
  answerStates: Map<number, AnswerState> = new Map();
  showResults = false;
  showingFeedback = false;
  score = 0;
  examConfig: ExamConfig = {
    showAnswersImmediately: false,
    timeLimit: 120,
    passingScore: 70,
    examYear: '',
    subsetType: 'full',
    randomize: undefined
  };
  availableYears: ExamYear[] = [];
  subsetOptions: { id: string; name: string }[] = [];
  selectedYear = '2023';
  selectedSubset = 'full';
  remainingTimeDisplay: number = 0;
  questionStatus = {
    answered: 0,
    skipped: 0,
    remaining: 0
  };

  constructor(private examService: ExamService) {
    this.availableYears = this.examService.getAvailableYears();
    this.updateSubsetOptions();
  }

  updateSubsetOptions() {
    this.subsetOptions = this.examService.getSubsetOptions(this.selectedYear);
    this.selectedSubset = 'full'; // Reset to full exam when year changes
  }

  startExam() {
    const subsetConfig = this.examService.parseSubsetOption(this.selectedSubset);

    this.examService.loadQuestions(this.selectedYear)
      .subscribe(questions => {
        // Calculate time limit based on number of questions
        const timeLimit = this.examService.calculateTimeLimit(questions);

        this.examConfig = {
          ...this.examConfig,
          examYear: this.selectedYear,
          timeLimit: timeLimit, // 2 minutes per question
          ...subsetConfig
        };

        this.examService.setExamConfig(this.examConfig);
        this.examService.setQuestions(questions);
        this.questions = this.examService.getQuestions();
        this.currentQuestion = this.questions[0];
        this.initializeAnswerStates();
        this.examService.startTimer();
        this.examStarted = true;
        this.updateQuestionStatus();
      });
  }

  ngOnInit() {
    // Subscribe to timer
    this.examService.getRemainingTime().subscribe(time => {
      this.remainingTimeDisplay = time; 
  });
  }

  ngOnDestroy() {
    this.examService.stopTimer();
  }




  skipQuestion() {
    if (this.currentQuestion) {
      this.examService.skipQuestion(this.currentQuestion.id);
      this.nextQuestion();
      this.updateQuestionStatus();
    }
  }

  updateQuestionStatus() {
    this.questionStatus = this.examService.getQuestionStatus();
  }

  initializeAnswerStates() {
    this.questions.forEach(question => {
      question.answers.forEach(answer => {
        const key = this.getAnswerKey(question.id, answer.id);
        this.answerStates.set(key, { selected: false });
      });
    });
  }

  getAnswerKey(questionId: number, answerId: number): number {
    return questionId * 1000 + answerId;
  }

  toggleAnswer(answer: Answer) {
    if (!this.currentQuestion || this.showingFeedback) return;

    const key = this.getAnswerKey(this.currentQuestion.id, answer.id);
    const currentState = this.answerStates.get(key);

    if (this.currentQuestion.type === 'single') {
      // Deselect all other answers for this question
      this.currentQuestion.answers.forEach(a => {
        const aKey = this.getAnswerKey(this.currentQuestion!.id, a.id);
        this.answerStates.set(aKey, { selected: false });
      });
    }

    this.answerStates.set(key, {
      selected: currentState ? !currentState.selected : true
    });
  }

  getAnswerClasses(answer: Answer): string {
    if (!this.currentQuestion) return '';

    const key = this.getAnswerKey(this.currentQuestion.id, answer.id);
    const state = this.answerStates.get(key);

    if (!state) return '';

    let classes = 'cursor-pointer rounded-lg transition-all duration-200 border-2 ';

    if (state.revealed) {
      if (answer.isCorrect) {
        classes += 'bg-green-50 border-green-500 ';
      } else if (state.selected) {
        classes += 'bg-red-50 border-red-500 ';
      } else {
        classes += 'border-gray-200 ';
      }
    } else if (state.selected) {
      classes += 'bg-gray-100 border-blue-500 ';
    } else {
      classes += 'hover:bg-gray-50 border-gray-200 ';
    }

    return classes;
  }

  submitCurrentAnswer() {
    if (!this.currentQuestion) return;

    const selectedAnswerIds = Array.from(this.answerStates.entries())
      .filter(([key, state]) => {
        const questionId = Math.floor(key / 1000);
        return questionId === this.currentQuestion!.id && state.selected;
      })
      .map(([key]) => key % 1000);


    const isCorrect = this.examService.submitAnswer(this.currentQuestion.id, selectedAnswerIds);

    if (isCorrect) {
      this.examService.markQuestionAnswered(this.currentQuestion.id);
    } else {
      this.examService.markQuestionIncorrect(this.currentQuestion.id);
    }

    this.updateQuestionStatus();

    // Reveal correct/incorrect answers
    this.currentQuestion.answers.forEach(answer => {
      const key = this.getAnswerKey(this.currentQuestion!.id, answer.id);
      const currentState = this.answerStates.get(key);
      this.answerStates.set(key, {
        ...currentState!,
        revealed: true
      });
    });

    this.showingFeedback = true;
  }

  isCurrentQuestionCorrect(): boolean {
    if (!this.currentQuestion) return false;

    const selectedAnswerIds = Array.from(this.answerStates.entries())
      .filter(([key, state]) => {
        const questionId = Math.floor(key / 1000);
        return questionId === this.currentQuestion!.id && state.selected;
      })
      .map(([key]) => key % 1000);

    const correctAnswerIds = this.currentQuestion.answers
      .filter(a => a.isCorrect)
      .map(a => a.id);

    return JSON.stringify(selectedAnswerIds.sort()) === JSON.stringify(correctAnswerIds.sort());
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      this.showingFeedback = false;
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      this.showingFeedback = false;
    }
  }

  goToQuestion(index: number): void {
    this.currentQuestionIndex = index;
    this.currentQuestion = this.questions[index];
    this.showingFeedback = false;
  }

  submitExam() {
    this.score = this.calculateFinalScore();
    this.showResults = true;
  }

  calculateFinalScore(): number {
    let correctAnswers = 0;
    this.questions.forEach(question => {
      const selectedAnswerIds = Array.from(this.answerStates.entries())
        .filter(([key, state]) => {
          const questionId = Math.floor(key / 1000);
          return questionId === question.id && state.selected;
        })
        .map(([key]) => key % 1000);

      const correctAnswerIds = question.answers
        .filter(a => a.isCorrect)
        .map(a => a.id);

      if (JSON.stringify(selectedAnswerIds.sort()) === JSON.stringify(correctAnswerIds.sort())) {
        correctAnswers++;
      }
    });

    return (correctAnswers / this.questions.length) * 100;
  }

  getScoreMessage(): string {
    if (this.score >= this.examConfig.passingScore) {
      return 'Congratulations! You have passed the practice exam!';
    }
    return `You need ${this.examConfig.passingScore}% to pass. Keep practicing!`;
  }

  resetExam() {
    this.examStarted = false;
    this.currentQuestionIndex = 0;
    this.showResults = false;
    this.showingFeedback = false;
    this.score = 0;
    this.initializeAnswerStates();
  }
}