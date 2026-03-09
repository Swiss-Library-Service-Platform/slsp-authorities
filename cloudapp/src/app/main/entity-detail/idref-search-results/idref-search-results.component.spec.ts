import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdrefSearchResultsComponent } from './idref-search-results.component';

describe('IdrefSearchResultsComponent', () => {
  let component: IdrefSearchResultsComponent;
  let fixture: ComponentFixture<IdrefSearchResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdrefSearchResultsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdrefSearchResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
