import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalRenombrar } from './modal-renombrar';

describe('ModalRenombrar', () => {
  let component: ModalRenombrar;
  let fixture: ComponentFixture<ModalRenombrar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalRenombrar],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalRenombrar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
