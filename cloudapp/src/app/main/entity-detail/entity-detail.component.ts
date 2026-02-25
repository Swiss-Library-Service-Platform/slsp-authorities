import { Component, computed, inject, ViewChild} from '@angular/core';
import { BiblioRecordComponent } from '../biblio-record/biblio-record.component';
import { tagGroups } from '../../models/idref.model';
import { MainFacadeService } from '../main-facade.service';

// Composant central de la Cloud App : recherche IdRef, notice bibliographique NZ et notice d'autorité IdRef.
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

		return '#f5f5f5'; // Couleur par défaut.
	}

  public onSaveSuccess(): void {
    this.facade.refreshSelectedEntityDetails();
  }

}
