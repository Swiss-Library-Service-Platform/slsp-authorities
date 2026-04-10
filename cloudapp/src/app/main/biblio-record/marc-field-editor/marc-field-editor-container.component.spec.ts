import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcFieldEditorContainerComponent } from './marc-field-editor-container.component';

describe('MarcFieldEditorContainerComponent', () => {
  let component: MarcFieldEditorContainerComponent;
  let fixture: ComponentFixture<MarcFieldEditorContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarcFieldEditorContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarcFieldEditorContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
