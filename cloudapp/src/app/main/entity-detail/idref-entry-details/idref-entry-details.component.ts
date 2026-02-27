import { Component, computed, inject, signal } from '@angular/core';
import { IdrefService } from '../../../services/idref.service';

interface IdrefDetailSubfield {
	code: string;
	value: string;
}

interface IdrefDetailRow {
	tag: string;
	ind1: string;
	ind2: string;
	subfields: IdrefDetailSubfield[];
}

@Component({
  selector: 'app-idref-entry-details',
  templateUrl: './idref-entry-details.component.html',
  styleUrl: './idref-entry-details.component.scss'
})
export class IdrefEntryDetailsComponent {
  private idrefService = inject(IdrefService);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public idrefAuthorityDetail = this.idrefService.idrefAuthorityDetail;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public showRawXml = signal(false);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public xmlAsString = computed(() => {
    const doc = this.idrefAuthorityDetail();

    if (!doc) return '';

    const serializer = new XMLSerializer();

    return serializer.serializeToString(doc);
  });
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public rows = computed<IdrefDetailRow[]>(() => {
    const doc = this.idrefAuthorityDetail();

    if (!doc) return [];

    const detailRows: IdrefDetailRow[] = [];
    const leader = this.getFirstNodeTextByLocalName(doc, 'leader');

    if (leader) {
      detailRows.push({
        tag: 'LDR',
        ind1: ' ',
        ind2: ' ',
        subfields: [{ code: '', value: leader }],
      });
    }

    const controlFields = Array.from(doc.getElementsByTagName('*')).filter(
      (element) => element.localName === 'controlfield'
    );

    for (const controlField of controlFields) {
      detailRows.push({
        tag: controlField.getAttribute('tag') ?? '',
        ind1: ' ',
        ind2: ' ',
        subfields: [{ code: '', value: controlField.textContent?.trim() ?? '' }],
      });
    }

    const dataFields = Array.from(doc.getElementsByTagName('*')).filter(
      (element) => element.localName === 'datafield'
    );

    for (const dataField of dataFields) {
      const subfields = Array.from(dataField.children)
        .filter((element) => element.localName === 'subfield')
        .map((subfield) => ({
          code: subfield.getAttribute('code') ?? '',
          value: subfield.textContent?.trim() ?? '',
        }));

      detailRows.push({
        tag: dataField.getAttribute('tag') ?? '',
        ind1: dataField.getAttribute('ind1') ?? ' ',
        ind2: dataField.getAttribute('ind2') ?? ' ',
        subfields,
      });
    }

    return detailRows;
  });

  public toggleRawXml(): void {
    this.showRawXml.update((value) => !value);
  }

  private getFirstNodeTextByLocalName(doc: Document, localName: string): string {
    const node = Array.from(doc.getElementsByTagName('*')).find(
      (element) => element.localName === localName
    );

    return node?.textContent?.trim() ?? '';
  }

}
