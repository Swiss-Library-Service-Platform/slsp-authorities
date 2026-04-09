import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { BibRecordField } from '../../models/bib-record.model';
import { MARC_STRUCTURE_KEY } from '../../models/idref.model';
import { EditingFieldBackupService } from '../../services/editing-field-backup.service';
import { SelectedBibFieldService } from '../../services/selected-bib-field.service';
import { SearchMode, SearchMode902 } from '../../models/search-form.model';
import { IdrefQueryBuilderService } from '../entity-detail/idref-search-results/idref-query-builder.service';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { BiblioRecordMarcService } from './domain/biblio-record-marc.service';
import { StringUtils } from '../../utils/string-utils';
import { SubfieldSixLinkUtils } from '../../utils/subfield-six-link-utils';
import { SelectedEntityStateService } from '../../services/selected-entity-state.service';
import { BibRecordFieldModifierService } from './marc-field-editor/bib-record-field-modifier.service';

// Composant d'affichage des notices bibliographiques provenant de la NZ.
@Component({
	selector: 'app-biblio-record',
	templateUrl: './biblio-record.component.html',
	styleUrl: './biblio-record.component.scss',
})
export class BiblioRecordComponent {
	public lastSavedSelectedBibRecordField: BibRecordField | null = null;
	public selectedEntityDetails = computed(() => this.selectedEntityState.selectedEntityDetails());
	public dialog = inject(MatDialog);
	private readonly idrefAllowedTags = new Set(MARC_STRUCTURE_KEY);
	private bibRecordFieldModifierService = inject(BibRecordFieldModifierService);
	private selectedBibFieldService = inject(SelectedBibFieldService);
	private editingFieldBackup = inject(EditingFieldBackupService);
	private idrefQueryBuilder = inject(IdrefQueryBuilderService);
	private selectedEntityState = inject(SelectedEntityStateService);
	private alertService = inject(AlertService);
	private translate = inject(TranslateService);
	private marcService = inject(BiblioRecordMarcService);
	// eslint-disable-next-line @typescript-eslint/member-ordering
	public readonly highlightedUpdatedField = this.bibRecordFieldModifierService.highlightedUpdatedField;
	// Signaux des tags MARC autorisés.
	private allowedTags = signal(MARC_STRUCTURE_KEY);
	public isCompleteView = computed(() => this.allowedTags().length > 0);

	// eslint-disable-next-line @typescript-eslint/member-ordering
	public  bibRecordFieldsFromSelectedEntityDetails = computed(() => {
			const anie = this.selectedEntityState.selectedEntityDetails()?.anies[0];

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

	public getEditIcon(bibRecordField: BibRecordField): string {
		const statusClass = this.getMarcRowStatusClass(bibRecordField);

		return statusClass === 'marc-row--status-other' ? 'search' : 'edit';
	}

	public isFullRowHighlight(entry: BibRecordField): boolean {
		return this.highlightedUpdatedField().some(
			(h) => h.mode === 'full' && StringUtils.areDataFieldsEqual(h.field, entry)
		);
	}

	public isSubfieldHighlight(entry: BibRecordField, subfieldCode: string): boolean {
		return this.highlightedUpdatedField().some(
			(h) => h.mode === 'subfield-only'
				&& h.subfieldCodes?.includes(subfieldCode)
				&& StringUtils.areDataFieldsEqual(h.field, entry)
		);
	}

	public pushToInput(bibRecordField: BibRecordField): void {
		this.lastSavedSelectedBibRecordField = bibRecordField; //sauvegarde pour l'affichage
		this.selectedBibFieldService.selectedFieldFromBibRecord.set({ ...bibRecordField });
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
		this.editingFieldBackup.setSavedCurrentEntry(bibRecordField);
	}

	public searchIdref(): void {
		this.idrefQueryBuilder.setFormValuesFromEntry();
	}

	public deleteField(bibRecordField: BibRecordField): void {
		if (!this.marcService.isDeleteAllowed(bibRecordField)) {
			this.alertService.warn(this.translate.instant('search.deleteNotAllowed'), { delay: 3000, autoClose: true });

			return;
		}

		const allDataFields = this.getCurrentDataFields();
		let linked880Fields: BibRecordField[] = [];
		let linkedOriginalField: BibRecordField | null = null;

		if (bibRecordField.tag === '880') {
			const original = SubfieldSixLinkUtils.findLinkedOriginalField(bibRecordField, allDataFields);

			if (original) {
				const sibling880s = SubfieldSixLinkUtils.findLinked880Fields(original, allDataFields);

				if (sibling880s.length <= 1) {
					linkedOriginalField = { ...original, change: '' } as BibRecordField;
				}
			}
		} else if (SubfieldSixLinkUtils.hasSubfield6(bibRecordField)) {
			linked880Fields = SubfieldSixLinkUtils.findLinked880Fields(bibRecordField, allDataFields)
				.map((f) => ({ ...f, change: '' }) as BibRecordField);
		}

		const dialogRef = this.dialog.open(DeleteDialogComponent, {
			width: '500px',
			data: { bibRecordField, linked880Fields, linkedOriginalField },
		});

		dialogRef.afterClosed().subscribe();
	}

	private getCurrentDataFields(): BibRecordField[] {
		const anie = this.selectedEntityState.selectedEntityDetails()?.anies[0];

		if (typeof anie !== 'string') {
			return [];
		}

		return StringUtils.xmlToMarcRecord(anie).dataFields.map(
			(f) => ({ ...f, change: '' }) as BibRecordField
		);
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
