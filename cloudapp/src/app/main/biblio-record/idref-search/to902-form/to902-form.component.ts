import { Component, inject, input } from '@angular/core';
import { Bib } from '../../../../models/bib-records';
import { IdrefSearchService } from '../idref-search.service';
import { SearchMode } from '../model';

@Component({
	selector: 'app-to902-form',
	templateUrl: './to902-form.component.html',
	styleUrl: './to902-form.component.scss',
})
export class To902FormComponent {
	public searchMode = inject(IdrefSearchService).searchMode;

	public entity = input.required<Bib | undefined>();

	public goBack(): void {
		this.searchMode.set(SearchMode.AddField);
	}
}
