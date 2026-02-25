/* eslint-disable @typescript-eslint/member-ordering */
import { AfterViewInit, Component, DestroyRef, ElementRef, ViewChild, effect, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup } from '@angular/forms';
import { distinctUntilChanged } from 'rxjs';
import { NzBibRecord } from '../../../../models/bib-record.model';
import { IdrefService } from '../../../../services/idref.service';
import { SearchService } from '../search.service';
import { IdrefRecordService } from '../../../entity-detail/idref-record/idref-record.service';

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

	private idrefService = inject(IdrefService);
	private searchService = inject(SearchService);
	private idrefRecordService = inject(IdrefRecordService);
	private fb = inject(FormBuilder);
	private destroyRef = inject(DestroyRef);

	public readonly searchMode = this.searchService.searchMode;
	public readonly isTo902FormVisible = this.searchService.isTo902FormVisible;
	public readonly nzSelectedEntry = this.searchService.nzSelectedEntry;
	public readonly flattenedValue = this.searchService.flattenedValue;
	public readonly formResetNonce = this.searchService.formResetNonce;

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
			const entry = this.nzSelectedEntry();

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

		this.searchService.setNzSelectedEntry(values);

		const subfields = values.subfields;
		const regex = /\$\$0 \(IDREF\)(\d+)/;
		const match = subfields.match(regex);

		if (match) {
			const ppn = match[1];

			this.idrefService.loadAuthorityDetail$(ppn).subscribe();
		} else {
			this.idrefRecordService.searchFromCurrentEntryContext();
		}
	}

	public addRecord(): void {
		this.searchService.addRecord(this.searchForm.value, () => this.resetFormFields());
	}

	public updateFieldIfFound(): void {
		this.searchService.updateFieldIfFound(this.searchForm.value, () => this.resetFormFields());
	}

	public createFieldIfNotFound(): void {
		this.searchService.createFieldIfNotFound(this.searchForm.value, () => this.resetFormFields());
	}

	public showTo902(): void {
		this.searchService.showTo902();
	}

	public clear(): void {
		this.searchService.clear(() => {
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
}
