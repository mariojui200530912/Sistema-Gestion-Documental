import { TestBed } from '@angular/core/testing';

import { PapeleraService } from './papelera.service';

describe('PapeleraService', () => {
  let service: PapeleraService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PapeleraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
