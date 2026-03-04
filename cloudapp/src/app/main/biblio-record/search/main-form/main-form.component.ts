/* eslint-disable @typescript-eslint/member-ordering */
import { AfterViewInit, Component, DestroyRef, ElementRef, ViewChild, effect, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup } from '@angular/forms';
import { distinctUntilChanged, catchError, EMPTY } from 'rxjs';
import { NzBibRecord } from '../../../../models/bib-record.model';
import { IdrefService } from '../../../../services/idref.service';
import { IdrefRecordService } from '../../../entity-detail/idref-record/idref-record.service';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { CreationWarningModalComponent } from '../../creation-warning-modal/creation-warning-modal.component';
import { AuthorityDetailsService } from '../../../entity-detail/idref-entry-details/authority-details.service';
import { BibRecordFieldModifierService } from '../bib-record-field-modifier.service';

@Component({
	selector: 'app-main-form',
	templateUrl: './main-form.component.html',
	styleUrl: './main-form.component.scss',
})
export class MainFormComponent implements AfterViewInit {
	public entity = input.required<NzBibRecord | undefined>();

	public searchForm: FormGroup;
	public highlightedSubfields = '';
	private lastHighlightedValue: string | null = null;
	private highlightFramePending = false;
	@ViewChild('subfieldsTextarea') private subfieldsTextarea?: ElementRef<HTMLTextAreaElement>;


	private authorityDetailsService = inject(AuthorityDetailsService);
	private idrefService = inject(IdrefService);
	private bibRecordFieldModifierService = inject(BibRecordFieldModifierService);
	private idrefRecordService = inject(IdrefRecordService);
	private fb = inject(FormBuilder);
	private destroyRef = inject(DestroyRef);
	private alert = inject(AlertService);
	private translate = inject(TranslateService);
	private dialog = inject(MatDialog);

	public readonly searchMode = this.bibRecordFieldModifierService.searchMode;
	public readonly isTo902FormVisible = this.bibRecordFieldModifierService.isTo902FormVisible;
	public readonly selectedFieldFromBibRecord = this.idrefService.selectedFieldFromBibRecord;
	public readonly flattenedValue = this.idrefService.flattenedValue;
	public readonly formResetNonce = this.bibRecordFieldModifierService.formResetNonce;

	public constructor() {
		this.searchForm = this.fb.group({
			tag: [''],
			ind1: [''],
			ind2: [''],
			subfields: [''],
		});

		this.searchForm
			.get('subfields')
			?.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
			.subscribe(() => this.scheduleSubfieldsRender());

		effect(() => {
			const entry = this.selectedFieldFromBibRecord();

			if (entry) {
				this.searchForm.patchValue(
					{
						tag: entry.tag,
						ind1: entry.ind1,
						ind2: entry.ind2,
						subfields: this.flattenedValue(),
					},
					{ emitEvent: false }
				);
				this.scheduleSubfieldsRender();
			}
		});

		effect(() => {
			this.formResetNonce();
			this.resetFormFields();
		});
	}

	public ngAfterViewInit(): void {
		this.scheduleSubfieldsRender();
	}

	public onSubfieldsInput(event: Event): void {
		this.scheduleSubfieldsRender(event);
	}

	private scheduleSubfieldsRender(event?: Event): void {
		this.autoResizeSubfields(event);

		if (this.highlightFramePending) {
			return;
		}

		this.highlightFramePending = true;
		requestAnimationFrame(() => {
			this.highlightFramePending = false;
			this.updateSubfieldsHighlight();
		});
	}

	public autoResizeSubfields(event?: Event): void {
		const textarea = (event?.target as HTMLTextAreaElement | null) ?? this.subfieldsTextarea?.nativeElement;

		if (!textarea) {
			return;
		}

		textarea.style.height = 'auto';
		textarea.style.height = `${textarea.scrollHeight}px`;
	}

	private updateSubfieldsHighlight(): void {
		const subfields = (this.searchForm.get('subfields')?.value as string | null) ?? '';

		if (subfields === this.lastHighlightedValue) {
			return;
		}

		this.lastHighlightedValue = subfields;

		const escaped = this.escapeHtml(subfields);

		this.highlightedSubfields = escaped.replace(
			/(\$\$.)/g,
			'<span class="subfield-token-blue">$1</span>'
		);
	}

	private escapeHtml(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/\"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/\n/g, '<br/>');
	}

	public onSearch(): void {
		const values = this.searchForm.value as {
			tag: string;
			ind1: string;
			ind2: string;
			subfields: string;
		};

		this.bibRecordFieldModifierService.setSelectedFieldFromBibRecord(values);

		const subfields = values.subfields;
		const regex = /\$\$0 \(IDREF\)(\d+)/;
		const match = subfields.match(regex);

		if (match) {
			const ppn = match[1];

			this.authorityDetailsService
				.loadAuthorityDetail$(ppn)
				.pipe(
					catchError(() => {
						this.alert.error(this.translate.instant('error.eventServiceError'), { autoClose: false });

						return EMPTY;
					})
				)
				.subscribe();
		} else {
			this.idrefRecordService.searchFromCurrentEntryContext();
		}
	}

	public addRecord(): void {
		this.executeWithValidation(() => {
			this.bibRecordFieldModifierService.addRecord(this.getNormalizedFormValues(), () => this.resetFormFields());
		});
	}

	public updateFieldIfFound(): void {
		this.executeWithValidation(() => {
			this.bibRecordFieldModifierService.updateFieldIfFound(this.getNormalizedFormValues(), () => this.resetFormFields());
		});
	}

	public createFieldIfNotFound(): void {
		this.executeWithValidation(() => {
			const values = this.getNormalizedFormValues();

			this.bibRecordFieldModifierService.createFieldIfNotFound(values, () => this.resetFormFields());
		});
	}

	public showTo902(): void {
		this.bibRecordFieldModifierService.showTo902();
	}

	public clear(): void {
		this.bibRecordFieldModifierService.clear(() => {
			this.resetFormFields();
		});
	}

	private resetFormFields(): void {
		this.searchForm.reset(
			{
				tag: '',
				ind1: '',
				ind2: '',
				subfields: '',
			},
			{ emitEvent: false }
		);
		this.lastHighlightedValue = null;
		this.highlightedSubfields = '';
		this.scheduleSubfieldsRender();
	}

	private getNormalizedFormValues(): { tag: string; ind1: string; ind2: string; subfields: string } {
		const values = this.searchForm.value as { tag: string; ind1: string; ind2: string; subfields: string };

		return {
			tag: values.tag ?? '',
			ind1: values.ind1?.trim() ? values.ind1 : ' ',
			ind2: values.ind2?.trim() ? values.ind2 : ' ',
			subfields: values.subfields ?? '',
		};
	}

	private executeWithValidation(onValidated: () => void): void {
		const values = this.getNormalizedFormValues();
		const validation = this.bibRecordFieldModifierService.formValuesAreValid(values);

		if (!validation.isValid) {
			return;
		}

		if (!validation.warningKey) {
			onValidated();

			return;
		}

		const dialogRef = this.dialog.open(CreationWarningModalComponent, {
			width: '420px',
			data: { warningKey: validation.warningKey },
		});

		dialogRef.afterClosed().subscribe((confirmed: boolean) => {
			if (confirmed) {
				onValidated();
			}
		});
	}
}
