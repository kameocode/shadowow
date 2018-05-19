import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeDetailsComponent } from './shape-details.component';

describe('ShapeDetailsComponent', () => {
  let component: ShapeDetailsComponent;
  let fixture: ComponentFixture<ShapeDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShapeDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
