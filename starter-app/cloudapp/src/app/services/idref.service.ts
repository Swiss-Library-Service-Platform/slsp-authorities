import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
	IdrefRecords,
} from '../models/idref-model';


@Injectable({ providedIn: 'root' })
export class IdrefService {
	private apiUrl = 'https://www.idref.fr/Solr'; // URL Solr IdRef
	private http = inject(HttpClient);
	private solr = '/Sru/Solr';

	//permet de faire des recherches génériques dans idref (peut-être à améliorer car pour le moment on ne peut pas ajouter d'autres options que wt)
	public searchAuthorities(query: string): Observable<IdrefRecords> {
		const params = {
			q: query,
			wt: 'json',
		};

		return this.http.get<IdrefRecords>(environment.idrefUrl + this.solr, {
			params,
		});
	}
	//recherche selon le ppn de inscrit dans la notice.
	//TODO: c'est bien dans le searchForPPN que l'on choisit le type de recherhe que l'on va faire
	public searchForPPN(entry: { code: string; value: string; }): Observable<IdrefRecords> {

			const ppn = entry.value.replace('(IDREF)', '');

			return this.searchAuthorities(`ppn_z:${ppn}`);
	}
}
