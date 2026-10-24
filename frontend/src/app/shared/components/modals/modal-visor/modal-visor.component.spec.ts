import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalVisorComponent } from './modal-visor.component';

describe('ModalVisorComponent', () => {
  let component: ModalVisorComponent;
  let fixture: ComponentFixture<ModalVisorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalVisorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalVisorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
