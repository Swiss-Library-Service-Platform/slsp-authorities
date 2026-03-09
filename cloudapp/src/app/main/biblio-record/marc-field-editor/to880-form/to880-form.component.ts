/* eslint-disable @typescript-eslint/member-ordering */
import { Component, computed, effect, inject, input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { catchError, EMPTY, finalize, switchMap } from 'rxjs';
import { DataField, NzBibRecord } from '../../../../models/bib-record.model';
import { EditingFieldBackupService } from '../../../../services/editing-field-backup.service';
import { LoadingIndicatorService } from '../../../../services/loading-indicator.service';
import { NzBibRecordService } from '../../../../services/nz-bib-record.service';
import { SelectedBibFieldService } from '../../../../services/selected-bib-field.service';
import { SelectedEntityStateService } from '../../../../services/selected-entity-state.service';
import { StringUtils } from '../../../../utils/string-utils';
import { SubfieldSixLinkUtils } from '../../../../utils/subfield-six-link-utils';
import { BibRecordFieldModifierService } from '../bib-record-field-modifier.service';

@Component({
  selector: 'app-to880-form',
  templateUrl: './to880-form.component.html',
  styleUrl: './to880-form.component.scss',
})
export class To880FormComponent {
  public entity = input.required<NzBibRecord | undefined>();
  public searchForm: FormGroup;

  private bibRecordFieldModifierService = inject(BibRecordFieldModifierService);
  private selectedBibFieldService = inject(SelectedBibFieldService);
  private selectedEntityState = inject(SelectedEntityStateService);
  private editingFieldBackup = inject(EditingFieldBackupService);
  private nzBibRecordService = inject(NzBibRecordService);
  private loader = inject(LoadingIndicatorService);
  private translate = inject(TranslateService);
  private alert = inject(AlertService);
  private fb = inject(FormBuilder);

  public readonly selectedFieldFromBibRecord = this.selectedBibFieldService.selectedFieldFromBibRecord;
  public readonly flattenedValue = this.selectedBibFieldService.flattenedValue;

  public linkNumber = computed(() => {
    const backup = this.editingFieldBackup.getSavedCurrentEntry();

    if (backup) {
      const existingLinkNum = SubfieldSixLinkUtils.getExistingLinkNumber(backup);

      if (existingLinkNum !== null) {
        return existingLinkNum;
      }
    }

    const entityDetails = this.selectedEntityState.selectedEntityDetails();

    if (!entityDetails?.anies?.[0]) {
      return 1;
    }

    const marcRecord = StringUtils.xmlToMarcRecord(entityDetails.anies[0]);

    return SubfieldSixLinkUtils.getHighestLinkNumber(marcRecord.dataFields) + 1;
  });

  public isReusedLink = computed(() => {
    const backup = this.editingFieldBackup.getSavedCurrentEntry();

    return backup !== undefined && SubfieldSixLinkUtils.hasSubfield6(backup);
  });

  public originalSubfield6Value = computed(() =>
    SubfieldSixLinkUtils.buildOriginalSubfield6(this.linkNumber())
  );

  public subfield6Value = computed(() => {
    const entry = this.selectedFieldFromBibRecord();

    if (!entry) {
      return '';
    }

    return SubfieldSixLinkUtils.buildField880Subfield6(entry.tag, this.linkNumber());
  });

  public constructor() {
    this.searchForm = this.fb.group({
      tag: [{ value: '880', disabled: true }],
      ind1: [{ value: ' ', disabled: true }],
      ind2: [{ value: ' ', disabled: true }],
      subfield6: [{ value: '', disabled: true }],
      subfields: [''],
    });

    effect(() => {
      const entry = this.selectedFieldFromBibRecord();

      if (entry) {
        this.searchForm.patchValue(
          {
            ind1: entry.ind1,
            ind2: entry.ind2,
            subfield6: this.subfield6Value(),
            subfields: this.flattenedValue(),
          },
          { emitEvent: false }
        );
      }
    });
  }

  public createField880(): void {
    const originalFieldRef = this.editingFieldBackup.getSavedCurrentEntry();

    if (!originalFieldRef) {
      this.alert.error(this.translate.instant('search.noSelectedEntry'), {
        delay: 1000,
        autoClose: true,
      });

      return;
    }

    const rawValue = this.searchForm.getRawValue();
    const subfieldsStr: string = rawValue.subfields ?? '';
    const normalizedSubfields = subfieldsStr.includes('$$') ? subfieldsStr : `$$a ${subfieldsStr}`;
    const parsedSubfields = StringUtils.parseSubfieldsString(normalizedSubfields);
    const linkNum = this.linkNumber();
    const alreadyLinked = SubfieldSixLinkUtils.hasSubfield6(originalFieldRef);
    const field880: DataField = {
      tag: '880',
      ind1: rawValue.ind1,
      ind2: rawValue.ind2,
      subfields: [{ code: '6', value: rawValue.subfield6 }, ...parsedSubfields],
    };

    this.loader.show();

    const createObs = alreadyLinked
      ? this.nzBibRecordService.createFieldIfNotExists(field880)
      : this.nzBibRecordService.createFieldWithLinkedModification(
          originalFieldRef,
          {
            tag: originalFieldRef.tag,
            ind1: originalFieldRef.ind1,
            ind2: originalFieldRef.ind2,
            subfields: SubfieldSixLinkUtils.prependSubfield6(
              originalFieldRef.subfields,
              SubfieldSixLinkUtils.buildOriginalSubfield6(linkNum)
            ),
          },
          field880
        );

    createObs
      .pipe(
        switchMap(() => this.nzBibRecordService.refreshSelectedEntityDetails$()),
        catchError(() => {
          this.alert.error(this.translate.instant('error.eventServiceError'), { autoClose: false });

          return EMPTY;
        }),
        finalize(() => this.loader.hide())
      )
      .subscribe(() => {
        if (alreadyLinked) {
          this.bibRecordFieldModifierService.highlightedUpdatedField.set([
            { field: field880, mode: 'full' },
          ]);
        } else {
          const originalFieldUpdated: DataField = {
            tag: originalFieldRef.tag,
            ind1: originalFieldRef.ind1,
            ind2: originalFieldRef.ind2,
            subfields: SubfieldSixLinkUtils.prependSubfield6(
              originalFieldRef.subfields,
              SubfieldSixLinkUtils.buildOriginalSubfield6(linkNum)
            ),
          };

          this.bibRecordFieldModifierService.highlightedUpdatedField.set([
            { field: field880, mode: 'full' },
            { field: originalFieldUpdated, mode: 'subfield-only', subfieldCodes: ['6'] },
          ]);
        }

        this.bibRecordFieldModifierService.reset();
        this.bibRecordFieldModifierService.requestFormsReset();
        this.alert.success(this.translate.instant('search.recordAdded'), { delay: 1000 });
      });
  }

  public closeTo880(): void {
    this.bibRecordFieldModifierService.closeTo880();
  }
}
