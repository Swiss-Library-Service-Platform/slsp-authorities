import { computed, Injectable, signal } from '@angular/core';
import { MARC_STRUCTURE, MarcStructureValues } from '../models/idref.model';
import { BibRecordField } from '../models/bib-record.model';
@Injectable({ providedIn: 'root' })
export class SelectedBibFieldService {
	public selectedFieldFromBibRecord = signal<BibRecordField | undefined>(undefined);

	// Concaténation des sous-champs en une chaîne unique.
	public flattenedValue = computed(() =>
		this.selectedFieldFromBibRecord()
			?.subfields.map((v) => `$$${v.code} ${v.value}`)
			.join(' ')
	);

	// Retourne la structure MARC liée à l'entrée sélectionnée.
	public getMarcStructure(): MarcStructureValues | undefined {
		const codes: string[] = [];
		const tag = this.selectedFieldFromBibRecord()?.tag;
		const ind1 = this.selectedFieldFromBibRecord()?.ind1;
		const ind2 = this.selectedFieldFromBibRecord()?.ind2;
		const value = this.selectedFieldFromBibRecord()?.subfields;

		value?.forEach((subfield) => codes.push(subfield.code.replace('$$', '')));

		const subfieldsStr = codes.sort().join(',');
		let result = MARC_STRUCTURE.get(`${tag}|${ind1}${ind2}|${subfieldsStr}`);

		if (result) {
			return result;
		} else {
			// S'il n'y a pas de sous-champs, recherche par indicateurs.
			result = MARC_STRUCTURE.get(`${tag}|${ind1}${ind2}`);

			if (result) return result;
			if ((result = MARC_STRUCTURE.get(`${tag}|  `))) return result;

			return;
		}
	}

	public reset(): void {
		this.selectedFieldFromBibRecord.set(undefined);
	}
}
