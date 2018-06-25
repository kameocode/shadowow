import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapesLoaderDialogComponent } from './shapes-loader-dialog.component';

describe('ShapesLoaderDialogComponent', () => {
  let component: ShapesLoaderDialogComponent;
  let fixture: ComponentFixture<ShapesLoaderDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShapesLoaderDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapesLoaderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
