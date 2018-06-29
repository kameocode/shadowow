import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SolarInfoColumnComponent } from './solar-info-column.component';

describe('SolarInfoColumnComponent', () => {
  let component: SolarInfoColumnComponent;
  let fixture: ComponentFixture<SolarInfoColumnComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SolarInfoColumnComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SolarInfoColumnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
