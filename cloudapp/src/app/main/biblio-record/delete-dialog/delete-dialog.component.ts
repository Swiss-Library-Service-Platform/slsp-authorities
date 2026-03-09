import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { BibRecordField, DataField, NzBibRecord } from '../../../models/bib-record.model';
import { LoadingIndicatorService } from '../../../services/loading-indicator.service';
import { EMPTY, Observable, catchError, finalize, switchMap } from 'rxjs';
import { BibRecordFieldModifierService } from '../marc-field-editor/bib-record-field-modifier.service';
import { NzBibRecordService } from '../../../services/nz-bib-record.service';
import { SubfieldSixLinkUtils } from '../../../utils/subfield-six-link-utils';

export interface DeleteDialogData {
  bibRecordField: BibRecordField;
  linked880Fields?: BibRecordField[];
  linkedOriginalField?: BibRecordField | null;
}

@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrl: './delete-dialog.component.scss'
})
export class DeleteDialogComponent {
  public isDeleting = false;


  public dialogRef = inject(MatDialogRef<DeleteDialogComponent>);
  private nzBibRecordService = inject(NzBibRecordService);
  private bibRecordFieldModifierService = inject(BibRecordFieldModifierService);
  private alert = inject(AlertService);
  private translate = inject(TranslateService);
  private loader = inject(LoadingIndicatorService);

  // eslint-disable-next-line @angular-eslint/prefer-inject
  public constructor(@Inject(MAT_DIALOG_DATA) public data: DeleteDialogData) {}

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

    const field = this.data.bibRecordField;
    let deleteObs: Observable<NzBibRecord>;

    if (field.tag === '880' && this.data.linkedOriginalField) {
      const sf6 = field.subfields.find((sf) => sf.code === '6');
      const parsed = sf6 ? SubfieldSixLinkUtils.parseSubfield6(sf6.value) : null;
      const originalReplacement: DataField = {
        tag: this.data.linkedOriginalField.tag,
        ind1: this.data.linkedOriginalField.ind1,
        ind2: this.data.linkedOriginalField.ind2,
        subfields: SubfieldSixLinkUtils.removeSubfield6(
          this.data.linkedOriginalField.subfields,
          parsed?.linkNumber
        ),
      };

      deleteObs = this.nzBibRecordService.deleteBibRecordWithCascade(
        [field],
        { original: this.data.linkedOriginalField, replacement: originalReplacement }
      );
    } else if (this.data.linked880Fields && this.data.linked880Fields.length > 0) {
      deleteObs = this.nzBibRecordService.deleteBibRecordWithCascade(
        [field, ...this.data.linked880Fields]
      );
    } else {
      deleteObs = this.nzBibRecordService.deleteBibRecord(field);
    }

    deleteObs
      .pipe(
        switchMap(() => this.nzBibRecordService.refreshSelectedEntityDetails$()),
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
        this.bibRecordFieldModifierService.reset();
        this.bibRecordFieldModifierService.requestFormsReset();
        this.alert.info(this.translate.instant('proxyService.deleteSuccess'));
      });
  }
}
