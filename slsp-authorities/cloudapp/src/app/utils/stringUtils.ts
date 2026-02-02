import { ControlField, DataField, MarcRecord, SubField, xmlEntry } from "../models/bib-records";

export function xmlToMarcRecord(xml: string): MarcRecord {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');  // Gestion des erreurs XML
  const parserError = doc.getElementsByTagName('parsererror')[0];

  if (parserError) {
    throw new Error('XML invalide : ' + parserError.textContent);
  }

  // LEADER
  const leaderElement = doc.getElementsByTagName('leader')[0];
  const leader = leaderElement?.textContent?.trim() ?? '';  // CONTROLFIELDS
  const controlFields: ControlField[] = [];
  const controlFieldNodes = doc.getElementsByTagName('controlfield');

  for (let i = 0; i < controlFieldNodes.length; i++) {
    const node = controlFieldNodes[i];

    controlFields.push({
      tag: node.getAttribute('tag') ?? '',
      value: node.textContent?.trim() ?? '',
    });
  }

  // DATAFIELDS
  const dataFields: DataField[] = [];
  const dataFieldNodes = doc.getElementsByTagName('datafield');

  for (let i = 0; i < dataFieldNodes.length; i++) {
    const df = dataFieldNodes[i];    const subfields: SubField[] = [];
    const subfieldNodes = df.getElementsByTagName('subfield');

    for (let j = 0; j < subfieldNodes.length; j++) {
      const sf = subfieldNodes[j];

      subfields.push({
        code: sf.getAttribute('code') ?? '',
        value: sf.textContent?.trim() ?? '',
      });
    }

    dataFields.push({
      tag: df.getAttribute('tag') ?? '',
      ind1: df.getAttribute('ind1') ?? ' ',
      ind2: df.getAttribute('ind2') ?? ' ',
      subfields,
    });
  }

  return {
    leader,
    controlFields,
    dataFields,
  };
}

export function marcRecordToXml(record: MarcRecord): string {
  const doc = document.implementation.createDocument('', '', null);  // Racine <record>
  const recordElement = doc.createElement('record');

  doc.appendChild(recordElement);

  // 1) <leader>
  const leaderElement = doc.createElement('leader');

  leaderElement.textContent = record.leader;
  recordElement.appendChild(leaderElement);

  // 2) <controlfield> dans l'ordre du tableau
  for (const cf of record.controlFields) {
    const cfElement = doc.createElement('controlfield');

    cfElement.setAttribute('tag', cf.tag);
    cfElement.textContent = cf.value;
    recordElement.appendChild(cfElement);
  }

  // 3) <datafield> dans l'ordre du tableau
  for (const df of record.dataFields) {
    const dfElement = doc.createElement('datafield');

    // 👉 Ordre des attributs : ind1, ind2, tag
    dfElement.setAttribute('ind1', df.ind1 || ' ');
    dfElement.setAttribute('ind2', df.ind2 || ' ');
    dfElement.setAttribute('tag', df.tag);

    // 👉 Puis les subfields dans l'ordre du tableau
    for (const sf of df.subfields) {
      const sfElement = doc.createElement('subfield');

      sfElement.setAttribute('code', sf.code);
      sfElement.textContent = sf.value;
      dfElement.appendChild(sfElement);
    }

    recordElement.appendChild(dfElement);
  }

  const serializer = new XMLSerializer();
  const xmlString = serializer.serializeToString(doc);

  // (optionnel) Si tu veux la déclaration XML :
  // return '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;

  return xmlString;
}

export function areSubfieldsEqual(a: SubField[], b: SubField[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i].code !== b[i].code || a[i].value !== b[i].value) {
      return false;
    }
  }

  return true;
}

export function areDataFieldsEqual(a: DataField, b: DataField): boolean {
  return (
    a.tag === b.tag &&
    a.ind1 === b.ind1 &&
    a.ind2 === b.ind2 &&
    areSubfieldsEqual(a.subfields, b.subfields)
  );
}

export function xmlEntryToDataField(entry: xmlEntry): DataField {
  return {
    tag: entry.tag,
    ind1: entry.ind1,
    ind2: entry.ind2,
    subfields: entry.value.map(v => ({
      code: v.code,
      value: v.value,
    })),
  };
}
