import { Component, computed, inject, ViewChild} from '@angular/core';
import { BiblioRecordComponent } from '../biblio-record/biblio-record.component';
import { tagGroups } from '../../models/idref-model';
import { MainFacadeService } from '../main-facade.service';

//Composant central de la cloudapp, il affiche le composant de recherche sur idref, le composant d'affichage des notices bibliographique de la NZ et le composant d'affichage des notices d'authorité de idref
@Component({
	selector: 'app-entity-detail',
	templateUrl: './entity-detail.component.html',
	styleUrl: './entity-detail.component.scss',
})
export class EntityDetailComponent {
	
	@ViewChild(BiblioRecordComponent) public bibRecord!: BiblioRecordComponent

	private facade = inject(MainFacadeService);
  	// eslint-disable-next-line @typescript-eslint/member-ordering
  	public selectedEntity = computed(() => this.facade.selectedEntityDetails());

	public updateAllowedTags(): void {
		this.bibRecord.showDetails();
	}
	

	public getColorForTag(tag: string): string {
		for (const group of Object.values(tagGroups)) {
			if (group.tags.includes(tag)) {
				return group.color;
			}
		}

		return '#f5f5f5'; // couleur par défaut
	}

  public onSaveSuccess(): void {
    this.facade.refreshSelectedEntityDetails();
  }

}
