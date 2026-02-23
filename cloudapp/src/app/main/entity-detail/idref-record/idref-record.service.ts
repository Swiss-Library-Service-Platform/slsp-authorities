/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable, inject, Signal, computed, signal } from '@angular/core';
import { Doc, IDREF_FILTER_MAP, IDREF_RECORDTYPE_MAP } from '../../../models/idref-model';
import { IdrefService } from '../../../services/idref.service';
import { BibRecordField } from '../../../models/bib-records';

@Injectable({
	providedIn: 'root',
})
export class IdrefRecordService {
	private idrefService = inject(IdrefService);

	// Formonnées du formulaire
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
			const filterValues = this.idrefService.NZSelectedEntry()?.subfields;
			const persnameValue = filterValues?.find((value) => value.code === 'a')?.value ?? '';
			const dates = filterValues?.find((value) => value.code === 'd')?.value ?? '';

			if (dates.length > 0) {
				return `${persnameValue}, ${dates}`;
			} else {
				return persnameValue;
			}
		});
	}

	/**
	 * Définit les valeurs du formulaire à partir d'une entry et lance la recherche
	 */
	public setFormValuesFromEntry(entry: BibRecordField): void {
		// Mettre à jour l'entry sélectionnée
		this.idrefService.NZSelectedEntry.set({ ...entry });

		// Obtenir les valeurs calculées à partir des signaux
		const searchIndex = this.idrefService.getMarcStructure()?.label ?? '';
		const constructedQueryValue = this.buildQueryInputValue()();

		// Mettre à jour les signaux du formulaire
		this.setFormValues(searchIndex, constructedQueryValue);

		// Lancer la recherche
		const query = this.buildQueryFromFormValues(searchIndex, constructedQueryValue);

		this.idrefService.searchFromQuery(query);
	}

	/**
	 * Met à jour les données du formulaire
	 */
	public setFormValues(searchIndex: string, constructedQuery: string): void {
		this.formSearchIndex.set(searchIndex);
		this.formConstructedQuery.set(constructedQuery);
	}

	/**
	 * Construit la query Solr à partir des valeurs du formulaire de recherche
	 */
	public buildQueryFromFormValues(searchIndex: string, constructedQuery: string): string {
		const queryValues = constructedQuery.split(',');
		let dateNaissance = '';
		let dateMort = '';
		let query = '';

		queryValues.forEach((value) => {
			if (/\b\d{4}\b/.test(String(value))) {
				const YEAR_REGEX = /\d{4}/g;
				const matches = value.match(YEAR_REGEX) || [];

				dateNaissance = matches[0] ? ` AND ${matches[0].trim()}` : '';
				dateMort = matches[1] ? ` AND ${matches[1].trim()}` : '';
			} else {
				if (value.trim().length !== 0) {
					if (query.length > 0) {
						query = `${query} AND ${value.trim()}`;
					} else {
						query = value.trim();
					}
				}
			}
		});

		query = `(${query}${dateNaissance}${dateMort})`;

		const recordTypeCharac = IDREF_RECORDTYPE_MAP.get(searchIndex);

		if (recordTypeCharac && recordTypeCharac.length > 0) {
			query = `${this.realFormSearchIndex()}:${query} AND recordtype_z:${recordTypeCharac}`;
		} else {
			query = `all:${query}`;
		}

		return query;
	}

	/**
	 * Met à jour l'entry sélectionnée avec le PPN fourni
	 */
	public updateSelectedEntryWithPPN(doc: Doc): void {
		const selectedEntry = this.idrefService.NZSelectedEntry();
		const ppn_z = doc.ppn_z;
		const affcourt_z = doc.affcourt_z;

		//TODO: c'est le cas où on crée un nouveaux champ dans la notice biblio
		if (!selectedEntry) {
			return;
		}

		// On clone le tableau pour rester "immutable"
		const newValues = [...selectedEntry.subfields];
		const currentPPNIndex = newValues.findIndex((subfield) => subfield.code === '0');

		if (currentPPNIndex !== -1) {
			// Mise à jour de la valeur existante
			newValues[currentPPNIndex] = {
				...newValues[currentPPNIndex],
				value: `(IDREF)${ppn_z}`,
			};
		} else {
			// Ajout d'un nouveau sous-champ $$0
			newValues.push({
				code: '0',
				value: `(IDREF)${ppn_z}`,
			});
		}

		const current$$aIndex = newValues.findIndex((subfield) => subfield.code === 'a');

		if (current$$aIndex !== -1) {
			// Mise à jour de la valeur existante
			newValues[current$$aIndex] = {
				...newValues[current$$aIndex],
				value: `${affcourt_z}`,
			};
		} else {
			// Ajout d'un nouveau sous-champ $$0
			newValues.push({
				code: 'a',
				value: `${affcourt_z.split(',')[0]}`,
			});
		}

		if (
			selectedEntry.tag.match(/^6\d\d$/) &&
			!newValues.some((subfield) => subfield.code === '2')
		) {
			// Ajout d'un nouveau sous-champ $$2
			newValues.push({
				code: '2',
				value: `idref`,
			});
		}

		const newEntry: BibRecordField = {
			...selectedEntry,
			subfields: newValues,
		};

		// Mise à jour du signal
		this.idrefService.NZSelectedEntry.set(newEntry);
	}

	public reset(): void {
		this.formSearchIndex.set('all');
		this.formConstructedQuery.set('');
	}
}
