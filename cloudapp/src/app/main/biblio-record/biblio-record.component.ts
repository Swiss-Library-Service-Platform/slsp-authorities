import { Component, computed, inject, input, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { BibRecordField, NzBibRecord } from '../../models/bib-record.model';
import { MARC_STRUCTURE_KEY } from '../../models/idref.model';
import { BiblioReferencedEntryService } from '../../services/biblio-referenced-entry.service';
import { IdrefService } from '../../services/idref.service';
import { SearchService } from './search/search.service';
import { SearchMode, SearchMode902 } from './search/model';
import { IdrefRecordService } from '../entity-detail/idref-record/idref-record.service';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { BiblioRecordMarcService } from './domain/biblio-record-marc.service';

// Composant d'affichage des notices bibliographiques provenant de la NZ.
@Component({
	selector: 'app-biblio-record',
	templateUrl: './biblio-record.component.html',
	styleUrl: './biblio-record.component.scss',
})
export class BiblioRecordComponent {
	public selectedBibRecordField: BibRecordField | null = null;
	public selectedEntity = input.required<NzBibRecord | undefined>();
	public dialog = inject(MatDialog);
	private readonly idrefAllowedTags = new Set(MARC_STRUCTURE_KEY);
	private searchService = inject(SearchService);
	private idrefService = inject(IdrefService);
	private referenceCurrentField = inject(BiblioReferencedEntryService);
	private idrefRecordService = inject(IdrefRecordService);
	private alertService = inject(AlertService);
	private translate = inject(TranslateService);
	private marcService = inject(BiblioRecordMarcService);
	// Signaux des tags MARC autorisés.
	private allowedTags = signal(MARC_STRUCTURE_KEY);

	// eslint-disable-next-line @typescript-eslint/member-ordering
	public  BibRecordFields = computed(() => {
			const anie = this.selectedEntity()?.anies[0];

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

	public pushToInput(entry: BibRecordField): void {
		this.selectedBibRecordField = entry;
		this.idrefService.nzSelectedEntry.set({ ...entry });
		this.searchService.closeTo902();
		this.searchService.searchMode902.set(SearchMode902.Add902);

		// Gère le cas particulier du champ 902.
		if (entry.tag === '902') {
			this.searchService.searchMode902.set(SearchMode902.Modify902);
			this.searchService.showTo902();
		}
		this.searchService.searchMode.set(SearchMode.Update);
	}

	public saveCurrentEntry(entry: BibRecordField): void {
		this.referenceCurrentField.setSavedCurrentEntry(entry);
	}

	public searchIdref(): void {
		this.idrefRecordService.setFormValuesFromEntry();
	}

	public deleteField(entry: BibRecordField): void {
		if (!this.marcService.isDeleteAllowed(entry)) {
			this.alertService.warn(this.translate.instant('search.deleteNotAllowed'), { delay: 3000, autoClose: true });

			return;
		}

		const dialogRef = this.dialog.open(DeleteDialogComponent, {
			width: '50px',
			data: { entry },
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
