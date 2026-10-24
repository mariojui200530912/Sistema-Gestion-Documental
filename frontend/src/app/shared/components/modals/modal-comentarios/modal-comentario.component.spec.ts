import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalComentarioComponent } from './modal-comentario.component';

describe('ModalComentarioComponent', () => {
  let component: ModalComentarioComponent;
  let fixture: ComponentFixture<ModalComentarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComentarioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComentarioComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
