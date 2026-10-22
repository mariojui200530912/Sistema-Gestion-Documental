import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExploradorArchivosComponent } from './explorador-archivos.component';

describe('ExploradorArchivosComponent', () => {
  let component: ExploradorArchivosComponent;
  let fixture: ComponentFixture<ExploradorArchivosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploradorArchivosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExploradorArchivosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
