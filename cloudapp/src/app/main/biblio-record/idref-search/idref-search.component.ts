import { Component, inject, input } from '@angular/core';
import { Bib } from '../../../models/bib-records';
import { IdrefSearchService } from './idref-search.service';


@Component({
	selector: 'app-idref-search',
	templateUrl: './idref-search.component.html',
	styleUrls: ['./idref-search.component.scss'],
})
export class IdrefSearchComponent {

	public entity = input.required<Bib | undefined>();
	public showTo902Form = inject(IdrefSearchService).showTo902Form;
}
