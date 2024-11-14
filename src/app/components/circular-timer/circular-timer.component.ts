import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-circular-timer',
  standalone: true,
  template: `
    <div class="relative inline-flex items-center justify-center">
      <svg height="80" width="80">
        <circle
          stroke="#e2e8f0"
          fill="transparent"
          stroke-width="6"
          r="34"
          cx="40"
          cy="40"
        ></circle>
        <circle
          stroke="#3b82f6"
          fill="transparent"
          stroke-width="6"
          [attr.stroke-dasharray]="circumference + ' ' + circumference"
          [attr.stroke-dashoffset]="strokeDashoffset"
          style="transform: rotate(-90deg); transform-origin: 50% 50%"
          r="34"
          cx="40"
          cy="40"
        ></circle>
      </svg>
      <div class="absolute text-lg font-bold text-gray-700">
        {{ timeDisplay }}
      </div>
    </div>
  `,
})
export class CircularTimerComponent {
  @Input() remainingTime: number = 0;

  get circumference(): number {
    return 2 * Math.PI * 34;
  }

  get strokeDashoffset(): number {
    return this.circumference - (this.remainingTime / 3600) * this.circumference;
  }

  get timeDisplay(): string {
    const minutes = Math.floor(this.remainingTime / 60);
    const seconds = this.remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}