import { Component, inject, effect } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IdrefService } from '../services/idref.service';
import {
	IdrefSolrIndexKeys,
	INVERTED_IDREF_RECORDTYPE_MAP,
} from '../models/idref-model';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'app-idref-search',
	templateUrl: './idref-search.component.html',
	styleUrls: ['./idref-search.component.scss'],
})
export class IdrefSearchComponent{
	public IdrefSolrIndexKeys = IdrefSolrIndexKeys;
	public RecordTypeKeys = INVERTED_IDREF_RECORDTYPE_MAP;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public results: any[] = [];
	public loading = false;
	public recordTypeSelected!: string;
	public searchForm: FormGroup;
	private idrefService = inject(IdrefService);
	private translate = inject(TranslateService);
	private alert = inject(AlertService);
	// eslint-disable-next-line @typescript-eslint/member-ordering
	public NZSelectedEntry = this.idrefService.NZSelectedEntry;
	// eslint-disable-next-line @typescript-eslint/member-ordering
	public flattenedValue = this.idrefService.flattenedValue;

	private fb = inject(FormBuilder);
	public constructor() {
		//formulaire du composant
		this.searchForm = this.fb.group({
			tag: [''],
			ind1: [''],
			ind2: [''],
			subfields: [''],
		});

		//on répercute les modifications du signal dans les champs des inputs
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
					{ emitEvent: false },
				);
			}
		});
	}

	public onSearch(): void {
		this.loading = true;
		
		//on met à jour les signaux du service idref pour modifier la source de données
		this.setNZSelectedEntry();

		const values = this.searchForm.value as {
			tag: string;
			ind1: string;
			ind2: string;
			subfields: string;
		};
		const subfields = values.subfields;

		console.log(subfields);

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
    	this.alert.info(this.translate.instant('idrefSearch.notImplemented'), { autoClose: true });
  	}

	public to902(): void {
    	this.alert.info(this.translate.instant('idrefSearch.notImplemented'), { autoClose: true });
  	}

	public clear(): void {
    	this.alert.info(this.translate.instant('idrefSearch.notImplemented'), { autoClose: true });
  	}


	private parseFlattenedArray(
		flattened: string,
	): { code: string; value: string }[] {
		const result: { code: string; value: string }[] = [];
		let currentCode: string | null = null;
		let currentValueParts: string[] = [];

		for (const item of flattened.split(' ')) {
			if (item.startsWith('$$')) {
				// Si on rencontre un nouveau code, on sauvegarde le précédent
				if (currentCode) {
					result.push({
						code: currentCode,
						value: currentValueParts.join(' '),
					});
				}
				// Nouveau code
				currentCode = item.replace("$$","");
				currentValueParts = [];
			} else {
				// Sinon, c'est une partie de la valeur
				currentValueParts.push(item);
			}
		}

		// Ajouter le dernier code si présent
		if (currentCode) {
			result.push({ code: currentCode, value: currentValueParts.join(' ') });
		}

		return result;
	}

	private setNZSelectedEntry(): void{

		const values = this.searchForm.value as {
			tag: string;
			ind1: string;
			ind2: string;
			subfields: string;
		};

		this.NZSelectedEntry.set({
				change : "",
				tag: values.tag,
				ind1: values.ind1,
				ind2: values.ind2,
				value: this.parseFlattenedArray(values.subfields)
			});
	}
}
