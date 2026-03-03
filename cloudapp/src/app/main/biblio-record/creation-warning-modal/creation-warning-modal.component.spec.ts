import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreationWarningModalComponent } from './creation-warning-modal.component';

describe('CreationWarningModalComponent', () => {
  let component: CreationWarningModalComponent;
  let fixture: ComponentFixture<CreationWarningModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreationWarningModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreationWarningModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
