import { Component, computed, inject, input, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { BibRecordField, NzBibRecord } from '../../models/bib-records';
import { MARC_STRUCTURE_KEY } from '../../models/idref-model';
import { BiblioReferencedEntryService } from '../../services/biblio-referenced-entry.service';
import { IdrefService } from '../../services/idref.service';
import { searchService } from './search/search.service';
import { SearchMode, SearchMode902 } from './search/model';
import { IdrefRecordService } from '../entity-detail/idref-record/idref-record.service';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';

//Composant pour afficher les notices bibliographique provenant de la NZ
@Component({
	selector: 'app-biblio-record',
	templateUrl: './biblio-record.component.html',
	styleUrl: './biblio-record.component.scss',
})
export class BiblioRecordComponent {
	public selectedBibRecordField: BibRecordField | null = null;
	public selectedEntity = input.required<NzBibRecord | undefined>();
	public dialog = inject(MatDialog);
	private readonly idrefAllowedTags = new Set(MARC_STRUCTURE_KEY);
	private searchService = inject(searchService);
	private idrefService = inject(IdrefService);
	private referenceCurrentField = inject(BiblioReferencedEntryService);
	private idrefRecordService = inject(IdrefRecordService);
	private alertService = inject(AlertService);
	private translate = inject(TranslateService);
	// ✅ BehaviorSubject pour allowedTags
	private allowedTags = signal(MARC_STRUCTURE_KEY);

	// eslint-disable-next-line @typescript-eslint/member-ordering
	public  BibRecordFields = computed(() => {
			const anie = this.selectedEntity()?.anies[0];

			if(typeof anie === 'string'){
				return this.updateMarcFields(anie, this.allowedTags());
			}

			return [];
		});

	//retourne les tag de la notice bibliographique sur lesquels on peut faire une recherche
	public getIdrefAllowedTags(): string[] {
		return MARC_STRUCTURE_KEY;
	}

	public getMarcRowStatusClass(entry: BibRecordField): string | null {
		if (!this.idrefAllowedTags.has(entry.tag)) {
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

		const hasParenthesizedValue = subfieldZeroValues.some((value) => /\([^)]*\)/.test(value));

		if (hasParenthesizedValue) {
			return 'marc-row--status-other';
		}

		return 'marc-row--status-missing';
	}

	public pushToInput(entry: BibRecordField): void {
		this.selectedBibRecordField = entry;
		this.idrefService.NZSelectedEntry.set({ ...entry });
		this.searchService.closeTo902();
		this.searchService.searchMode902.set(SearchMode902.Add902);

		//on gere le cas du 902
		if (entry.tag === '902') {
			this.searchService.searchMode902.set(SearchMode902.Modify902);
			this.searchService.showTo902();
		}
		this.searchService.searchMode.set(SearchMode.Update);
	}

	public saveCurrentEntry(entry: BibRecordField): void {
		this.referenceCurrentField.setSavedCurrentEntry(entry);
	}

	public searchIdref(entry: BibRecordField): void {
		this.idrefRecordService.setFormValuesFromEntry(entry);
	}

	public deleteField(entry: BibRecordField): void {
		if (!this.isDeleteAllowed(entry)) {
			this.alertService.warn(this.translate.instant('search.deleteNotAllowed'), { delay: 3000, autoClose: true });

			return;
		}

		const dialogRef = this.dialog.open(DeleteDialogComponent, {
			width: '50px',
			data: { entry },
		});

		// no action required after dialog close
		dialogRef.afterClosed().subscribe();
	}

	// ✅ Méthode pour mettre à jour allowedTags
	public showDetails(): void {
		if (this.allowedTags().length > 0) {
			this.allowedTags.set([]);
		} else {
			//on récupère toutes les clés de MARC_STRUCTURE et on les mets dans un tableau pour les afficher dans le html
			this.allowedTags.set(MARC_STRUCTURE_KEY);
		}
	}

	private isDeleteAllowed(entry: BibRecordField): boolean {
		const subfieldZeroValues = entry.subfields
			.filter((subfield) => subfield.code === '0')
			.map((subfield) => subfield.value.trim());

		if (subfieldZeroValues.length === 0) {
			return true;
		}

		return subfieldZeroValues.every((value) => value.includes('(IDREF)') || value.includes('(RERO)'));
	}

	private updateMarcFields(xmlString: string, allowedTagsArray: string[]): BibRecordField[] {
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
		const marcFields = filteredFields.map((field) => {
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

		return marcFields;
	}
}
