import { Component, input, ViewChild} from '@angular/core';
import { BiblioRecordComponent } from '../biblio-record/biblio-record.component';
import { Bib } from '../../models/bib-records';
import { tagGroups } from '../../models/idref-model';

//Composant central de la cloudapp, il affiche le composant de recherche sur idref, le composant d'affichage des notices bibliographique de la NZ et le composant d'affichage des notices d'authorité de idref
@Component({
	selector: 'app-entity-detail',
	templateUrl: './entity-detail.component.html',
	styleUrl: './entity-detail.component.scss',
})
export class EntityDetailComponent {
	@ViewChild(BiblioRecordComponent) public bibRecord!: BiblioRecordComponent
	public entity = input.required<Bib | undefined>();

	public reset(): void{
		//TODO: trouver un moyen de mettre l'entité à nullpour que le composant main n'affiche plus celui ci
	}

	public updateAllowedTags(): void {
		this.bibRecord.updateAllowedTags();
	}
	

	public getColorForTag(tag: string): string {
		for (const group of Object.values(tagGroups)) {
			if (group.tags.includes(tag)) {
				return group.color;
			}
		}

		return '#f5f5f5'; // couleur par défaut
	}
}
