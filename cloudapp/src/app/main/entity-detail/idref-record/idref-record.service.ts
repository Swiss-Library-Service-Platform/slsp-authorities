/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable, inject, Signal, computed, signal } from '@angular/core';
import { IDREF_FILTER_MAP, IDREF_RECORDTYPE_MAP } from '../../../models/idref-model';
import { IdrefService } from '../../../services/idref.service';
import { xmlEntry } from '../../../models/bib-records';

@Injectable({
	providedIn: 'root',
})
export class IdrefRecordService {
	private idrefService = inject(IdrefService);

	// Formonnées du formulaire
	public formSearchIndex = signal<string>('');
	public formConstructedQuery = signal<string>('');

	/**
	 * Récupère l'index de recherche MARC (searchIndex)
	 */
	public getSearchIndex(): Signal<string> {
		return computed(() => this.idrefService.getMarcStructure()?.label ?? '');
	}

	/**
	 * Récupère les filtres IDREF
	 */
	public getFilters(): Signal<string[]> {
		return computed(() => this.idrefService.getMarcStructure()?.filters ?? []);
	}

	/**
	 * Récupère les valeurs des filtres à partir de l'entry sélectionnée
	 */
	public getFilterValues(): Signal<Array<{ code: string; value: string }> | undefined> {
		return computed(() => this.idrefService.NZSelectedEntry()?.value);
	}

	/**
	 * Construit la valeur d'input de query à partir des valeurs de filtres
	 */
	public buildQueryInputValue(): Signal<string> {
		return computed(() => {
			const filterValues = this.getFilterValues()();
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
	 * Construit la query Solr complète basée sur les filtres et valeurs actuels
	 */
	public buildConstructedQuery(): Signal<string> {
		return computed(() => {
			const filters = this.getFilters()();
			const filterValues = this.getFilterValues()();
			const searchIndex = this.getSearchIndex()();

			if (!filters.length || !filterValues) {
				return '';
			}

			let query = `${filters[0]}:(`;

			// Gère le cas persname_t
			if (filters.join().includes('persname_t')) {
				const persnameValue =
					filterValues.find((value) => value.code === 'a')?.value.split(',') ?? [];

				if (persnameValue && persnameValue.length > 1) {
					query = `${query}${persnameValue[0]} AND ${persnameValue[1]}`;
				} else {
					query = `${query}${persnameValue[0]}`;
				}

				if (filters.length > 1) {
					if (
						filters.join().includes('persname_t') &&
						filters.join().includes('datenaissance_dt') &&
						filters.join().includes('datemort_dt')
					) {
						const dates = filterValues.find((value) => value.code === 'd')?.value;

						if (dates && dates.length >= 4 && dates.length < 8) {
							query = `${query} AND datenaissance_dt:${dates.substring(0, 4)}`;
						} else if (dates && dates.length > 8) {
							query = `${query} AND datenaissance_dt:${dates.substring(0, 4)} AND datemort_dt:${dates.substring(dates.length - 4, dates.length)}`;
						}
					}
				}
				query = `${query})`;
			} else {
				query = `${filters[0]}:${filterValues.find((value) => value.code === 'a')?.value}`;
			}

			// Ajoute le recordType si nécessaire
			if (searchIndex.length > 0 && IDREF_RECORDTYPE_MAP.get(searchIndex)) {
				query = `${query} AND recordtype_z:${IDREF_RECORDTYPE_MAP.get(searchIndex)}`;
			}

			return query;
		});
	}

	/**
	 * Définit les valeurs du formulaire à partir d'une entry et lance la recherche
	 */
	public setFormValuesFromEntry(entry: xmlEntry): void {
		// Mettre à jour l'entry sélectionnée
		this.idrefService.NZSelectedEntry.set({ ...entry });

		// Obtenir les valeurs calculées à partir des signaux
		const searchIndex = this.getSearchIndex()();
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

				dateNaissance = matches[0] ? ` AND datenaissance_dt:${matches[0].trim()}` : '';
				dateMort = matches[1] ? ` AND datemort_dt:${matches[1].trim()}` : '';
			} else {
				if (query.length > 0) {
					query = `${query} AND ${value.trim()}`;
				} else {
					query = value.trim();
				}
			}
		});

		query = `(${query}${dateNaissance}${dateMort})`;

		const recordTypeCharac = IDREF_RECORDTYPE_MAP.get(searchIndex);

		if (recordTypeCharac && recordTypeCharac.length > 0) {
			query = `${IDREF_FILTER_MAP.get(searchIndex)}:${query} AND recordtype_z:${recordTypeCharac}`;
		} else {
			query = `all:${query}`;
		}

		return query;
	}

	/**
	 * Met à jour l'entry sélectionnée avec le PPN fourni
	 */
	public updateSelectedEntryWithPPN(ppn_z: string): void {
		const selectedEntry = this.idrefService.NZSelectedEntry();

		//TODO: c'est le cas où on crée un nouveaux champ dans la notice biblio
		if (!selectedEntry) {
			return;
		}

		// On clone le tableau pour rester "immutable"
		const newValues = [...selectedEntry.value];
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

		const newEntry = {
			...selectedEntry,
			value: newValues,
		};

		// Mise à jour du signal
		this.idrefService.NZSelectedEntry.set(newEntry);
	}

	public reset(): void {
		this.formSearchIndex.set('');
		this.formConstructedQuery.set('');
	}
}
