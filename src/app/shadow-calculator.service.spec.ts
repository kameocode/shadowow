import { TestBed, inject } from '@angular/core/testing';

import { ShadowCalculatorService } from './shadow-calculator.service';

describe('ShadowCalculatorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShadowCalculatorService]
    });
  });

  it('should be created', inject([ShadowCalculatorService], (service: ShadowCalculatorService) => {
    expect(service).toBeTruthy();
  }));
});
