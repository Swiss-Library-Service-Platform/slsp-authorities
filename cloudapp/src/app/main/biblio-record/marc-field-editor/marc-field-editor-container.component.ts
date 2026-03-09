import { Component, inject, input } from '@angular/core';
import { NzBibRecord } from '../../../models/bib-record.model';
import { BibRecordFieldModifierService } from './bib-record-field-modifier.service';


@Component({
	selector: 'app-marc-field-editor-container',
	templateUrl: './marc-field-editor-container.component.html',
	styleUrls: ['./marc-field-editor-container.component.scss'],
})
export class MarcFieldEditorContainerComponent {

	public entity = input.required<NzBibRecord | undefined>();
	public isTo902FormVisible = inject(BibRecordFieldModifierService).isTo902FormVisible;
	public searchMode902 = inject(BibRecordFieldModifierService).searchMode902;
}
