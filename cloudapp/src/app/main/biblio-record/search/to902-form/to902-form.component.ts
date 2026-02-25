/* eslint-disable @typescript-eslint/member-ordering */
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzBibRecord } from '../../../../models/bib-records';
import { SearchService } from '../search.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormValues } from '../model';
import { CloudAppEventsService, CloudAppSettingsService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { Settings } from '../../../../models/setting';

export enum to902$$aFields {
	nouveau = 'IDREF-NOUV',
	correction = 'IDREF-CORR',
	doublon = 'IDREF-DOUB',
}

@Component({
	selector: 'app-to902-form',
	templateUrl: './to902-form.component.html',
	styleUrl: './to902-form.component.scss',
})
export class To902FormComponent {
	public entity = input.required<NzBibRecord | undefined>();

	public searchForm: FormGroup;

	public to902Purpose = Object.values(to902$$aFields);

	private searchService = inject(SearchService);
	private settingsService = inject(CloudAppSettingsService);
	private eventService = inject(CloudAppEventsService);
	private translate = inject(TranslateService);
	private fb = inject(FormBuilder);

	public readonly searchMode902 = this.searchService.searchMode902;
	public readonly searchMode = this.searchService.searchMode;
	public readonly NZSelectedEntry = this.searchService.NZSelectedEntry;
	public userSignature = signal('');
	public IZCode = signal('');

	public defaultPurpose = computed(() => {
		if (this.NZSelectedEntry()?.tag === '902') {
			return `${this.NZSelectedEntry()?.subfields.find((f) => f.code === 'a')?.value}`;
		}

		if (
			this.NZSelectedEntry()?.subfields.find((f) => f.code === '0' && f.value.includes('IDREF'))
		) {
			return to902$$aFields.correction;
		}

		return to902$$aFields.nouveau;
	});

	// TODO: externaliser le contenu dans une configuration pour faciliter son évolution sans modification du code.

	public predifinedContent = computed(() => {
		if (this.NZSelectedEntry()?.tag === '902') {
			return `${this.NZSelectedEntry()?.subfields.find((f) => f.code === 'b')?.value}`;
		}

		const purpose = this.searchForm.get('purpose')?.value;

		if (purpose === to902$$aFields.correction) {
			return this.translate.instant('search.to902.predefined.correction', {
				link: this.NZSelectedEntry()?.subfields.find((f) => f.code === '0')?.value,
			});
		} else if (purpose === to902$$aFields.nouveau) {
			return this.translate.instant('search.to902.predefined.nouveau');
		} else {
			return this.translate.instant('search.to902.predefined.doublon');
		}
	});

	public constructor() {
		this.settingsService.get().pipe(takeUntilDestroyed()).subscribe((settings) => {
			this.userSignature.set((settings as Settings).userSignature);
		});
		this.eventService.getInitData().pipe(takeUntilDestroyed()).subscribe((initData) => {
			// Conserve uniquement la partie après le premier `_`.
			const instCode = initData.instCode.split('_')[1] || initData.instCode;

			this.IZCode.set(instCode);
		});

		this.searchForm = this.fb.group({
			tag: [{ value: '902', disabled: true }],
			ind1: [{ value: ' ', disabled: true }],
			ind2: [{ value: ' ', disabled: true }],
			purpose: [this.defaultPurpose()],
			userSignature: [this.userSignature()],
			subfields: [''],
		});

		effect(() => {
			const entry = this.NZSelectedEntry();

			if (entry) {
				const purpose = this.defaultPurpose();

				this.searchForm.patchValue(
					{
						subfields: this.predifinedContent(),
						purpose, // Valeur scalaire (string), pas de tableau.
						userSignature: this.userSignature(),
					},
					{ emitEvent: false }
				);
			}
		});
	}

	public updateFieldIfFound(): void {
		const purpose = this.searchForm.get('purpose')?.value;
		const rawValue = this.searchForm.getRawValue() as FormValues;
		// Date au format `aaaammjj`.
		const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
		const finalValues: FormValues = {
			tag: rawValue.tag,
			ind1: rawValue.ind1,
			ind2: rawValue.ind2,
			subfields: `$$a ${purpose} $$b ${rawValue.subfields} $$5 ${this.IZCode()}/${date}/${this.userSignature()}`,
		};

		this.searchService.updateFieldIfFound(finalValues);
	}

	public createFieldIfNotFound(): void {
		const purpose = this.searchForm.get('purpose')?.value;
		const rawValue = this.searchForm.getRawValue() as FormValues;
		// Date au format `aaaammjj`.
		const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
		const finalValues: FormValues = {
			tag: rawValue.tag,
			ind1: rawValue.ind1,
			ind2: rawValue.ind2,
			subfields: `$$a ${purpose} $$b ${rawValue.subfields} $$5 ${this.IZCode()}/${date}/${this.userSignature()}`,
		};

		this.searchService.createFieldIfNotFound(finalValues);
	}

	public clear(): void {
		this.searchService.clear(() => this.searchForm.reset());
	}

	public closeTo902(): void {
		this.searchService.closeTo902();
	}
}
