import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalMover } from './modal-mover';

describe('ModalMover', () => {
  let component: ModalMover;
  let fixture: ComponentFixture<ModalMover>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalMover],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalMover);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
