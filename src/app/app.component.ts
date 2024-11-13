import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ExamComponent } from './components/exam/exam.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ExamComponent
  ],
  template: `
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'netsuite-cert-prep';
}