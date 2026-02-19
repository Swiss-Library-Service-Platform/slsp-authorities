import { Component, inject, input } from '@angular/core';
import { NzBibRecord } from '../../../models/bib-records';
import { searchService } from './search.service';


@Component({
	selector: 'app-search',
	templateUrl: './search.component.html',
	styleUrls: ['./search.component.scss'],
})
export class searchComponent {

	public entity = input.required<NzBibRecord | undefined>();
	public isTo902FormVisible = inject(searchService).isTo902FormVisible;
	public searchMode902 = inject(searchService).searchMode902;
}
