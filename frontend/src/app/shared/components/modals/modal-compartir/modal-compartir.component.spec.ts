import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCompartirComponent } from './modal-compartir.component';

describe('ModalCompartirComponent', () => {
  let component: ModalCompartirComponent;
  let fixture: ComponentFixture<ModalCompartirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCompartirComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalCompartirComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
