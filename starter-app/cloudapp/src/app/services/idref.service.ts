import { computed, inject, Injectable, signal,effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { IdrefRecords } from '../models/idref-model';
import { xmlEntry } from '../models/bib-records';

@Injectable({ providedIn: 'root' })
export class IdrefService {
	// resultat de la recherche idref
	public idrefResult = signal<IdrefRecords | undefined>(undefined);
	public NZSelectedEntry = signal<xmlEntry | undefined>(undefined);
	
	//concaténation des strings des subfields 
	public flattenedValue = computed(() =>
		this.NZSelectedEntry()?.value.map((v) => `$$${v.code} ${v.value}`).join(' '),
	);

	private http = inject(HttpClient);
	private solr = '/Sru/Solr';

	public constructor(){
		//pour logger facilement
		effect(()=>{
			console.log("The current NZSelectedEntry is: ", this.NZSelectedEntry());
		})
	}

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
	public searchWithPPN(ppn: string): void{
		this.searchAuthorities(`ppn_z:${ppn}`).subscribe({next: r => this.idrefResult.set(r)})
	}
	//recherche selon le ppn de inscrit dans la notice.
	//TODO: c'est bien dans le searchForPPN que l'on choisit le type de recherhe que l'on va faire
	/*public searchForPPN(entry: {
		code: string;
		value: string;
	}): Observable<IdrefRecords> {
		const ppn = entry.value.replace('(IDREF)', '');

		return this.searchAuthorities(`ppn_z:${ppn}`);
	}*/
}
