import { Component, computed, inject, ViewChild} from '@angular/core';
import { BiblioRecordComponent } from '../biblio-record/biblio-record.component';
import { tagGroups } from '../../models/idref.model';
import { MainFacadeService } from '../main-facade.service';
import { RecordService } from '../../services/record.service';

// Composant central de la Cloud App : recherche IdRef, notice bibliographique NZ et notice d'autorité IdRef.
@Component({
	selector: 'app-entity-detail',
	templateUrl: './entity-detail.component.html',
	styleUrl: './entity-detail.component.scss',
})
export class EntityDetailComponent {
	
	@ViewChild(BiblioRecordComponent) public bibRecord!: BiblioRecordComponent

	private facade = inject(MainFacadeService);
	private recordService = inject(RecordService);
  	// eslint-disable-next-line @typescript-eslint/member-ordering
  	public selectedEntityDetails = computed(() => this.recordService.selectedEntityDetails());

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
