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
    isSkipped?: boolean;
    isAnswered?: boolean;
    isIncorrect?: boolean;
  }
  
  export interface ExamConfig {
    randomize: any;
    showAnswersImmediately: boolean;
    timeLimit: number; // in minutes
    passingScore: number;
    examSet: string;
    subsetType: 'full' | 'range' | 'random';
    questionRange?: {
      start: number;
      end: number;
    };
    subsetSize?: number;
    randomCount?: number;
  }

  export interface ExamSet {
    set: string;
    totalQuestions: number;
    subsetSize: number;
  }