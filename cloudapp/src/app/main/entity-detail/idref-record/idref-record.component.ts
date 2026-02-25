/* eslint-disable @typescript-eslint/member-ordering */
import { Component, computed, inject, Signal, ViewChild, signal, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Doc, IDREF_FILTER_MAP, IDREF_RECORDTYPE_TO_ICON_MAP } from '../../../models/idref-model';
import { IdrefService } from '../../../services/idref.service';
import { IdrefRecordService } from './idref-record.service';
import { CloudAppSettingsService } from '@exlibris/exl-cloudapp-angular-lib';
import { Settings } from '../../../models/settings.model';
import { IconService } from '../../../services/icon.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
	selector: 'app-idref-record',
	templateUrl: './idref-record.component.html',
	styleUrl: './idref-record.component.scss',
})
export class IdrefRecordComponent {
	public selectedDoc: Doc | null = null;
	public searchIndexs = IDREF_FILTER_MAP;

	private idrefService = inject(IdrefService);
	private idrefRecordService = inject(IdrefRecordService);
	private settingsService = inject(CloudAppSettingsService);
	private fb = inject(FormBuilder);

	public idrefResult = this.idrefService.idrefResult;
	public NZSelectedEntry = this.idrefService.NZSelectedEntry;
	public iconMap = IDREF_RECORDTYPE_TO_ICON_MAP;

	// Pagination.
	private pageIndex = signal(0);
	public pageSize = signal(10);

	public numFound: Signal<number> = computed(() => this.idrefResult()?.response.numFound ?? 0);

	public docs: Signal<Doc[]> = computed(() => this.idrefResult()?.response.docs ?? []);

	public paginatedDocs: Signal<Doc[]> = computed(() => {
		const start = this.pageIndex() * this.pageSize();
		const end = start + this.pageSize();

		return this.docs().slice(start, end);
	});

	public searchForm: FormGroup;

	private _paginator?: MatPaginator;

	public constructor() {
		inject(IconService);

		// S'assure que la clé 'all' existe.
		this.searchIndexs.set('all', 'all'); // Ou '' si un "sans index" réel est requis.

		this.settingsService.get().pipe(takeUntilDestroyed()).subscribe((settings) => {
			this.pageSize.set((settings as Settings).pageSize);
		});

		// Initialise le formulaire avec `searchIndex = 'all'`.
		this.searchForm = this.fb.group({
			searchIndex: ['all'],
			constructedQuery: [''],
			isStrictSearch: false,
		});

		// Synchronise les signaux du service vers le formulaire.
		effect(() => {
			const searchIndex = this.idrefRecordService.formSearchIndex();
			const constructedQuery = this.idrefRecordService.formConstructedQuery();
			const isStrictSearch = this.idrefRecordService.formIsStrictSearch();

			this.searchForm.patchValue(
				{
					searchIndex,
					constructedQuery,
					isStrictSearch,
				},
				{ emitEvent: false }
			);
		});

		// Synchronise le formulaire vers les signaux du service.
		this.searchForm.get('searchIndex')?.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
			this.idrefRecordService.formSearchIndex.set(value);
		});

		this.searchForm.get('constructedQuery')?.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
			this.idrefRecordService.formConstructedQuery.set(value);
		});

		this.searchForm
			.get('constructedQuery')
			?.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
			.subscribe(() => this.onSearch());
	}

	public onStrictSearchChange(event: Event): void {
		const input = event.target as HTMLInputElement | null;

		if (!input) {
			return;
		}

		this.idrefRecordService.formIsStrictSearch.set(input.checked);
	}

	public pushTobiblioRecordForm(doc: Doc): void {
		this.idrefRecordService.updateSelectedEntryWithPPN(doc);
	}

	public onSearch(): void {
		const values = this.searchForm.value as {
			searchIndex: string;
			constructedQuery: string;
		};

		this.idrefRecordService.searchFromFormValues(values.searchIndex, values.constructedQuery);
	}

	public showDetails(ppn: string): void {
		this.idrefService.loadAuthorityDetail(ppn);
	}

	@ViewChild(MatPaginator)
	public set paginator(p: MatPaginator | undefined) {
		if (!p) return;

		this._paginator = p;

		p.page.subscribe((event) => {
			this.pageIndex.set(event.pageIndex);
			this.pageSize.set(event.pageSize);
		});
	}
}
