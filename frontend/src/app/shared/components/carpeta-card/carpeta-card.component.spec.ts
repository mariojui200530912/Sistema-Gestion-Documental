import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarpetaCardComponent } from './carpeta-card.component';

describe('CarpetaCardComponent', () => {
  let component: CarpetaCardComponent;
  let fixture: ComponentFixture<CarpetaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarpetaCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CarpetaCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
