import { Component, inject, input } from '@angular/core';
import { NzBibRecord } from '../../../models/bib-records';
import { SearchService } from './search.service';


@Component({
	selector: 'app-search',
	templateUrl: './search.component.html',
	styleUrls: ['./search.component.scss'],
})
export class SearchComponent {

	public entity = input.required<NzBibRecord | undefined>();
	public isTo902FormVisible = inject(SearchService).isTo902FormVisible;
	public searchMode902 = inject(SearchService).searchMode902;
}
