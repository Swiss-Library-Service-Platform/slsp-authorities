import { computed, inject, Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IdrefRecords, idrefSearch, MARC_STRUCTURE } from '../models/idref-model';
import { xmlEntry } from '../models/bib-records';
import { TranslateService } from '@ngx-translate/core';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';

@Injectable({ providedIn: 'root' })
export class IdrefService {
	// resultat de la recherche idref
	public idrefResult = signal<IdrefRecords | undefined>(undefined);
	public NZSelectedEntry = signal<xmlEntry | undefined>(undefined);
	public idrefAuthorityDetail = signal<Document| undefined>(undefined)

	//concaténation des strings des subfields 
	public flattenedValue = computed(() =>
		this.NZSelectedEntry()?.value.map((v) => `$$${v.code} ${v.value}`).join(' '),
	);

	private translate = inject(TranslateService);
	private alert = inject(AlertService);
	private http = inject(HttpClient);
	private solr = '/Sru/Solr';

	public constructor() {
		//pour logger facilement
		effect(() => {
			console.log("The current NZSelectedEntry is: ", this.NZSelectedEntry());
		})

		effect(() => {
			console.log("The current idrefResult is : ", this.idrefResult());
		})
	}

	//permet de faire des recherches génériques dans idref (peut-être à améliorer car pour le moment on ne peut pas ajouter d'autres options que wt)
	public searchAuthorities(query: string): Observable<IdrefRecords> {
		const params = {
			q: query,
			wt: 'json',
			sort: "score desc",
			version: "2.2",
			start: "0",
			rows: "30",
			indent: "on",
			fl: "ppn_z,recordtype_z,affcourt_z"


		};

		return this.http.get<IdrefRecords>(environment.idrefUrl + this.solr, {
			params,
		});
	}
	public searchWithPPN(ppn: string): Observable<Document> {
		//this.searchAuthorities(`ppn_z:${ppn}`).subscribe({next: r => this.idrefResult.set(r)})

		return this.http.get(`${environment.idrefUrl}/${ppn}.xml`, { responseType: 'text' }).pipe(
			map(xmlString => {
				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

				return xmlDoc;
			}))

	}

	public searchFromQuery(query: string): void {

		this.searchAuthorities(query).subscribe({ next: r => this.idrefResult.set(r),error: e => this.alert.error(this.translate.instant('error.httpError'+e), { autoClose: true })})
	}

	public calculatedSearch(searchParams: idrefSearch | undefined): void {
		const query = this.buildQuery(searchParams);

		this.searchAuthorities(query).subscribe({ next: r => this.idrefResult.set(r) })
	}

	//permet de récuperer la strucutre lié 
	public getMarcStructure():idrefSearch | undefined {

		const codes: string[] = [];
		const tag= this.NZSelectedEntry()?.tag;
		const ind1 = this.NZSelectedEntry()?.ind1;
		const ind2 = this.NZSelectedEntry()?.ind2;
		const value = this.NZSelectedEntry()?.value;

		value?.forEach((subfield) =>
			codes.push(subfield.code.replace('$$', '')),
		);

		const subfieldsStr = codes.sort().join(',');
		let result = MARC_STRUCTURE.get(`${tag}|${ind1}${ind2}|${subfieldsStr}`);

		if (result) {
			console.log('result: ', result);

			return result;
		} else {
			//si pas de subfields on regarde les indicateurs
			result = MARC_STRUCTURE.get(`${tag}|${ind1}${ind2}`);

			if (result) {
				console.log('result: ', result);

				return result;
			} else if ((result = MARC_STRUCTURE.get(`${tag}|  `))) {
				console.log('result: ', result);

				return result;
			} else {
				console.error('il ny a pas de mapping associé');

				return;
			}
		}
	}

	//fonction qui renvoie la chaine de charactere qui permettra de faire le recherche via Solr
	private buildQuery(searchParams: idrefSearch | undefined): string {
		let query = "";
		const recordTypes = searchParams?.recordtypes;
		const filter = searchParams?.filters;

		if (filter && filter.length > 1) {
			console.error("Pas encore développé")
		} else if (filter && recordTypes) {
			query = `${filter[0]}:${this.NZSelectedEntry()?.value[0].value} AND recordtype_z:${recordTypes[0]}`;

			return query
		}
		console.error("il n'y a pas de filtre, il y a eu un problème")

		return query;
	}
}
