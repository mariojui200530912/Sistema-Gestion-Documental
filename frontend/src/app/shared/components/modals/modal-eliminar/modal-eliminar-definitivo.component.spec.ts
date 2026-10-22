import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEliminarDefinitivoComponent } from './modal-eliminar-definitivo.component';

describe('ModalEliminarDefinitivoComponent', () => {
  let component: ModalEliminarDefinitivoComponent;
  let fixture: ComponentFixture<ModalEliminarDefinitivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalEliminarDefinitivoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEliminarDefinitivoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
