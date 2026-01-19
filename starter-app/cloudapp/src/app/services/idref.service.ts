import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
	IDREF_MAPPING,
	IdRefMapping,
	IdrefRecords,
	IdrefResolution,
} from '../models/idref-model';
import { xmlEntry } from '../models/bib-records';

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
	//TODO: c'est bien dans le searchForPPN que l'on hoisit le type de recherhe que l'on va faire
	public searchForPPN(entry: xmlEntry): Observable<IdrefRecords> {
		const idRefEntry = entry.value.find((v) => v.code === '0');

		//si on trouve un ppn relié à idref, on fait une recherche selon ce PPN
		if (idRefEntry && idRefEntry.value.includes('(IDREF)')) {
			const ppn = idRefEntry.value.replace('(IDREF)', '');

			return this.searchAuthorities(`ppn_z:${ppn}`);
			//sinon on fait une recherche de pertinance
		} else {
			//console.log(this.resolveIdrefByTag(entry.tag, entry.ind1, entry.ind2));
      console.log(this.resolveIdrefByTag(entry.tag,entry.ind1,entry.ind2));

			return this.searchAuthorities('ppn_z:');
		}
	}

	private resolveIdrefByTag(
		tag: string,
		ind1?: string,
		ind2?: string,
		presentSubfields?: Set<string>,
	): IdrefResolution[] {
		const normTag = (tag || '').trim();
		const results: IdrefResolution[] = [];

		(Object.keys(IDREF_MAPPING) as Array<keyof typeof IDREF_MAPPING>).forEach(
			(typeKey) => {
				const def: IdRefMapping = IDREF_MAPPING[typeKey];
				// Filtrer les blocs "marc" par tag (et, si fournis, indicateurs)
				const applicable = def.marc.filter(
					(m) =>
						m.tag === normTag &&
						(ind1 === undefined || ind1 === m.indicators[0]) &&
						(ind2 === undefined || ind2 === m.indicators[1]),
				);

				if (applicable.length > 0) {
					// Scorer la pertinence en fonction des sous-champs réellement présents
					// + petite heuristique pour les cas ambigus (p.ex. 650 sujet vs 650 marque vs 655 forme/genre)
					let bestScore = 0;
					const matched: Array<{
						tag: string;
						indicators: [string, string];
						subfields: string[];
					}> = [];

					applicable.forEach((m) => {
						let score = 1; // match sur tag/indicateurs

						if (presentSubfields && presentSubfields.size) {
							// +1 par sous-champ "utile" qui est réellement présent
							m.subfields.forEach((sf) => {
								if (presentSubfields.has(sf)) score += 1;
							});
						}
						matched.push(m);
						if (score > bestScore) bestScore = score;
					});

					results.push({
						typeKey,
						label: def.label,
						filters: def.filters,
						recordtypes: def.recordtypes,
						score: bestScore,
						matchedMarcDefs: matched,
					});
				}
			},
		);

		// Cas communs où le même tag peut retourner plusieurs types :
		// - 650 : subject (j/t) vs trademark (d) → si 'a' seul + motif "®" ou noms de marque connus, on peut surpondérer "trademark"
		// - 600 : nameTitle (présence de $t) vs person (pas de $t)
		if (presentSubfields && presentSubfields.has('t')) {
			// Favorise les types "nameTitle" lorsque $t est présent sur 600
			results.forEach((r) => {
				if (r.typeKey === 'nameTitle') r.score += 2;
			});
		}

		// Tri décroissant par score pour que le meilleur match soit en premier
		results.sort((a, b) => b.score - a.score);

		return results;
	}
}
