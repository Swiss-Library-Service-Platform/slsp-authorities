/* eslint-disable @typescript-eslint/member-ordering */
import { Component, effect, inject, input } from '@angular/core';
import { Bib } from '../../../../models/bib-records';
import { IdrefSearchService } from '../idref-search.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IdrefService } from '../../../../services/idref.service';

@Component({
	selector: 'app-to902-form',
	templateUrl: './to902-form.component.html',
	styleUrl: './to902-form.component.scss',
})
export class To902FormComponent {

	public entity = input.required<Bib | undefined>();
	
		public searchForm: FormGroup;
	
		private idrefService = inject(IdrefService);
		private idrefSearchService = inject(IdrefSearchService);
		private fb = inject(FormBuilder);
	
		public readonly searchMode902 = this.idrefSearchService.searchMode902;
		public readonly searchMode = this.idrefSearchService.searchMode;
		public readonly NZSelectedEntry = this.idrefSearchService.NZSelectedEntry;
		public readonly flattenedValue = this.idrefSearchService.flattenedValue;
	
		public constructor() {
			this.searchForm = this.fb.group({
				tag: [''],
				ind1: [''],
				ind2: [''],
				subfields: [''],
			});
	
			effect(() => {
				const entry = this.NZSelectedEntry();
	
				if (entry) {
					this.searchForm.patchValue(
						{
							tag: entry.tag,
							ind1: entry.ind1,
							ind2: entry.ind2,
							subfields: this.flattenedValue(),
						},
						{ emitEvent: false }
					);
				}
			});
		}

	public addrecord(): void {
		this.idrefSearchService.addrecord(this.searchForm.value);
	}

	public updateFieldIfFound(): void {
		this.idrefSearchService.updateFieldIfFound(this.searchForm.value);
	}

	public createFieldIfNotFound(): void {
		this.idrefSearchService.createFieldIfNotFound(this.searchForm.value);
	}

	public clear(): void {
		this.idrefSearchService.clear(() => this.searchForm.reset());
	}

	public hideTo902(): void {
		this.idrefSearchService.hideTo902();
	}
}
