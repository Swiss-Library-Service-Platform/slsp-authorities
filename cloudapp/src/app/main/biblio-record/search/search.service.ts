/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable, inject, signal } from '@angular/core';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { catchError, EMPTY, finalize } from 'rxjs';
import { IdrefService } from '../../../services/idref.service';
import { FormValues, SearchMode, SearchMode902 } from './model';
import { BibRecordField, DataField } from '../../../models/bib-records';
import { NZQueryService } from '../../../services/nzquery.service';
import { BiblioReferencedEntryService } from '../../../services/biblio-referenced-entry.service';
import { LoadingIndicatorService } from '../../../services/loading-indicator.service';
import { TranslateService } from '@ngx-translate/core';
import { StringUtils } from '../../../utils/stringUtils';

@Injectable({
  providedIn: 'root'
})
export class searchService {


  public searchMode = signal<SearchMode>(SearchMode.AddField);
  public searchMode902 = signal<SearchMode902>(SearchMode902.Add902);

  private idrefService = inject(IdrefService);
  private nzQueryService = inject(NZQueryService);
  private translate = inject(TranslateService);
  private alert = inject(AlertService);
  private referenceCurrentField = inject(BiblioReferencedEntryService);
  private loader = inject(LoadingIndicatorService);

  public NZSelectedEntry = this.idrefService.NZSelectedEntry;
  public flattenedValue = this.idrefService.flattenedValue;
  public isTo902FormVisible = signal(false);


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
   * Set the NZSelectedEntry in the idref service
   */
  public setNZSelectedEntry(values: FormValues): void {
    let subfields = values.subfields;

    if (!subfields.includes('$$')) {
      subfields = '$$a ' + subfields;
    }

    this.NZSelectedEntry.set({
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
  public createFieldIfNotFound(formValues: FormValues): void {
    this.loader.show();
    
    const formatedValues = {
      ...formValues,
      subfields: StringUtils.parseSubfieldsString(formValues.subfields),
    } as DataField;

    this.nzQueryService
      .createFieldIfNotExists(formatedValues)
      .pipe(
        finalize(() => this.loader.hide()),
        catchError((err) => {
          this.alert.warn(this.translate.instant('search.acceptRefreshModal'), {
            delay: 1000,
          });
          console.error('Erreur createFieldIfNotExists:', err);

          return EMPTY;
        })
      )
      .subscribe({
        next: () => {
          this.reset();
          this.nzQueryService.refreshSelectedEntityDetails();
          this.alert.success(this.translate.instant('search.recordAdded'), { delay: 1000 });
          console.log('complete createFieldIfNotFound');
        },
      });
  }

  /**
   * Met à jour un champ uniquement s'il existe.
   */
  public updateFieldIfFound(formValues: FormValues): void {

    this.loader.show();

    const reference = this.referenceCurrentField.getSavedCurrentEntry();

    if (!reference) {
      this.alert.error(this.translate.instant('search.noSelectedEntry'), { delay: 1000 });
      this.loader.hide();

      return;
    }

    if (reference && !this.isUpdateAllowed(reference)) {
      this.alert.warn(this.translate.instant('search.updateNotAllowed'), { delay: 1000 });
      this.loader.hide();
      
      return;
    }

    const formatedValues = {
      ...formValues,
      subfields: StringUtils.parseSubfieldsString(formValues.subfields),
    } as DataField;

    this.nzQueryService
      .updateFieldIfExists(reference, formatedValues)
      .pipe(
        finalize(() => this.loader.hide()),
        catchError((err) => {
          this.alert.warn(this.translate.instant('search.acceptRefreshModal'), {
            delay: 1000,
          });
          console.error('Erreur updateFieldIfExists:', err);

          return EMPTY;
        })
      )
      .subscribe({
        next: () => {
          this.reset();
          this.nzQueryService.refreshSelectedEntityDetails();
          this.alert.success(this.translate.instant('search.recordAdded'), { delay: 1000 });
          console.log('complete updateFieldIfFound');
        },
      });
  }

  /**
   * Ajoute ou met à jour un enregistrement.
   * Tente d'abord une mise à jour ; si le champ n'existe pas, le crée.
   */
  public addrecord(formValues: FormValues): void {
    this.loader.show();

    const reference = this.referenceCurrentField.getSavedCurrentEntry();

    if (!reference) {
      this.alert.error(this.translate.instant('search.noSelectedEntry'), { delay: 1000 });
      this.loader.hide();

      return;
    }

    const formatedValues = {
      ...formValues,
      subfields: StringUtils.parseSubfieldsString(formValues.subfields),
    } as DataField;

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
              catchError((err2) => {
                this.alert.warn(this.translate.instant('search.acceptRefreshModal'), { delay: 1000 });
                console.error('Erreur lors de la création du champ:', err2);

                return EMPTY;
              }),
            );
          }

          this.alert.warn(this.translate.instant('search.acceptRefreshModal'), {
            delay: 1000,
          });
          console.error('Erreur updateFieldIfExists:', err);

          return EMPTY;
        })
      )
      .subscribe({
        next: () => {
          this.reset();
          this.nzQueryService.refreshSelectedEntityDetails();
          this.alert.success(this.translate.instant('search.recordAdded'), { delay: 1000 });
          console.log('complete addrecord');
        },
      });
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
    this.NZSelectedEntry.set(undefined);

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
