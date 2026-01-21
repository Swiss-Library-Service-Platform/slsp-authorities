import { Component, inject, input, OnInit } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
	BehaviorSubject,
	combineLatest,
	distinctUntilChanged,
	map,
} from 'rxjs';
import { Bib, xmlEntry } from '../models/bib-records';
import { IdrefService } from '../services/idref.service';
import { getIdrefRecordsFromXmlentry, IdrefRecords, MARC_STRUCTURE_KEY } from '../models/idref-model';
import { tagGroups } from '../models/idref-model';

@Component({
	selector: 'app-entity-detail',
	templateUrl: './entity-detail.component.html',
	styleUrl: './entity-detail.component.scss',
})
export class EntityDetailComponent implements OnInit {
	public entity = input.required<Bib | null>();
	public entity$ = toObservable(this.entity);
	public idrefResult: IdrefRecords | undefined;

	public entityAnnies$ = this.entity$.pipe(
		map((e) => e?.anies[0] ?? null),
		distinctUntilChanged(),
	);
	public entityTitle$ = this.entity$.pipe(
		map((e) => e?.title ?? null),
		distinctUntilChanged(),
	);
	public entityMms_id$ = this.entity$.pipe(
		map((e) => e?.mms_id ?? null),
		distinctUntilChanged(),
	);

	public marcFields: xmlEntry[] = [];
	public title: string | null = null;
	public mms_id: string | null = null;


	// ✅ BehaviorSubject pour allowedTags
	private allowedTags$ = new BehaviorSubject<string[]>(MARC_STRUCTURE_KEY);
	private idrefService = inject(IdrefService);

	//TODO: modifier les allowed tags pour les affiner
	//retourne les tag de la notice bibliographique sur lesquels on peut faire une recherche
	public getIdrefAllowedTags(): string[]{
		return MARC_STRUCTURE_KEY;
	}
	public reset(): void{
		//TODO: trouver un moyen de mettre l'entité à nullpour que le composant main n'affiche plus celui ci
	}
	

	public getColorForTag(tag: string): string {
		for (const group of Object.values(tagGroups)) {
			if (group.tags.includes(tag)) {
				return group.color;
			}
		}

		return '#f5f5f5'; // couleur par défaut
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


		// Souscriptions pour title et mms_id
		this.entityTitle$.subscribe((title) => (this.title = title));
		this.entityMms_id$.subscribe((mms_id) => (this.mms_id = mms_id));
	}

	// ✅ Méthode pour mettre à jour allowedTags
	public updateAllowedTags(): void {
		if(this.allowedTags$.value.length > 0){
			this.allowedTags$.next([]);
		}else{
			//on récupère toutes les clés de MARC_STRUCTURE et on les mets dans un tableau pour les afficher dans le html
			this.allowedTags$.next(MARC_STRUCTURE_KEY);
		}
	}


	public searchForTag(entry: xmlEntry): void {
		console.log(entry);

		//console.log(entry.value.find(v => v.code === '0')?.value.replace("(IDREF)", ""));
		const idRefEntry = entry.value.find((v) => v.code === '0');

		//si on trouve un ppn relié à idref, on fait une recherche selon ce PPN
		if (idRefEntry && idRefEntry.value.includes('(IDREF)')) {		
			this.idrefService.searchForPPN(idRefEntry).subscribe((response) => {
			this.idrefResult = response;
			console.log('Données reçues :', this.idrefResult);
		});
		}else{
			const idrefEqu = getIdrefRecordsFromXmlentry(entry)

		}
	}

	private updateMarcFields(xmlString: string, allowedTagsArray: string[]): void {
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
