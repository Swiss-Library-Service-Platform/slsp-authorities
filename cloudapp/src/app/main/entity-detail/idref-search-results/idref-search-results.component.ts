/* eslint-disable @typescript-eslint/member-ordering */
import { Component, computed, DestroyRef, inject, Signal, ViewChild, signal, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ALL_INDEXES_KEY, Doc, IDREF_FILTER_MAP, IDREF_RECORDTYPE_TO_ICON_MAP } from '../../../models/idref.model';
import { IdrefQueryBuilderService } from './idref-query-builder.service';
import { AlertService, CloudAppSettingsService } from '@exlibris/exl-cloudapp-angular-lib';
import { Settings } from '../../../models/settings.model';
import { IconService } from '../../../services/icon.service';
import { debounceTime, distinctUntilChanged, catchError, EMPTY } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AuthorityDetailsService } from '../idref-entry-details/authority-details.service';
import { IdrefSearchService } from '../../../services/idref-search.service';

@Component({
	selector: 'app-idref-search-results',
	templateUrl: './idref-search-results.component.html',
	styleUrl: './idref-search-results.component.scss',
})
export class IdrefSearchResultsComponent {
	public selectedDoc: Doc | null = null;
	public searchIndexes = IDREF_FILTER_MAP;

	private authorityDetailsService = inject(AuthorityDetailsService);
	private idrefSearchService = inject(IdrefSearchService);
	private idrefQueryBuilder = inject(IdrefQueryBuilderService);
	private settingsService = inject(CloudAppSettingsService);
	private fb = inject(FormBuilder);
	private destroyRef = inject(DestroyRef);
	private alert = inject(AlertService);
	private translate = inject(TranslateService);

	public idrefResult = this.idrefSearchService.idrefResult;
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

		this.settingsService.get().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((settings) => {
			this.pageSize.set((settings as Settings).pageSize);
		});

		this.searchForm = this.fb.group({
			searchIndex: [ALL_INDEXES_KEY],
			constructedQuery: [''],
			isStrictSearch: false,
		});

		// Synchronise les signaux du service vers le formulaire.
		effect(() => {
			const searchIndex = this.idrefQueryBuilder.formSearchIndex();
			const constructedQuery = this.idrefQueryBuilder.formConstructedQuery();
			const isStrictSearch = this.idrefQueryBuilder.formIsStrictSearch();

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
		this.searchForm.get('searchIndex')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
			this.idrefQueryBuilder.formSearchIndex.set(value);
			this.onSearch({ searchIndex: value });
		});

		this.searchForm.get('constructedQuery')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
			this.idrefQueryBuilder.formConstructedQuery.set(value);
		});

		this.searchForm
			.get('constructedQuery')
			?.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
			.subscribe((value) => this.onSearch({ constructedQuery: value }));
	}

	public onStrictSearchChange(event: Event): void {
		const input = event.target as HTMLInputElement | null;

		if (!input) {
			return;
		}

		this.idrefQueryBuilder.formIsStrictSearch.set(input.checked);
		this.onSearch();
	}

	public pushTobiblioRecordForm(doc: Doc): void {
		this.idrefQueryBuilder.updateSelectedEntryWithPPN(doc);
	}

	public onSearch(overrides?: Partial<{ searchIndex: string; constructedQuery: string }>): void {
		const searchIndex = overrides?.searchIndex ?? (this.searchForm.get('searchIndex')?.value as string) ?? ALL_INDEXES_KEY;
		const constructedQuery = overrides?.constructedQuery ?? (this.searchForm.get('constructedQuery')?.value as string) ?? '';

		this.idrefQueryBuilder.searchFromFormValues(searchIndex, constructedQuery);
	}

	public showDetails(ppn: string): void {
		this.authorityDetailsService
			.loadAuthorityDetail$(ppn)
			.pipe(
				catchError(() => {
					this.alert.error(this.translate.instant('error.eventServiceError'), { autoClose: false });

					return EMPTY;
				})
			)
			.subscribe();
	}

	@ViewChild(MatPaginator)
	public set paginator(p: MatPaginator | undefined) {
		if (!p) return;

		this._paginator = p;

		p.page.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
			this.pageIndex.set(event.pageIndex);
			this.pageSize.set(event.pageSize);
		});
	}
}
