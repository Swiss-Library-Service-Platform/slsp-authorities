import { Injectable } from '@angular/core';
import { BibRecordField } from '../../../models/bib-records';

@Injectable({
	providedIn: 'root',
})
export class BiblioRecordMarcService {
	public getMarcRowStatusClass(entry: BibRecordField, allowedTags: Set<string>): string | null {
		if (!allowedTags.has(entry.tag)) {
			return null;
		}

		const subfieldZeroValues = entry.subfields
			.filter((subfield) => subfield.code === '0')
			.map((subfield) => subfield.value);

		if (subfieldZeroValues.length === 0) {
			return 'marc-row--status-missing';
		}

		const hasIdref = subfieldZeroValues.some((value) => value.includes('(IDREF)'));

		if (hasIdref) {
			return 'marc-row--status-idref';
		}

		const hasRero = subfieldZeroValues.some((value) => value.includes('(RERO)'));

		if (hasRero) {
			return 'marc-row--status-rero';
		}

		const hasParenthesizedValue = subfieldZeroValues.some((value) => /\([^)]*\)/.test(value));

		if (hasParenthesizedValue) {
			return 'marc-row--status-other';
		}

		return 'marc-row--status-missing';
	}

	public isDeleteAllowed(entry: BibRecordField): boolean {
		const subfieldZeroValues = entry.subfields
			.filter((subfield) => subfield.code === '0')
			.map((subfield) => subfield.value.trim());

		if (subfieldZeroValues.length === 0) {
			return true;
		}

		return subfieldZeroValues.every((value) => value.includes('(IDREF)') || value.includes('(RERO)'));
	}

	public updateMarcFields(xmlString: string, allowedTagsArray: string[]): BibRecordField[] {
		const xmlRecord = new DOMParser().parseFromString(xmlString, 'text/xml');
		const record: Element = xmlRecord.getElementsByTagName('record')[0];

		if (!record) {
			return [];
		}

		const fields: Element[] = Array.from(record.childNodes).filter(
			(node): node is Element => node.nodeType === Node.ELEMENT_NODE
		);
		const filteredFields =
			allowedTagsArray.length > 0
				? fields.filter((field) => allowedTagsArray.includes(field.getAttribute('tag') ?? ''))
				: fields;

		return filteredFields.map((field) => {
			const entry: BibRecordField = {
				change: '',
				tag: '',
				ind1: '',
				ind2: '',
				subfields: [],
			};

			if (field.tagName === 'leader') {
				entry.change = 'NONE';
				entry.tag = 'LDR';
				entry.ind1 = ' ';
				entry.ind2 = ' ';
				entry.subfields = [{ code: '', value: (field.textContent ?? '').replace(/ /g, '#') }];

				return entry;
			}

			const tag: string = field.getAttribute('tag') ?? '';

			entry.tag = tag;

			if (field.tagName === 'controlfield') {
				entry.ind1 = ' ';
				entry.ind2 = ' ';
				entry.subfields = [{ code: '', value: (field.textContent ?? '').replace(/ /g, '#') }];

				return entry;
			}

			if (field.tagName === 'datafield') {
				entry.ind1 = field.getAttribute('ind1') ?? '';
				entry.ind2 = field.getAttribute('ind2') ?? '';

				const valueMap: { code: string; value: string }[] = [];

				Array.from(field.childNodes)
					.filter((node): node is Element => node.nodeType === Node.ELEMENT_NODE)
					.forEach((subfield) => {
						valueMap.push({
							code: subfield.getAttribute('code') ?? '',
							value: subfield.textContent ?? '',
						});
					});

				entry.subfields = valueMap;
			}

			return entry;
		});
	}
}
