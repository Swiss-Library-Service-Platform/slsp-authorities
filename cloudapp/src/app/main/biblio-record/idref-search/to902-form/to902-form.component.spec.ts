import { ComponentFixture, TestBed } from '@angular/core/testing';

import { To902FormComponent } from './to902-form.component';

describe('To902FormComponent', () => {
  let component: To902FormComponent;
  let fixture: ComponentFixture<To902FormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [To902FormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(To902FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
