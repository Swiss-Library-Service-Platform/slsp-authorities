import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdrefSearchComponent } from './idref-search.component';

describe('IdrefSearchComponent', () => {
  let component: IdrefSearchComponent;
  let fixture: ComponentFixture<IdrefSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdrefSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdrefSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
