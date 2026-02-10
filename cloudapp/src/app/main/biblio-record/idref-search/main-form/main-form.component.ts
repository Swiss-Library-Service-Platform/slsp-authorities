/* eslint-disable @typescript-eslint/member-ordering */
import { Component, inject, effect, input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AlertService, CloudAppEventsService } from '@exlibris/exl-cloudapp-angular-lib';
import { catchError, of, switchMap, tap } from 'rxjs';
import { Bib, DataField } from '../../../../models/bib-records';
import { IdrefService } from '../../../../services/idref.service';
import { IdrefSearchService } from '../idref-search.service';
import { BiblioReferencedEntryService } from '../../../../services/biblio-referenced-entry.service';
import { NZQueryService } from '../../../../services/nzquery.service';
import { StringUtils } from '../../../../utils/stringUtils';
import { SearchMode } from '../model';

@Component({
	selector: 'app-main-form',
	templateUrl: './main-form.component.html',
	styleUrl: './main-form.component.scss',
})
export class MainFormComponent {
	public entity = input.required<Bib | undefined>();

	public loading = false;
	public searchForm: FormGroup;

	private idrefService = inject(IdrefService);
	private idrefSearchService = inject(IdrefSearchService);
	private nzQueryService = inject(NZQueryService);
	private eventsService = inject(CloudAppEventsService);
	private translate = inject(TranslateService);
	private alert = inject(AlertService);
	private referenceCurrentField = inject(BiblioReferencedEntryService);
	private fb = inject(FormBuilder);


  public readonly searchMode = this.idrefSearchService.searchMode;
	public readonly NZSelectedEntry = this.idrefSearchService.NZSelectedEntry;
	public readonly flattenedValue = this.idrefSearchService.flattenedValue;

	public constructor() {
		this.searchForm = this.fb.group({
			tag: [''],
			ind1: [''],
			ind2: [''],
			subfields: [''],
		});

		effect(() => {
			const entry = this.NZSelectedEntry();

			if (entry) {
				this.searchForm.patchValue(
					{
						tag: entry.tag,
						ind1: entry.ind1,
						ind2: entry.ind2,
						subfields: this.flattenedValue(),
					},
					{ emitEvent: false },
				);
			}
		});
	}

	public onSearch(): void {
		this.loading = true;
		this.idrefSearchService.setNZSelectedEntry(this.searchForm.value);

		const values = this.searchForm.value as {
			tag: string;
			ind1: string;
			ind2: string;
			subfields: string;
		};
		const subfields = values.subfields;		const regex = /\$\$0 \(IDREF\)(\d+)/;
		const match = subfields.match(regex);

		if (match) {
			const ppn = match[1];

			this.idrefService.searchWithPPN(ppn);
		} else {
			const searchParams = this.idrefService.getMarcStructure();

			this.idrefService.calculatedSearch(searchParams);
		}

		this.loading = false;
	}

	public addrecord(): void {
		const values = this.searchForm.value;
		const reference = this.referenceCurrentField.getSavedCurrentEntry();

		if (!reference) {
			this.alert.error(this.translate.instant('idrefSearch.noSelectedEntry'), { delay: 1000 });

			return;
		}

		const formatedValues = {
			...values,
			subfields: StringUtils.parseSubfieldsString(values.subfields),
		} as DataField;

		// Premièrement, tenter de mettre à jour si le champ existe.
		// Si le champ n'est pas trouvé, on tente de le créer.
		this.nzQueryService
			.updateFieldIfExists(reference, formatedValues)
			.pipe(
				tap(() => this.alert.success(this.translate.instant('idrefSearch.recordAdded'), { delay: 1000 })),
				switchMap(() => this.eventsService.refreshPage()),
				catchError((err) => {
					if (err?.message === 'FIELD_NOT_FOUND') {
						// Champ non trouvé -> créer
						/*return this.nzQueryService.createFieldIfNotExists(reference, formatedValues).pipe(
							tap(() => this.alert.success(this.translate.instant('idrefSearch.recordAdded'), { delay: 1000 })),
							switchMap(() => this.eventsService.refreshPage()),
							catchError((err2) => {
								this.alert.warn(this.translate.instant('idrefSearch.acceptRefreshModal'), { delay: 1000 });
								console.error('Erreur lors de la création du champ:', err2);

								return of(null);
							}),
						);*/
					}

					this.alert.warn(this.translate.instant('idrefSearch.acceptRefreshModal'), { delay: 1000 });
					console.error('Erreur updateFieldIfExists:', err);

					return of(null);
				}),
			)
			.subscribe();
	}

	/**
	 * Expose une méthode publique qui met à jour le champ uniquement s'il existe.
	 */
	public updateFieldIfFound(): void {
		const values = this.searchForm.value;
		const reference = this.referenceCurrentField.getSavedCurrentEntry();

		if (!reference) {
			this.alert.error(this.translate.instant('idrefSearch.noSelectedEntry'), { delay: 1000 });

			return;
		}

		const formatedValues = {
			...values,
			subfields: StringUtils.parseSubfieldsString(values.subfields),
		} as DataField;

		this.nzQueryService.updateFieldIfExists(reference, formatedValues).pipe(
			tap(() => this.alert.success(this.translate.instant('idrefSearch.recordAdded'), { delay: 1000 })),
			switchMap(() => this.eventsService.refreshPage()),
			catchError((err) => {
				this.alert.warn(this.translate.instant('idrefSearch.acceptRefreshModal'), { delay: 1000 });
				console.error('Erreur updateFieldIfExists:', err);

				return of(null);
			}),
		).subscribe();
	}

	/**
	 * Expose une méthode publique qui crée le champ uniquement s'il n'existe pas.
	 */
	public createFieldIfNotFound(): void {
		const values = this.searchForm.value;
		const reference = this.referenceCurrentField.getSavedCurrentEntry();

		if (!reference) {
			this.alert.error(this.translate.instant('idrefSearch.noSelectedEntry'), { delay: 1000 });

			return;
		}

		const formatedValues = {
			...values,
			subfields: StringUtils.parseSubfieldsString(values.subfields),
		} as DataField;

		this.nzQueryService.createFieldIfNotExists(reference, formatedValues).pipe(
			tap(() => this.alert.success(this.translate.instant('idrefSearch.recordAdded'), { delay: 1000 })),
			switchMap(() => this.eventsService.refreshPage()),
			catchError((err) => {
				this.alert.warn(this.translate.instant('idrefSearch.acceptRefreshModal'), { delay: 1000 });
				console.error('Erreur createFieldIfNotExists:', err);

				return of(null);
			}),
		).subscribe();
	}

	public to902(): void {
		this.setSearchMode(SearchMode.Add902);
	}

	public clear(): void {
		this.setSearchMode(SearchMode.AddField);
		this.NZSelectedEntry.set(undefined);
		this.searchForm.reset();
		this.alert.info(this.translate.instant('idrefSearch.notImplemented'), { delay: 1000 });
	}

	public setSearchMode(mode: SearchMode): void {
		this.idrefSearchService.searchMode.set(mode);
	}
}
