/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
	selector: 'app-external',
	templateUrl: './external.component.html',
	styleUrls: ['./external.component.scss'],
})
export class ExternalComponent {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any;

	// eslint-disable-next-line @angular-eslint/prefer-inject
	constructor(private http: HttpClient) {}

	public search(): void {
		const url = 'https://www.idref.fr/Sru/Solr?q=persname_t:(albert%20AND%20einstein)&wt=json';

		this.http.get<any>(url).subscribe({
			next: (resp) => (this.data = resp),
			error: (err) => console.error('Erreur HTTP:', err),
		});
	}

	public searchIdRef(): void {
		const url = 'https://www.idref.fr/028714385.xml';

		this.http.get(url, { responseType: 'text' }).subscribe({
			next: (xmlString) => {
				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
				const name = xmlDoc.querySelector(
					'datafield[tag="200"] subfield[code="a"]',
				)?.textContent;

				console.log('Nom trouvé:', name);
        console.log('xmldoc trouvé:', xmlDoc);
			},
			error: (err) => console.error('Erreur IdRef:', err),
		});
	}
}
