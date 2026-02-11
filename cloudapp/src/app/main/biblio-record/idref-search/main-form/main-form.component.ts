/* eslint-disable @typescript-eslint/member-ordering */
import { Component, inject, effect, input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Bib } from '../../../../models/bib-records';
import { IdrefService } from '../../../../services/idref.service';
import { IdrefSearchService } from '../idref-search.service';

@Component({
	selector: 'app-main-form',
	templateUrl: './main-form.component.html',
	styleUrl: './main-form.component.scss',
})
export class MainFormComponent {
	public entity = input.required<Bib | undefined>();

	public searchForm: FormGroup;

	private idrefService = inject(IdrefService);
	private idrefSearchService = inject(IdrefSearchService);
	private fb = inject(FormBuilder);

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

	public onSearch(): void {
		this.idrefSearchService.setNZSelectedEntry(this.searchForm.value);

		const values = this.searchForm.value as {
			tag: string;
			ind1: string;
			ind2: string;
			subfields: string;
		};
		const subfields = values.subfields;
		const regex = /\$\$0 \(IDREF\)(\d+)/;
		const match = subfields.match(regex);

		if (match) {
			const ppn = match[1];

			this.idrefService.searchWithPPN(ppn);
		} else {
			const searchParams = this.idrefService.getMarcStructure();

			this.idrefService.calculatedSearch(searchParams);
		}
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

	public to902(): void {
		this.idrefSearchService.to902();
	}

	public clear(): void {
		this.idrefSearchService.clear(() => this.searchForm.reset());
	}
}
