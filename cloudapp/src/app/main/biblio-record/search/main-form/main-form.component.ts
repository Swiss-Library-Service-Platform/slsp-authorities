/* eslint-disable @typescript-eslint/member-ordering */
import { Component, inject, effect, input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NzBibRecord } from '../../../../models/bib-records';
import { IdrefService } from '../../../../services/idref.service';
import { searchService } from '../search.service';

@Component({
	selector: 'app-main-form',
	templateUrl: './main-form.component.html',
	styleUrl: './main-form.component.scss',
})
export class MainFormComponent {
	public entity = input.required<NzBibRecord | undefined>();

	public searchForm: FormGroup;

	private idrefService = inject(IdrefService);
	private searchService = inject(searchService);
	private fb = inject(FormBuilder);

	public readonly searchMode = this.searchService.searchMode;
	public readonly isTo902FormVisible = this.searchService.isTo902FormVisible;
	public readonly NZSelectedEntry = this.searchService.NZSelectedEntry;
	public readonly flattenedValue = this.searchService.flattenedValue;

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
		this.searchService.setNZSelectedEntry(this.searchForm.value);

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
		this.searchService.addrecord(this.searchForm.value);
	}

	public updateFieldIfFound(): void {
		this.searchService.updateFieldIfFound(this.searchForm.value);
	}

	public createFieldIfNotFound(): void {
		this.searchService.createFieldIfNotFound(this.searchForm.value);
	}

	public showTo902(): void {
		this.searchService.showTo902();
	}

	public clear(): void {
		this.searchService.clear(() => this.searchForm.reset());
	}
}
