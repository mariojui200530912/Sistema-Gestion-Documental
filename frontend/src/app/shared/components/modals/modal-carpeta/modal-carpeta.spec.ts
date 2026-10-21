import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCarpeta } from './modal-carpeta';

describe('ModalCarpeta', () => {
  let component: ModalCarpeta;
  let fixture: ComponentFixture<ModalCarpeta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCarpeta],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalCarpeta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
