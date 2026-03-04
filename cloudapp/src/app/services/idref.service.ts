import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, take, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { IdrefRecords, MARC_STRUCTURE, MarcStructureValues } from '../models/idref.model';
import { BibRecordField } from '../models/bib-record.model';
import { CloudAppSettingsService } from '@exlibris/exl-cloudapp-angular-lib';
import { Settings } from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class IdrefService {
	// Résultat de la recherche IdRef.
	public idrefResult = signal<IdrefRecords | undefined>(undefined);
	public selectedFieldFromBibRecord = signal<BibRecordField | undefined>(undefined);
	public idrefAuthorityDetail = signal<Document | undefined>(undefined);

	// Concaténation des sous-champs en une chaîne unique.
	public flattenedValue = computed(() =>
		this.selectedFieldFromBibRecord()
			?.subfields.map((v) => `$$${v.code} ${v.value}`)
			.join(' ')
	);

	private http = inject(HttpClient);
	private settingsService = inject(CloudAppSettingsService);
	private solr = '/Sru/Solr';
	private searchRowNumber = 10;

	public constructor() {
		this.settingsService.get().pipe(take(1)).subscribe((settings) => {
			this.searchRowNumber = (settings as Settings).searchRowNumber;
		});
	}

	// Lance une recherche générique dans IdRef.
	public searchAuthorities(query: string): Observable<IdrefRecords> {
		const params = {
			q: query,
			wt: 'json',
			sort: 'score desc',
			version: '2.2',
			start: '0',
			rows: `${this.searchRowNumber}`,
			indent: 'on',
			fl: 'ppn_z,recordtype_z,affcourt_z',
		};

		return this.http.get<IdrefRecords>(environment.idrefUrl + this.solr, {
			params,
		});
	}
	public searchWithPPN(ppn: string): Observable<Document> {
		// this.searchAuthorities(`ppn_z:${ppn}`).subscribe({ next: r => this.idrefResult.set(r) });

		return this.http.get(`${environment.idrefUrl}/${ppn}.xml`, { responseType: 'text' }).pipe(
			map((xmlString) => {
				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

				return xmlDoc;
			})
		);
	}

	public searchFromQuery$(query: string): Observable<IdrefRecords> {
		return this.searchAuthorities(query).pipe(
			tap((r) => this.idrefResult.set(r))
		);
	}

	public loadAuthorityDetail$(ppn: string): Observable<Document> {
		return this.searchWithPPN(ppn).pipe(
			tap((detail) => this.idrefAuthorityDetail.set(detail))
		);
	}

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
		this.idrefResult.set(undefined);
		this.selectedFieldFromBibRecord.set(undefined);
		this.idrefAuthorityDetail.set(undefined);
	}
}
