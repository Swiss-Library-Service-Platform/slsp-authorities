/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable, inject, signal } from '@angular/core';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { catchError, EMPTY, finalize, Observable } from 'rxjs';
import { SelectedBibFieldService } from '../../../services/selected-bib-field.service';
import { FormValues, SearchMode, SearchMode902 } from '../../../models/search-form.model';
import { BibRecordField, DataField } from '../../../models/bib-record.model';
import { NzBibRecordService } from '../../../services/nz-bib-record.service';
import { EditingFieldBackupService } from '../../../services/editing-field-backup.service';
import { LoadingIndicatorService } from '../../../services/loading-indicator.service';
import { TranslateService } from '@ngx-translate/core';
import { StringUtils } from '../../../utils/string-utils';
import { AuthorityDetailsService } from '../../entity-detail/idref-entry-details/authority-details.service';
import { IdrefSearchService } from '../../../services/idref-search.service';

@Injectable({
  providedIn: 'root'
})
export class BibRecordFieldModifierService {
  public searchMode = signal<SearchMode>(SearchMode.AddField);
  public searchMode902 = signal<SearchMode902>(SearchMode902.Add902);

  private idrefSearchService = inject(IdrefSearchService);
  private authorityDetailsService = inject(AuthorityDetailsService);
  private selectedBibFieldService = inject(SelectedBibFieldService);
  private nzBibRecordService = inject(NzBibRecordService);
  private translate = inject(TranslateService);
  private alert = inject(AlertService);
  private editingFieldBackup = inject(EditingFieldBackupService);
  private loader = inject(LoadingIndicatorService);
  public isTo902FormVisible = signal(false);
  public formResetNonce = signal(0);
  public highlightedUpdatedField = signal<DataField | null>(null);

  /**
   * Parse a flattened subfields string into structured code-value pairs
   * e.g. "$$a value $$b other" => [{code: 'a', value: 'value'}, {code: 'b', value: 'other'}]
   */
  public parseFlattenedArray(flattened: string): { code: string; value: string }[] {
    const result: { code: string; value: string }[] = [];
    let currentCode: string | null = null;
    let currentValueParts: string[] = [];
    const tokens = flattened.trim().split(/\s+/).filter(Boolean);

    for (const item of tokens) {
      if (item.startsWith('$$')) {
        if (currentCode) {
          result.push({
            code: currentCode,
            value: currentValueParts.join(' '),
          });
        }
        currentCode = item.replace('$$', '');
        currentValueParts = [];
      } else {
        currentValueParts.push(item);
      }
    }

    if (currentCode) {
      result.push({ code: currentCode, value: currentValueParts.join(' ') });
    }

    return result;
  }

  /**
  * Set the selected NZ entry in the idref service
   */
  public setSelectedFieldFromBibRecord(values: FormValues): void {
    let subfields = values.subfields;

    if (!subfields.includes('$$')) {
      subfields = '$$a ' + subfields;
    }

    this.selectedBibFieldService.selectedFieldFromBibRecord.set({
      change: '',
      tag: values.tag,
      ind1: values.ind1,
      ind2: values.ind2,
      subfields: this.parseFlattenedArray(subfields),
    });
  }

  /**
   * Crée un champ uniquement s'il n'existe pas.
   */
  public createFieldIfNotFound(formValues: FormValues, onSuccess?: () => void): void {
    const validation = this.formValuesAreValid(formValues);

    if (!validation.isValid) {
      return;
    }

    this.showValidationWarning(validation.warningKey);

    const formattedValues = this.buildDataField(formValues);

    this.loader.show();

    this.nzBibRecordService
      .createFieldIfNotExists(formattedValues)
      .pipe(
        finalize(() => this.loader.hide()),
        catchError(() => this.handleRefreshWarning())
      )
      .subscribe({
        next: () => {
          this.handleMutationSuccess(formattedValues, onSuccess);
        },
      });
  }

  /**
   * Met à jour un champ uniquement s'il existe.
   */
  public updateFieldIfFound(formValues: FormValues, onSuccess?: () => void): void {
    const reference = this.editingFieldBackup.getSavedCurrentEntry();

    if (!reference) {
      this.alert.error(this.translate.instant('search.noSelectedEntry'), { delay: 1000, autoClose: true });

      return;
    }

    const validation = this.formValuesAreValid(formValues);

    if (!validation.isValid) {
      return;
    }

    this.showValidationWarning(validation.warningKey);

    if (!this.isUpdateAllowed(reference)) {
      this.alert.warn(this.translate.instant('search.updateNotAllowed'), { delay: 1000, autoClose: true });

      return;
    }

    const formattedValues = this.buildDataField(formValues);

    this.loader.show();

    this.nzBibRecordService
      .updateFieldIfExists(reference, formattedValues)
      .pipe(
        finalize(() => this.loader.hide()),
        catchError(() => this.handleRefreshWarning())
      )
      .subscribe({
        next: () => {
          this.handleMutationSuccess(formattedValues, onSuccess);
        },
      });
  }

  /**
   * Ajoute ou met à jour un enregistrement.
   * Tente d'abord une mise à jour ; si le champ n'existe pas, le crée.
   */
  public addRecord(formValues: FormValues, onSuccess?: () => void): void {
    const reference = this.editingFieldBackup.getSavedCurrentEntry();

    if (!reference) {
      this.alert.error(this.translate.instant('search.noSelectedEntry'), { delay: 1000, autoClose: true });

      return;
    }

    const validation = this.formValuesAreValid(formValues);

    if (!validation.isValid) {
      return;
    }

    this.showValidationWarning(validation.warningKey);

    const formattedValues = this.buildDataField(formValues);

    this.loader.show();

    this.nzBibRecordService
      .updateFieldIfExists(reference, formattedValues)
      .pipe(
        catchError((err) => {
          if (err?.message === 'FIELD_NOT_FOUND') {
            return this.nzBibRecordService.createFieldIfNotExists(formattedValues).pipe(
              catchError(() => this.handleRefreshWarning()),
            );
          }

          return this.handleRefreshWarning();
        }),
        finalize(() => this.loader.hide()),
      )
      .subscribe({
        next: () => {
          this.handleMutationSuccess(formattedValues, onSuccess);
        },
      });
  }

  public formValuesAreValid(formValues: FormValues): { isValid: boolean; warningKey?: string } {
    const tag = formValues.tag?.trim() ?? '';
    const normalizedSubfields = formValues.subfields.includes('$$') ? formValues.subfields : `$$a ${formValues.subfields}`;

    if (!this.isTagValid(tag)) {
      return { isValid: false };
    }

    const hasIdrefInSubfield2 = this.hasIdrefInSubfield2(normalizedSubfields);
    const hasAnySubfield0 = this.hasAnySubfield0(normalizedSubfields);
    const hasIdrefInSubfield0 = this.hasIdrefInSubfield0(normalizedSubfields);

    if (!hasAnySubfield0) {
      return {
        isValid: true,
        warningKey: 'search.form.warning.missingIdrefIdentifier',
      };
    }

    if (tag.match(/^6/) && !hasIdrefInSubfield2) {
      if (hasIdrefInSubfield0) {
        this.alert.error(this.translate.instant('search.form.error.no$$2With$$0In6xx'), {
          delay: 3000,
        });

        return { isValid: false };
      }

      return {
        isValid: true,
        warningKey: 'search.form.warning.missingIdrefIdentifier',
      };
    }

    return { isValid: true };
  }

  private isTagValid(tag: string): boolean {
    if (tag && tag.trim() !== '') {
      return true;
    } else {
      this.alert.error(this.translate.instant('search.form.error.emptyTag'), { delay: 3000 });

      return false;
    }
  }

  private hasAnySubfield0(subfields: string): boolean {
    return subfields.includes('$$0');
  }

  private hasIdrefInSubfield2(subfields: string): boolean {
    return /\$\$2\s+idref\b/i.test(subfields);
  }

  private hasIdrefInSubfield0(subfields: string): boolean {
    return /\$\$0\s+\(IDREF\)/i.test(subfields);
  }

  /**
   * Bascule vers le mode Add902.
   */
  public showTo902(): void {
    this.isTo902FormVisible.set(true);
  }

  public closeTo902(): void {
    this.searchMode902.set(SearchMode902.Add902);
    this.isTo902FormVisible.set(false);
  }

  /**
   * Réinitialise la recherche et le formulaire.
   */
  public clear(resetFormCallback?: () => void): void {
    this.isTo902FormVisible.set(false);
    this.searchMode.set(SearchMode.AddField);
    this.selectedBibFieldService.selectedFieldFromBibRecord.set(undefined);
    this.highlightedUpdatedField.set(null);

    if (resetFormCallback) {
      resetFormCallback();
    }
    this.alert.info(this.translate.instant('search.clear'), { delay: 1000, autoClose: true });
  }

  /**
   * Réinitialise l'état de la recherche.
   */
  public reset(): void {
    this.isTo902FormVisible.set(false);
    this.searchMode902.set(SearchMode902.Add902);
    this.searchMode.set(SearchMode.AddField);
    this.selectedBibFieldService.reset();
    this.idrefSearchService.reset();
    this.authorityDetailsService.reset();
  }

  private buildDataField(formValues: FormValues): DataField {
    const normalizedSubfields = formValues.subfields.includes('$$')
      ? formValues.subfields
      : `$$a ${formValues.subfields}`;

    return {
      tag: formValues.tag,
      ind1: formValues.ind1,
      ind2: formValues.ind2,
      subfields: StringUtils.parseSubfieldsString(normalizedSubfields),
    };
  }

  public requestFormsReset(): void {
    this.formResetNonce.update((value) => value + 1);
  }

  private showValidationWarning(warningKey?: string): void {
    if (!warningKey) {
      return;
    }
  }

  private handleRefreshWarning(): Observable<never> {
    /*this.alert.warn(this.translate.instant('search.acceptRefreshModal'), {
      delay: 1000,
    });*/

    return EMPTY;
  }

  private handleMutationSuccess(formattedValues: DataField, onSuccess?: () => void): void {
    this.highlightedUpdatedField.set(formattedValues);
    this.reset();
    onSuccess?.();
    this.refreshSelectedEntityDetails();
    this.alert.success(this.translate.instant('search.recordAdded'), { delay: 1000 });
  }

  private refreshSelectedEntityDetails(): void {
    this.nzBibRecordService
      .refreshSelectedEntityDetails$()
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  private isUpdateAllowed(bibRecordField: BibRecordField): boolean {
    const subfieldZeroValues = bibRecordField.subfields
      .filter((subfield) => subfield.code === '0')
      .map((subfield) => {
        const match = subfield.value.match(/\(([^)]*)\)/);

        return match ? match[1].trim() : null;
      })
      .filter((value) => value !== null) as string[];

    if (subfieldZeroValues.length === 0) {
      return true;
    }

    return subfieldZeroValues.every((value) => value === 'IDREF' || value === 'RERO');
  }
}
