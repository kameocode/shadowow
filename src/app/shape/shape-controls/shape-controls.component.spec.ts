import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeControlsComponent } from './shape-controls.component';

describe('ShapeControlsComponent', () => {
  let component: ShapeControlsComponent;
  let fixture: ComponentFixture<ShapeControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShapeControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
