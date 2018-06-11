import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HoursSliderComponent } from './time-details.component';

describe('HoursSliderComponent', () => {
  let component: HoursSliderComponent;
  let fixture: ComponentFixture<HoursSliderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HoursSliderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HoursSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
