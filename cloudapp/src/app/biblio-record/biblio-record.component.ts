import { Component, inject, input, OnInit } from '@angular/core';
import { Bib, xmlEntry } from '../models/bib-records';
import { MARC_STRUCTURE_KEY } from '../models/idref-model';
import { toObservable } from '@angular/core/rxjs-interop';
import {
	map,
	distinctUntilChanged,
	combineLatest,
	BehaviorSubject,
} from 'rxjs';
import { IdrefService } from '../services/idref.service';
import { BiblioReferencedEntryService } from '../services/biblio-referenced-entry.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';

//Composant pour afficher les notices bibliographique provenant de la NZ
@Component({
	selector: 'app-biblio-record',
	templateUrl: './biblio-record.component.html',
	styleUrl: './biblio-record.component.scss',
})
export class BiblioRecordComponent implements OnInit {
	public marcFields: xmlEntry[] = [];
	public selectedEntry: xmlEntry | null = null;
	public entity = input.required<Bib | undefined>();
	public entity$ = toObservable(this.entity);

	public entityAnnies$ = this.entity$.pipe(
		map((e) => e?.anies[0] ?? null),
		distinctUntilChanged(),
	);
	public dialog = inject(MatDialog);
	private idrefService = inject(IdrefService);
	private referenceCurrentField = inject(BiblioReferencedEntryService);
	// ✅ BehaviorSubject pour allowedTags
	private allowedTags$ = new BehaviorSubject<string[]>(MARC_STRUCTURE_KEY);

	//retourne les tag de la notice bibliographique sur lesquels on peut faire une recherche
	public getIdrefAllowedTags(): string[] {
		return MARC_STRUCTURE_KEY;
	}

	public pushToInput(entry: xmlEntry): void {
		this.selectedEntry = entry;
		this.idrefService.NZSelectedEntry.set({...entry});
	}

	public saveCurrentEntry(entry: xmlEntry): void {

		this.referenceCurrentField.setSavedCurrentEntry(entry);
	}

	public searchIdref(entry: xmlEntry): void {
		
		this.idrefService.NZSelectedEntry.set({...entry});
	}

	public deleteField(entry: xmlEntry): void {
		const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '50px',
	  data: {entry}
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('The dialog was closed');
    });
  }
	

	public ngOnInit(): void {
		// Combine xmlString et allowedTags pour recalculer marcFields
		//donc lorsque l'on met à jour allowedTags avec updateAllowedTags ça recalcule automatiquement marcfields
		combineLatest([this.entityAnnies$, this.allowedTags$]).subscribe(
			([xmlString, allowedTagsArray]) => {
				if (!xmlString) {
					this.marcFields = [];

					return;
				}
				this.updateMarcFields(xmlString, allowedTagsArray);
			},
		);
	}

	// ✅ Méthode pour mettre à jour allowedTags
	public updateAllowedTags(): void {
		if (this.allowedTags$.value.length > 0) {
			this.allowedTags$.next([]);
		} else {
			//on récupère toutes les clés de MARC_STRUCTURE et on les mets dans un tableau pour les afficher dans le html
			this.allowedTags$.next(MARC_STRUCTURE_KEY);
		}
	}

	private updateMarcFields(
		xmlString: string,
		allowedTagsArray: string[],
	): void {
		const xmlRecord = new DOMParser().parseFromString(xmlString, 'text/xml');
		const record: Element = xmlRecord.getElementsByTagName('record')[0];

		if (!record) {
			this.marcFields = [];

			return;
		}

		const fields: Element[] = Array.from(record.childNodes).filter(
			(node): node is Element => node.nodeType === Node.ELEMENT_NODE,
		);
		const filteredFields =
			allowedTagsArray.length > 0
				? fields.filter((field) =>
						allowedTagsArray.includes(field.getAttribute('tag') ?? ''),
					)
				: fields;

		this.marcFields = filteredFields.map((field) => {
			const entry: xmlEntry = {
				change: '',
				tag: '',
				ind1: '',
				ind2: '',
				value: [],
			};

			if (field.tagName === 'leader') {
				entry.change = 'NONE';
				entry.tag = 'LDR';
				entry.ind1 = ' ';
				entry.ind2 = ' ';
				entry.value = [
					{ code: '', value: (field.textContent ?? '').replace(/ /g, '#') },
				];

				return entry;
			}

			const tag: string = field.getAttribute('tag') ?? '';

			entry.tag = tag;

			if (field.tagName === 'controlfield') {
				entry.ind1 = ' ';
				entry.ind2 = ' ';
				entry.value = [
					{ code: '', value: (field.textContent ?? '').replace(/ /g, '#') },
				];

				return entry;
			}

			if (field.tagName === 'datafield') {
				entry.ind1 = field.getAttribute('ind1') ?? '';
				entry.ind2 = field.getAttribute('ind2') ?? '';

				const valueMap: { code: string; value: string }[] = [];

				Array.from(field.childNodes)
					.filter(
						(node): node is Element => node.nodeType === Node.ELEMENT_NODE,
					)
					.forEach((subfield) => {
						valueMap.push({
							code: subfield.getAttribute('code') ?? '',
							value: subfield.textContent ?? '',
						});
					});
				entry.value = valueMap;
			}

			return entry;
		});
	}
}
