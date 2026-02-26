/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable, inject, Signal, computed, signal } from '@angular/core';
import { Doc, IDREF_FILTER_MAP, IDREF_RECORDTYPE_MAP } from '../../../models/idref.model';
import { IdrefService } from '../../../services/idref.service';
import { BibRecordField } from '../../../models/bib-record.model';

@Injectable({
	providedIn: 'root',
})
export class IdrefRecordService {
	private idrefService = inject(IdrefService);

	// Données du formulaire.
	public formSearchIndex = signal<string>('all');
	public formConstructedQuery = signal<string>('');
	public formIsStrictSearch = signal<boolean>(false);

	private realFormSearchIndex = computed(() => {
		const suffixe = this.formIsStrictSearch() ? '_s' : '_t';
		const searchIndex = IDREF_FILTER_MAP.get(this.formSearchIndex());

		if (searchIndex !== 'all') {
			return `${searchIndex}${suffixe}`;
		} else {
			return searchIndex;
		}
	});

	/**
	 * Construit la valeur d'input de query à partir des valeurs de filtres
	 */
	public buildQueryInputValue(): Signal<string> {
		return computed(() => {
			const filterValues = this.idrefService.nzSelectedEntry()?.subfields;
			const $$aValue = filterValues?.find((value) => value.code === 'a')?.value ?? '';
			const $$dValue = filterValues?.find((value) => value.code === 'd')?.value ?? '';
			const $$bValue = filterValues?.find((value) => value.code === 'b')?.value ?? '';

			return `${$$aValue} ${$$bValue} ${$$dValue}`.trim();
			
		});
	}

	/**
	 * Définit les valeurs du formulaire à partir d'une entry et lance la recherche
	 */
	public setFormValuesFromEntry(): void {

		// Récupère les valeurs calculées à partir des signaux.
		const searchIndex = this.idrefService.getMarcStructure()?.label ?? '';
		const constructedQueryValue = this.buildQueryInputValue()();

		// Met à jour les signaux du formulaire.
		this.setFormValues(searchIndex, constructedQueryValue);

		// Lance la recherche.
		const query = this.buildQueryFromFormValues(searchIndex, constructedQueryValue);

		this.idrefService.searchFromQuery$(query).subscribe();
	}

	/**
	 * Met à jour les données du formulaire
	 */
	public setFormValues(searchIndex: string, constructedQuery: string): void {
		this.formSearchIndex.set(searchIndex);
		this.formConstructedQuery.set(constructedQuery);
	}

	public searchFromFormValues(searchIndex: string, constructedQuery: string): void {
		const query = this.buildQueryFromFormValues(searchIndex, constructedQuery);

		this.idrefService.searchFromQuery$(query).subscribe();
	}

	public searchFromCurrentEntryContext(): void {
		const searchIndex = this.idrefService.getMarcStructure()?.label ?? '';
		const constructedQueryValue = this.buildQueryInputValue()();

		this.setFormValues(searchIndex, constructedQueryValue);
		this.searchFromFormValues(searchIndex, constructedQueryValue);
	}

	/**
	 * Construit la query Solr à partir des valeurs du formulaire de recherche
	 */
	public buildQueryFromFormValues(searchIndex: string, constructedQuery: string): string {
		let query = constructedQuery
			.replace(/[.\-()\[\]{}]/g, '')
			.replace(/[,\s]+/g, ' AND ')
			.trim();

		query = `(${query.replace(/^(AND\s+)+|(\s+AND)+$/g, '')})`;

		const recordTypeCharac = IDREF_RECORDTYPE_MAP.get(searchIndex);

		if (recordTypeCharac && recordTypeCharac.length > 0) {
			query = `${this.realFormSearchIndex()}:${query} AND recordtype_z:(${recordTypeCharac})`;
		} else {
			const allRecordTypes = Array.from(IDREF_RECORDTYPE_MAP.values()).join(' OR ');

			if (allRecordTypes.length > 0) {
				query = `all:${query} AND recordtype_z:(${allRecordTypes})`;
			} else {
				query = `all:${query}`;
			}
		}

		return query;
	}

	/**
	 * Met à jour l'entry sélectionnée avec le PPN fourni
	 */
	public updateSelectedEntryWithPPN(doc: Doc): void {
		const selectedEntry = this.idrefService.nzSelectedEntry();
		const ppn_z = doc.ppn_z;
		const affcourt_z = doc.affcourt_z;

		// TODO: gérer le cas de création d'un nouveau champ dans la notice bibliographique.
		if (!selectedEntry) {
			return;
		}

		// Clone le tableau pour conserver l'immuabilité.
		const newValues = [...selectedEntry.subfields];
		const currentPPNIndex = newValues.findIndex((subfield) => subfield.code === '0');

		if (currentPPNIndex !== -1) {
			// Met à jour la valeur existante.
			newValues[currentPPNIndex] = {
				...newValues[currentPPNIndex],
				value: `(IDREF)${ppn_z}`,
			};
		} else {
			// Ajoute un nouveau sous-champ $$0.
			newValues.push({
				code: '0',
				value: `(IDREF)${ppn_z}`,
			});
		}

		const current$$aIndex = newValues.findIndex((subfield) => subfield.code === 'a');

		if (current$$aIndex !== -1) {
			// Met à jour la valeur existante.
			newValues[current$$aIndex] = {
				...newValues[current$$aIndex],
				value: `${affcourt_z}`,
			};
		} else {
			// Ajoute un nouveau sous-champ $$a.
			newValues.push({
				code: 'a',
				value: `${affcourt_z.split(',')[0]}`,
			});
		}

		if (
			selectedEntry.tag.match(/^6\d\d$/) &&
			!newValues.some((subfield) => subfield.code === '2')
		) {
			// Ajoute un nouveau sous-champ $$2.
			newValues.push({
				code: '2',
				value: `idref`,
			});
		}

		const newEntry: BibRecordField = {
			...selectedEntry,
			subfields: newValues,
		};

		// Met à jour le signal.
		this.idrefService.nzSelectedEntry.set(newEntry);
	}

	public reset(): void {
		this.formSearchIndex.set('all');
		this.formConstructedQuery.set('');
	}
}
