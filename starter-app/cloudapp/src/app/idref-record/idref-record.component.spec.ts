import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdrefRecordComponent } from './idref-record.component';

describe('IdrefRecordComponent', () => {
  let component: IdrefRecordComponent;
  let fixture: ComponentFixture<IdrefRecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdrefRecordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdrefRecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
