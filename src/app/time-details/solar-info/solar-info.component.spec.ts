import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SolarInfoComponent } from './solar-info.component';

describe('SolarInfoComponent', () => {
  let component: SolarInfoComponent;
  let fixture: ComponentFixture<SolarInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SolarInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SolarInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
