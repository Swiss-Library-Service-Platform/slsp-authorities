import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { xmlEntry } from '../models/bib-records';
import { NZQueryService } from '../services/nzquery.service';


@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrl: './delete-dialog.component.scss'
})
export class DeleteDialogComponent {
  
  
  public dialogRef= inject(MatDialogRef<DeleteDialogComponent>);
  private nzQueryService = inject(NZQueryService);
  
  // eslint-disable-next-line @angular-eslint/prefer-inject
  public constructor(@Inject(MAT_DIALOG_DATA) public data: {entry: xmlEntry}) {}

  public onNoClick(): void {
    console.log(this.data)
    this.dialogRef.close();
  }

  public onDelete(): void {
    this.nzQueryService.deleteBibRecord(this.data.entry).subscribe()
    this.dialogRef.close();
  }
}
