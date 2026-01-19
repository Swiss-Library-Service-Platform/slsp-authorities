import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IdrefService } from '../services/idref.service';
import { IdrefSolrIndexKeys } from '../models/idref-model';
import { values } from 'lodash';

@Component({
	selector: 'app-idref-search',
	templateUrl: './idref-search.component.html',
	styleUrls: ['./idref-search.component.scss'],
})
export class IdrefSearchComponent {
	public IdrefSolrIndexKeys = IdrefSolrIndexKeys;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public results: any[] = [];
	public loading = false;

	public searchForm: FormGroup;
	private idrefService = inject(IdrefService);
	private fb = inject(FormBuilder);
	public constructor() {
		//on crée un formulaire vide au départ
		this.searchForm = this.fb.group({});
	}

	public onSelectKey(key: string): void {
		// Ajouter dynamiquement le FormControl si pas déjà présent (peut-être utile si on veut créer dynamiquement un formulaire plus complexe dans le futur)
		/*if (!this.searchForm.contains(key)) {
      this.searchForm.addControl(key, new FormControl(''));
    }*/

		// Réinitialiser le formulaire avec uniquement le champ sélectionné
		this.searchForm = this.fb.group({
			[key]: [''], // Crée un seul FormControl avec la clé choisie
		});
	}

	public onSubmit(): void {
		console.log('Valeurs du formulaire :', this.searchForm.value);
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
   // const values = this.searchForm.value

		return values.toString();
	}
}
