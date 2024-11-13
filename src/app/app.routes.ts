import { Routes } from '@angular/router';
import { ExamComponent } from './components/exam/exam.component';

export const routes: Routes = [
    { path: '**', component: ExamComponent },  
    { path: '', component: ExamComponent },  
];
