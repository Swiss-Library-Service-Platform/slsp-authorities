import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcFieldFormComponent } from './marc-field-form.component';

describe('MarcFieldFormComponent', () => {
  let component: MarcFieldFormComponent;
  let fixture: ComponentFixture<MarcFieldFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarcFieldFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarcFieldFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
