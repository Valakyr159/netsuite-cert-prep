import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ExamService } from '../../services/exam.service';
import { Question, ExamConfig, Answer } from '../../models/question.interface';

interface AnswerState {
  selected: boolean;
  correct?: boolean;
  revealed?: boolean;
}

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <!-- Config Section -->
      <div *ngIf="!examStarted" class="relative py-3 sm:max-w-xl sm:mx-auto">
        <div class="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div class="max-w-md mx-auto">
            <div class="divide-y divide-gray-200">
              <div class="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 class="text-2xl font-bold mb-4">NetSuite Foundation Certification Practice Exam</h2>
                <div class="flex flex-col gap-4">
                  <label class="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      [(ngModel)]="examConfig.showAnswersImmediately"
                      class="form-checkbox h-5 w-5 text-blue-600"
                    >
                    <span>Show answers immediately after each question</span>
                  </label>
                  <button
                    (click)="startExam()"
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Start Exam
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Exam Section -->
      <div *ngIf="examStarted" class="relative py-3 sm:max-w-3xl sm:mx-auto w-full px-4">
        <div class="bg-white shadow-lg sm:rounded-3xl sm:p-8">
          <div class="mx-auto">
            <div *ngIf="currentQuestion">
              <!-- Question Counter and Type -->
              <div class="flex justify-between items-center mb-6">
                <div class="text-sm text-gray-600">
                  Question {{currentQuestionIndex + 1}} of {{questions.length}}
                </div>
                <div class="text-sm text-blue-600 font-medium">
                  {{currentQuestion.type === 'single' ? 'Single Choice' : 'Multiple Choice'}}
                </div>
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
              <div *ngIf="showingFeedback" class="mt-4">
                <div *ngIf="currentQuestion.explanation" 
                     class="p-4 rounded-lg" 
                     [ngClass]="isCurrentQuestionCorrect() ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
                  <p class="font-medium mb-2">
                    {{isCurrentQuestionCorrect() ? 'Correct!' : 'Incorrect'}}
                  </p>
                  <p class="text-sm">{{currentQuestion.explanation}}</p>
                </div>
              </div>

              <!-- Navigation Buttons -->
              <div class="flex justify-between mt-6">
                <button
                  *ngIf="currentQuestionIndex > 0"
                  (click)="previousQuestion()"
                  class="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                <div class="flex gap-3">
                  <button
                    *ngIf="!showingFeedback"
                    (click)="submitCurrentAnswer()"
                    class="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    Submit Answer
                  </button>
                  <button
                    *ngIf="currentQuestionIndex < questions.length - 1"
                    [disabled]="examConfig.showAnswersImmediately && !showingFeedback"
                    (click)="nextQuestion()"
                    class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    *ngIf="currentQuestionIndex === questions.length - 1 && showingFeedback"
                    (click)="submitExam()"
                    class="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600 transition-colors"
                  >
                    Finish Exam
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Modal -->
      <div *ngIf="showResults" 
           class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
        <div class="relative p-8 border w-full max-w-md shadow-lg rounded-lg bg-white">
          <div class="text-center">
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Exam Results</h3>
            <div class="mb-6">
              <p class="text-4xl font-bold mb-2" 
                 [class]="score >= examConfig.passingScore ? 'text-green-600' : 'text-red-600'">
                {{score.toFixed(1)}}%
              </p>
              <p class="text-gray-600">
                {{getScoreMessage()}}
              </p>
            </div>
            <div class="mt-6">
              <button
                (click)="resetExam()"
                class="w-full px-4 py-2 bg-blue-500 text-white text-lg font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ExamComponent implements OnInit {
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
    passingScore: 70
  };

  constructor(private examService: ExamService) {}

  ngOnInit() {
    this.examService.loadQuestions().subscribe(data => {
      this.questions = data.questions;
      this.examService.setQuestions(data.questions);
      this.initializeAnswerStates();
    });
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

  startExam() {
    this.examStarted = true;
    this.examService.setExamConfig(this.examConfig);
    this.currentQuestion = this.questions[0];
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