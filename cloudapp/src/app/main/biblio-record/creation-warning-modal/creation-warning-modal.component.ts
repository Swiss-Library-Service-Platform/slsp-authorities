import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-creation-warning-modal',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslateModule],
  templateUrl: './creation-warning-modal.component.html',
  styleUrl: './creation-warning-modal.component.scss'
})
export class CreationWarningModalComponent {
  public dialogRef = inject(MatDialogRef<CreationWarningModalComponent>);

  // eslint-disable-next-line @angular-eslint/prefer-inject
  public constructor(@Inject(MAT_DIALOG_DATA) public data: { warningKey: string }) {}

  public onCancel(): void {
    this.dialogRef.close(false);
  }

  public onConfirm(): void {
    this.dialogRef.close(true);
  }
}
