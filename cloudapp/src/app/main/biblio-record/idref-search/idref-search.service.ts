/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable, computed, inject, signal } from '@angular/core';
import { IdrefService } from '../../../services/idref.service';
import { SearchMode } from './model';

@Injectable({
  providedIn: 'root'
})
export class IdrefSearchService {


  public searchMode = signal<SearchMode>(SearchMode.AddField);
  private idrefService = inject(IdrefService);

  public NZSelectedEntry = this.idrefService.NZSelectedEntry;
  public flattenedValue = this.idrefService.flattenedValue;
  public showTo902Form = computed(() => {
    const mode = this.searchMode();
    
    return mode === SearchMode.Add902 || mode === SearchMode.Modify902;
  }); 


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
  public setNZSelectedEntry(values: {
    tag: string;
    ind1: string;
    ind2: string;
    subfields: string;
  }): void {
    this.NZSelectedEntry.set({
      change: '',
      tag: values.tag,
      ind1: values.ind1,
      ind2: values.ind2,
      value: this.parseFlattenedArray(values.subfields),
    });
  }
}
