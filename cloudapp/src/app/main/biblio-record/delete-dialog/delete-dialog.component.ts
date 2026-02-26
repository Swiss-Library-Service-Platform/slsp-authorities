import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { BibRecordField } from '../../../models/bib-record.model';
import { NZQueryService } from '../../../services/nzquery.service';
import { LoadingIndicatorService } from '../../../services/loading-indicator.service';
import { EMPTY, catchError, finalize, switchMap } from 'rxjs';
import { SearchService } from '../search/search.service';


@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrl: './delete-dialog.component.scss'
})
export class DeleteDialogComponent {
  public isDeleting = false;
  
  
  public dialogRef= inject(MatDialogRef<DeleteDialogComponent>);
  private nzQueryService = inject(NZQueryService);
  private searchService = inject(SearchService);
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
        switchMap(() => this.nzQueryService.refreshSelectedEntityDetails$()),
        catchError(() => {
          this.alert.error(this.translate.instant('error.eventServiceError'), { autoClose: false });

          return EMPTY;
        }),
        finalize(() => {
          this.loader.hide();
          this.isDeleting = false;
        })
      )
      .subscribe(() => {
        this.searchService.reset();
        this.searchService.requestFormsReset();
        this.alert.info(this.translate.instant('proxyService.deleteSuccess'));
      });
  }
}
