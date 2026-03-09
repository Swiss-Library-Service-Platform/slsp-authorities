import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { BibRecordField } from '../../models/bib-record.model';
import { MARC_STRUCTURE_KEY } from '../../models/idref.model';
import { BiblioReferencedEntryService } from '../../services/biblio-referenced-entry.service';
import { IdrefService } from '../../services/idref.service';
import { SearchMode, SearchMode902 } from '../../models/search-form.model';
import { IdrefRecordService } from '../entity-detail/idref-record/idref-record.service';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { BiblioRecordMarcService } from './domain/biblio-record-marc.service';
import { StringUtils } from '../../utils/string-utils';
import { RecordService } from '../../services/record.service';
import { BibRecordFieldModifierService } from './search/bib-record-field-modifier.service';

// Composant d'affichage des notices bibliographiques provenant de la NZ.
@Component({
	selector: 'app-biblio-record',
	templateUrl: './biblio-record.component.html',
	styleUrl: './biblio-record.component.scss',
})
export class BiblioRecordComponent {
	public lastSavedSelectedBibRecordField: BibRecordField | null = null;
	public selectedEntityDetails = computed(() => this.recordService.selectedEntityDetails());
	public dialog = inject(MatDialog);
	private readonly idrefAllowedTags = new Set(MARC_STRUCTURE_KEY);
	private bibRecordFieldModifierService = inject(BibRecordFieldModifierService);
	private idrefService = inject(IdrefService);
	private referenceCurrentField = inject(BiblioReferencedEntryService);
	private idrefRecordService = inject(IdrefRecordService);
	private recordService = inject(RecordService);
	private alertService = inject(AlertService);
	private translate = inject(TranslateService);
	private marcService = inject(BiblioRecordMarcService);
	// eslint-disable-next-line @typescript-eslint/member-ordering
	public readonly highlightedUpdatedField = this.bibRecordFieldModifierService.highlightedUpdatedField;
	// Signaux des tags MARC autorisés.
	private allowedTags = signal(MARC_STRUCTURE_KEY);

	// eslint-disable-next-line @typescript-eslint/member-ordering
	public  bibRecordFieldsFromSelectedEntityDetails = computed(() => {
			const anie = this.recordService.selectedEntityDetails()?.anies[0];

			if(typeof anie === 'string'){
				return this.marcService.updateMarcFields(anie, this.allowedTags());
			}

			return [];
		});

	// Retourne les tags de la notice bibliographique utilisables pour la recherche.
	public getIdrefAllowedTags(): string[] {
		return MARC_STRUCTURE_KEY;
	}

	public getMarcRowStatusClass(entry: BibRecordField): string | null {
		return this.marcService.getMarcRowStatusClass(entry, this.idrefAllowedTags);
	}

	public isUpdatedField(entry: BibRecordField): boolean {
		const updatedField = this.highlightedUpdatedField();

		if (!updatedField) {
			return false;
		}

		return StringUtils.areDataFieldsEqual(updatedField, entry);
	}

	public pushToInput(bibRecordField: BibRecordField): void {
		this.lastSavedSelectedBibRecordField = bibRecordField; //sauvegarde pour l'affichage
		this.idrefService.selectedFieldFromBibRecord.set({ ...bibRecordField });
		this.bibRecordFieldModifierService.closeTo902();
		this.bibRecordFieldModifierService.searchMode902.set(SearchMode902.Add902);

		// Gère le cas particulier du champ 902.
		if (bibRecordField.tag === '902') {
			this.bibRecordFieldModifierService.searchMode902.set(SearchMode902.Modify902);
			this.bibRecordFieldModifierService.showTo902();
		}
		this.bibRecordFieldModifierService.searchMode.set(SearchMode.Update);
	}

	public saveCurrentEntry(bibRecordField: BibRecordField): void {
		this.referenceCurrentField.setSavedCurrentEntry(bibRecordField);
	}

	public searchIdref(): void {
		this.idrefRecordService.setFormValuesFromEntry();
	}

	public deleteField(bibRecordField: BibRecordField): void {
		if (!this.marcService.isDeleteAllowed(bibRecordField)) {
			this.alertService.warn(this.translate.instant('search.deleteNotAllowed'), { delay: 3000, autoClose: true });

			return;
		}

		const dialogRef = this.dialog.open(DeleteDialogComponent, {
			width: '50px',
			data: { bibRecordField },
		});

		// Aucune action supplémentaire après la fermeture du dialogue.
		dialogRef.afterClosed().subscribe();
	}

	// Met à jour la liste des tags affichés.
	public showDetails(): void {
		if (this.allowedTags().length > 0) {
			this.allowedTags.set([]);
		} else {
			// Récupère toutes les clés de MARC_STRUCTURE pour les afficher dans le template.
			this.allowedTags.set(MARC_STRUCTURE_KEY);
		}
	}
}
