import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IdrefService } from '../services/idref.service';
import {
	IdrefSolrIndex,
	IdrefSolrIndexKeys,
	recordType,
} from '../models/idref-model';

@Component({
	selector: 'app-idref-search',
	templateUrl: './idref-search.component.html',
	styleUrls: ['./idref-search.component.scss']
})
export class IdrefSearchComponent {
	public IdrefSolrIndexKeys = IdrefSolrIndexKeys;
	public RecordTypeKeys = recordType;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public results: any[] = [];
	public loading = false;
	public recordTypeSelected!: string;

	public searchForm: FormGroup;
	private idrefService = inject(IdrefService);
	private fb = inject(FormBuilder);
	public constructor() {
		//on crée un formulaire vide au départ
		this.searchForm = this.fb.group({});
	}

	public onSelectKey(key: string): void {

		// Réinitialiser le formulaire avec uniquement le champ sélectionné
		this.searchForm = this.fb.group({
			[key]: [''], // Crée un seul FormControl avec la clé choisie
		});
	}

	public onSubmit(): void {
		console.log('Valeurs du formulaire :', this.searchForm.value);
		this.onSearch();
	}

	public onSearch(): void {
		this.loading = true;

		const query = this.buildQuery();

		this.idrefService.searchAuthorities(query).subscribe({
			next: (data) => {
				this.results = data.response.docs;
				this.loading = false;
			},
			error: () => {
				this.loading = false;
			},
		});
	}
	//const url = environment.idrefUrl+'persname_t:(albert%20AND%20einstein)&wt=json'

	private buildQuery(): string {
		const values = this.searchForm.value as IdrefSolrIndex;
		const keyValuePairs = Object.entries(values)
			.filter(([_, value]) => value !== null && value !== '') // On garde uniquement les valeurs non nulles et non vides
			.map(([key, value]) => `${key}:${value}`); // On transforme en "clé=valeur"
		const resultString = keyValuePairs.join('&'); // Par exemple, concaténation avec "&"
    const r=resultString.concat(`&${this.recordTypeSelected}`);

		console.log(r);

		return values.toString();
	}
}
