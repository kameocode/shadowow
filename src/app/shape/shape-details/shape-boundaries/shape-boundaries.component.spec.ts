import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeBoundariesComponent } from './shape-boundaries.component';

describe('ShapeBoundariesComponent', () => {
  let component: ShapeBoundariesComponent;
  let fixture: ComponentFixture<ShapeBoundariesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShapeBoundariesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeBoundariesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
