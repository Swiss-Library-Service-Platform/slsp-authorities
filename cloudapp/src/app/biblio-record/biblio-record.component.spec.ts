import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BiblioRecordComponent } from './biblio-record.component';

describe('BiblioRecordComponent', () => {
  let component: BiblioRecordComponent;
  let fixture: ComponentFixture<BiblioRecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BiblioRecordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BiblioRecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
