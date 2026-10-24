import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialActividadComponent } from './historial-actividad.component';

describe('HistorialActividadComponent', () => {
  let component: HistorialActividadComponent;
  let fixture: ComponentFixture<HistorialActividadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialActividadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HistorialActividadComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
