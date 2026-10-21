import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivoCardComponent } from './archivo-card.component';

describe('ArchivoCardComponent', () => {
  let component: ArchivoCardComponent;
  let fixture: ComponentFixture<ArchivoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivoCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ArchivoCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
