import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../models/question.interface';

@Component({
  selector: 'app-question-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full bg-white shadow-md rounded-lg p-4 mb-4">
      <h3 class="text-lg font-medium text-gray-700 mb-3">Question Navigation</h3>
      
      <!-- Navigation Grid -->
      <div class="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
        <button
          *ngFor="let question of questions; let i = index"
          (click)="onQuestionSelect(i)"
          [class]="getQuestionButtonClass(question, i)"
          [attr.aria-label]="'Go to question ' + (i + 1)"
        >
          {{ i + 1 }}
        </button>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
        <div class="flex items-center">
          <div class="w-4 h-4 rounded bg-blue-500 mr-2"></div>
          <span>Current</span>
        </div>
        <div class="flex items-center">
          <div class="w-4 h-4 rounded bg-green-500 mr-2"></div>
          <span>Answered</span>
        </div>
        <div class="flex items-center">
          <div class="w-4 h-4 rounded bg-yellow-500 mr-2"></div>
          <span>Skipped</span>
        </div>
        <div class="flex items-center">
          <div class="w-4 h-4 rounded bg-gray-200 mr-2"></div>
          <span>Unanswered</span>
        </div>
      </div>
    </div>
  `
})
export class QuestionNavComponent {
  @Input() questions: Question[] = [];
  @Input() currentIndex: number = 0;
  @Output() questionSelected = new EventEmitter<number>();

  getQuestionButtonClass(question: Question, index: number): string {
    const baseClasses = 'w-full h-10 rounded font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ';
    
    if (index === this.currentIndex) {
      return baseClasses + 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500';
    }
    if (question.isAnswered) {
      return baseClasses + 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500';
    }
    if (question.isSkipped) {
      return baseClasses + 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500';
    }
    return baseClasses + 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500';
  }

  onQuestionSelect(index: number): void {
    this.questionSelected.emit(index);
  }
}