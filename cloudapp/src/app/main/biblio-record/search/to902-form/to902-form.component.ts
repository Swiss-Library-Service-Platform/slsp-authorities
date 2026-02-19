/* eslint-disable @typescript-eslint/member-ordering */
import { Component, computed, effect, inject, input } from '@angular/core';
import { NzBibRecord } from '../../../../models/bib-records';
import { searchService } from '../search.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormValues } from '../model';

export enum to902$$aFields {
	nouveau = 'IDREF-NOUV',
	correction = 'IDREF-CORR',
	doublon = 'IDREF-DOUB',
}

@Component({
	selector: 'app-to902-form',
	templateUrl: './to902-form.component.html',
	styleUrl: './to902-form.component.scss',
})
export class To902FormComponent {
	public entity = input.required<NzBibRecord | undefined>();

	public searchForm: FormGroup;

	public to902Purpose = Object.values(to902$$aFields);

	private searchService = inject(searchService);
	private fb = inject(FormBuilder);

	public readonly searchMode902 = this.searchService.searchMode902;
	public readonly searchMode = this.searchService.searchMode;
	public readonly NZSelectedEntry = this.searchService.NZSelectedEntry;
	
public defaultPurpose = computed(() => {
  if (this.NZSelectedEntry()?.tag === '902') {
    return `${this.NZSelectedEntry()?.subfields.find((f) => f.code === 'a')?.value}`;
  }

  if (this.NZSelectedEntry()?.subfields.find((f) => f.code === '0' && f.value.includes('IDREF'))) {
    return to902$$aFields.correction;
  }

  return to902$$aFields.nouveau;
});


	//TODO: faire en sorte que le content soit tiré d'un fichier de configuration pour pouvoir le faire évoluer facilement sans toucher au code, par exemple en mettant des templates de champs à ajouter selon le purpose choisi
	
public predifinedContent = computed(() => {
  if (this.NZSelectedEntry()?.tag === '902') {
    return `${this.NZSelectedEntry()?.subfields.find((f) => f.code === 'b')?.value}`;
  }

  const purpose = this.searchForm.get('purpose')?.value;

  if (purpose === to902$$aFields.correction) {
    return `The link to idref should be: ${this.NZSelectedEntry()?.subfields.find((f) => f.code === '0')?.value}`;
  } else if (purpose === to902$$aFields.nouveau) {
    return `It is Necessary to add a link to the record in idref.`;
  } else {
    return `The record is a duplicate of an existing one in idref.`;
  }
});


	public constructor() {
  this.searchForm = this.fb.group({
    tag: [{ value: '902', disabled: true }],
    ind1: [{ value: ' ', disabled: true }],
    ind2: [{ value: ' ', disabled: true }],
    purpose: [this.defaultPurpose()],
    subfields: [''],
  });

  effect(() => {
    const entry = this.NZSelectedEntry();

    if (entry) {
      const purpose = this.defaultPurpose();

      this.searchForm.patchValue(
        {
          subfields: this.predifinedContent(),
          purpose, // ⚠️ plus de [ ... ], c'est une string
        },
        { emitEvent: false }
      );
    }
  });
}

	public updateFieldIfFound(): void {
		const purpose = this.searchForm.get('purpose')?.value;
		const rawValue = this.searchForm.getRawValue() as FormValues;
		const finalValues: FormValues = {
			tag: rawValue.tag,
			ind1: rawValue.ind1,
			ind2: rawValue.ind2,
			subfields: `$$a ${purpose} $$b ${rawValue.subfields}`,
		};

		this.searchService.updateFieldIfFound(finalValues);
	}

	public createFieldIfNotFound(): void {
		const purpose = this.searchForm.get('purpose')?.value;
		const rawValue = this.searchForm.getRawValue() as FormValues;
		const finalValues: FormValues = {
			tag: rawValue.tag,
			ind1: rawValue.ind1,
			ind2: rawValue.ind2,
			subfields: `$$a ${purpose} $$b ${rawValue.subfields}`,
		};
		
		this.searchService.createFieldIfNotFound(finalValues);
	}

	public clear(): void {
		this.searchService.clear(() => this.searchForm.reset());
	}

	public closeTo902(): void {
		this.searchService.closeTo902();
	}
}
