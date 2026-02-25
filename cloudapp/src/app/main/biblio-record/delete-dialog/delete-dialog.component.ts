import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CloudAppEventsService, AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { BibRecordField } from '../../../models/bib-record.model';
import { NZQueryService } from '../../../services/nzquery.service';
import { RecordService } from '../../../services/record.service';
import { LoadingIndicatorService } from '../../../services/loading-indicator.service';
import { EMPTY, catchError, finalize, switchMap } from 'rxjs';


@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrl: './delete-dialog.component.scss'
})
export class DeleteDialogComponent {
  public isDeleting = false;
  
  
  public dialogRef= inject(MatDialogRef<DeleteDialogComponent>);
  private nzQueryService = inject(NZQueryService);
  private eventsService = inject(CloudAppEventsService);
  private recordService = inject(RecordService);
  private alert = inject(AlertService);
  private translate = inject(TranslateService);
  private loader = inject(LoadingIndicatorService);
  
  // eslint-disable-next-line @angular-eslint/prefer-inject
  public constructor(@Inject(MAT_DIALOG_DATA) public data: {entry: BibRecordField}) {}

  public onNoClick(): void {
    if (this.isDeleting) {
      return;
    }

    this.dialogRef.close();
  }

  public onDelete(): void {
    if (this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.dialogRef.disableClose = true;
    this.dialogRef.close();
    this.loader.show();
    this.nzQueryService
      .deleteBibRecord(this.data.entry)
      .pipe(
        switchMap(() => this.eventsService.refreshPage()),
        catchError(() => {
          this.alert.error(this.translate.instant('error.restApiError'), { autoClose: false });

          return EMPTY;
        }),
        finalize(() => {
          this.loader.hide();
          this.isDeleting = false;
        })
      )
      .subscribe(() => {
        this.recordService.resetSelectedEntity();
        this.alert.info(this.translate.instant('proxyService.deleteSuccess'));
      });
  }
}
