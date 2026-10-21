import { TestBed } from '@angular/core/testing';

import { ComparticionService } from './comparticion.service';

describe('ComparticionService', () => {
  let service: ComparticionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComparticionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
