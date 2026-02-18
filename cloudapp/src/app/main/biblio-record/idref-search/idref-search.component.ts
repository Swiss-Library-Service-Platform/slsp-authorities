import { Component, inject, input } from '@angular/core';
import { NzBibRecord } from '../../../models/bib-records';
import { IdrefSearchService } from './idref-search.service';


@Component({
	selector: 'app-idref-search',
	templateUrl: './idref-search.component.html',
	styleUrls: ['./idref-search.component.scss'],
})
export class IdrefSearchComponent {

	public entity = input.required<NzBibRecord | undefined>();
	public isTo902FormVisible = inject(IdrefSearchService).isTo902FormVisible;
	public searchMode902 = inject(IdrefSearchService).searchMode902;
}
