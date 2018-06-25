import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DayInfoComponent } from './day-info.component';

describe('DayInfoComponent', () => {
  let component: DayInfoComponent;
  let fixture: ComponentFixture<DayInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DayInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DayInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
