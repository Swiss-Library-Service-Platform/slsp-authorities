/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable, inject, signal } from '@angular/core';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { catchError, EMPTY, finalize } from 'rxjs';
import { IdrefService } from '../../../services/idref.service';
import { FormValues, SearchMode, SearchMode902 } from './model';
import { BibRecordField, DataField } from '../../../models/bib-record.model';
import { NZQueryService } from '../../../services/nzquery.service';
import { BiblioReferencedEntryService } from '../../../services/biblio-referenced-entry.service';
import { LoadingIndicatorService } from '../../../services/loading-indicator.service';
import { TranslateService } from '@ngx-translate/core';
import { StringUtils } from '../../../utils/stringUtils';

@Injectable({
  providedIn: 'root'
})
export class SearchService {


  public searchMode = signal<SearchMode>(SearchMode.AddField);
  public searchMode902 = signal<SearchMode902>(SearchMode902.Add902);

  private idrefService = inject(IdrefService);
  private nzQueryService = inject(NZQueryService);
  private translate = inject(TranslateService);
  private alert = inject(AlertService);
  private referenceCurrentField = inject(BiblioReferencedEntryService);
  private loader = inject(LoadingIndicatorService);

  public nzSelectedEntry = this.idrefService.nzSelectedEntry;
  public flattenedValue = this.idrefService.flattenedValue;
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

    for (const item of flattened.split(' ')) {
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
  public setNzSelectedEntry(values: FormValues): void {
    let subfields = values.subfields;

    if (!subfields.includes('$$')) {
      subfields = '$$a ' + subfields;
    }

    this.nzSelectedEntry.set({
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
    this.loader.show();
    
    const formatedValues = this.buildDataField(formValues);

    if(!this.formValuesAreValid(formValues).isValid) {
      this.loader.hide();

      return;
    }

    this.nzQueryService
      .createFieldIfNotExists(formatedValues)
      .pipe(
        finalize(() => this.loader.hide()),
        catchError((_err) => {
          this.alert.warn(this.translate.instant('search.acceptRefreshModal'), {
            delay: 1000,
          });

          return EMPTY;
        })
      )
      .subscribe({
        next: () => {
          this.highlightedUpdatedField.set(formatedValues);
          this.reset();
          onSuccess?.();
          this.nzQueryService
            .refreshSelectedEntityDetails$()
            .pipe(catchError(() => EMPTY))
            .subscribe();
          this.alert.success(this.translate.instant('search.recordAdded'), { delay: 1000 });
        },
      });
  }

  /**
   * Met à jour un champ uniquement s'il existe.
   */
  public updateFieldIfFound(formValues: FormValues, onSuccess?: () => void): void {

    this.loader.show();

    const reference = this.referenceCurrentField.getSavedCurrentEntry();

    if (!reference) {
      this.alert.error(this.translate.instant('search.noSelectedEntry'), { delay: 1000, autoClose: true });
      this.loader.hide();

      return;
    }

    if(!this.formValuesAreValid(formValues).isValid) {
      this.loader.hide();

      console.warn('Form values are not valid, update cancelled.', formValues);

      return;
    }

    if (reference && !this.isUpdateAllowed(reference)) {
      this.alert.warn(this.translate.instant('search.updateNotAllowed'), { delay: 1000, autoClose: true });
      this.loader.hide();
      
      return;
    }

    const formatedValues = this.buildDataField(formValues);

    this.nzQueryService
      .updateFieldIfExists(reference, formatedValues)
      .pipe(
        finalize(() => this.loader.hide()),
        catchError((_err) => {
          this.alert.warn(this.translate.instant('search.acceptRefreshModal'), {
            delay: 1000,
          });

          return EMPTY;
        })
      )
      .subscribe({
        next: () => {
          this.highlightedUpdatedField.set(formatedValues);
          this.reset();
          onSuccess?.();
          this.nzQueryService
            .refreshSelectedEntityDetails$()
            .pipe(catchError(() => EMPTY))
            .subscribe();
          this.alert.success(this.translate.instant('search.recordAdded'), { delay: 1000 });
        },
      });
  }

  /**
   * Ajoute ou met à jour un enregistrement.
   * Tente d'abord une mise à jour ; si le champ n'existe pas, le crée.
   */
  public addRecord(formValues: FormValues, onSuccess?: () => void): void {
    this.loader.show();

    const reference = this.referenceCurrentField.getSavedCurrentEntry();

    if (!reference) {
      this.alert.error(this.translate.instant('search.noSelectedEntry'), { delay: 1000, autoClose: true });
      this.loader.hide();

      return;
    }

    if(!this.formValuesAreValid(formValues).isValid) {
      this.loader.hide();

      return;
    }

    const formatedValues = this.buildDataField(formValues);

    // Premièrement, tenter de mettre à jour si le champ existe.
    // Si le champ n'est pas trouvé, on tente de le créer.
    this.nzQueryService
      .updateFieldIfExists(reference, formatedValues)
      .pipe(
        finalize(() => this.loader.hide()),
        catchError((err) => {
          if (err?.message === 'FIELD_NOT_FOUND') {
            // Champ non trouvé -> créer
            return this.nzQueryService.createFieldIfNotExists( formatedValues).pipe(
              catchError((_err2) => {
                this.alert.warn(this.translate.instant('search.acceptRefreshModal'), { delay: 1000 });

                return EMPTY;
              }),
            );
          }

          this.alert.warn(this.translate.instant('search.acceptRefreshModal'), {
            delay: 1000,
          });

          return EMPTY;
        })
      )
      .subscribe({
        next: () => {
          this.highlightedUpdatedField.set(formatedValues);
          this.reset();
          onSuccess?.();
          this.nzQueryService
            .refreshSelectedEntityDetails$()
            .pipe(catchError(() => EMPTY))
            .subscribe();
          this.alert.success(this.translate.instant('search.recordAdded'), { delay: 1000 });
        },
      });
  }

  public formValuesAreValid(formValues: FormValues): { isValid: boolean; warningKey?: string } {
    const tag = formValues.tag?.trim() ?? '';
    const normalizedSubfields = formValues.subfields.includes('$$') ? formValues.subfields: `$$a ${formValues.subfields}`;

    // No tag is available
    if (!this.isTagValide(tag)) {
      return { isValid: false };
    }

    const hasIdrefInSubfield2 = this.hasIdrefInSubfield2(normalizedSubfields);
    const hasAnySubfield0 = this.hasAnySubfield0(normalizedSubfields);
    const hasIdrefInSubfield0 = this.hasIdrefInSubfield0(normalizedSubfields);

    if(!hasAnySubfield0){
      return {
        isValid: true,
        warningKey: 'search.form.warning.missingIdrefIdentifier',
      };
    }

    if(tag.match(/^6/) && !hasIdrefInSubfield2){
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

  private isTagValide(tag: string): boolean {

    if(tag && tag.trim() !== '') {
      return true;
    }else {
      this.alert.error(this.translate.instant('search.form.error.emptyTag'), {delay: 3000,});

      return false;
    }
  }

  private hasAnySubfield0(subfields: string): boolean {
    return subfields.includes('$$0');
  }

  private hasIdrefInSubfield2(subfields: string): boolean {
    return subfields.includes('$$2 idref');
  }

  private hasIdrefInSubfield0(subfields: string): boolean {
    return subfields.includes('$$0 (IDREF)');
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
    this.nzSelectedEntry.set(undefined);
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
    this.idrefService.reset();
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

  private isUpdateAllowed(bibRecordField: BibRecordField): boolean {
    // Extract subfield code '0' and get values between parentheses
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
