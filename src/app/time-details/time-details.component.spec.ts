import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeDetailsComponent } from './time-details.component';

describe('HoursSliderComponent', () => {
  let component: TimeDetailsComponent;
  let fixture: ComponentFixture<TimeDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimeDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
