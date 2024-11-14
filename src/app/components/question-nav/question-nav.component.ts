import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../models/question.interface';

@Component({
  selector: 'app-question-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full bg-white shadow-md rounded-lg p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-800">Question Navigation</h3>
        <div class="flex items-center gap-4">
          <button
            (click)="toggleExpand()"
            class="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
          >
            {{ isExpanded ? 'Collapse' : 'Expand' }}
          </button>
        </div>
      </div>
      
      <!-- Navigation Grid/Scroll Container -->
      <div 
        #scrollContainer
        [class]="isExpanded ? 'grid grid-cols-10 gap-3 mb-4' : 'flex gap-2 overflow-x-auto pb-4 mb-4'"
        style="scrollbar-width: thin; scrollbar-color: #CBD5E1 #F1F5F9;"
      >
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
      <div class="flex flex-wrap gap-6 justify-center py-2 border-t border-gray-100">
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
          <span class="text-sm text-gray-600">Current</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span class="text-sm text-gray-600">Answered</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
          <span class="text-sm text-gray-600">Skipped</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <span class="text-sm text-gray-600">Incorrect</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 rounded-full bg-gray-200 mr-2"></div>
          <span class="text-sm text-gray-600">Unanswered</span>
        </div>
      </div>
    </div>
  `
})
export class QuestionNavComponent implements AfterViewInit {
  @Input() questions: Question[] = [];
  @Input() currentIndex: number = 0;
  @Output() questionSelected = new EventEmitter<number>();
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  
  isExpanded = false;

  ngAfterViewInit() {
    this.scrollToCurrentQuestion();
  }

  scrollToCurrentQuestion() {
    if (!this.isExpanded) {
      const container = this.scrollContainer.nativeElement;
      const buttons = container.getElementsByTagName('button');
      if (buttons[this.currentIndex]) {
        const scrollLeft = buttons[this.currentIndex].offsetLeft - container.clientWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  getQuestionButtonClass(question: Question, index: number): string {
    const baseClasses = `
      w-1400 h-10 rounded-full font-medium transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      flex items-center justify-center shadow-sm
      transform hover:scale-105
    `;
    
    if (index === this.currentIndex) {
      return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 ring-2 ring-blue-300`;
    }
    if (question.isAnswered && !question.isIncorrect) {
      return `${baseClasses} bg-green-500 text-white hover:bg-green-600 focus:ring-green-500`;
    }
    if (question.isAnswered && question.isIncorrect) {
      return `${baseClasses} bg-red-500 text-white hover:bg-red-600 focus:ring-red-500`;
    }
    if (question.isSkipped) {
      return `${baseClasses} bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500`;
    }
    return `${baseClasses} bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500`;
  }

  onQuestionSelect(index: number): void {
    this.questionSelected.emit(index);
    if (!this.isExpanded) {
      this.scrollToCurrentQuestion();
    }
  }
}