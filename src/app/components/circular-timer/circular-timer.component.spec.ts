import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircularTimerComponent } from './circular-timer.component';

describe('CircularTimerComponent', () => {
  let component: CircularTimerComponent;
  let fixture: ComponentFixture<CircularTimerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircularTimerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircularTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
