import { inject, Injectable, signal } from '@angular/core';
import { IdrefRecords } from '../models/idref.model';
import { Observable, take, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CloudAppSettingsService } from '@exlibris/exl-cloudapp-angular-lib';
import { Settings } from '../models/settings.model';

@Injectable({
	providedIn: 'root',
})
export class IdrefSearchService {
	public idrefResult = signal<IdrefRecords | undefined>(undefined);
	private searchRowNumber = 10;
	private http = inject(HttpClient);
	private settingsService = inject(CloudAppSettingsService);
	private solr = '/Sru/Solr';

	public constructor() {
		this.settingsService
			.get()
			.pipe(take(1))
			.subscribe((settings) => {
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

	public searchFromQuery$(query: string): Observable<IdrefRecords> {
		return this.searchAuthorities(query).pipe(tap((r) => this.idrefResult.set(r)));
	}

	public reset(): void {
		this.idrefResult.set(undefined);
	}
}
