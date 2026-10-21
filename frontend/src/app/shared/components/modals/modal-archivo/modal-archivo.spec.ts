import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalArchivo } from './modal-archivo';

describe('ModalArchivo', () => {
  let component: ModalArchivo;
  let fixture: ComponentFixture<ModalArchivo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalArchivo],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalArchivo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
