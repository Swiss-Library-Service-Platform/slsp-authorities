import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdrefEntryDetailsComponent } from './idref-entry-details.component';

describe('IdrefEntryDetailsComponent', () => {
  let component: IdrefEntryDetailsComponent;
  let fixture: ComponentFixture<IdrefEntryDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdrefEntryDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdrefEntryDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
