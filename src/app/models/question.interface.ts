export interface Answer {
    id: number;
    text: string;
    isCorrect: boolean;
  }
  
  export interface Question {
    id: number;
    text: string;
    type: 'single' | 'multiple';
    answers: Answer[];
    explanation?: string;
  }
  
  export interface ExamConfig {
    showAnswersImmediately: boolean;
    timeLimit: number; // in minutes
    passingScore: number;
  }