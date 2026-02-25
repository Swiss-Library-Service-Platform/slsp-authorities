// Type de retour d'une requête sur `almaws/v1/bibs/{mms_id}` dans la NZ.
export interface NzBibRecord {
  mms_id: string;
  record_format: string;
  linked_record_id: LinkedRecordId;
  title: string;
  author: string;
  isbn: string;
  network_number: string[];
  place_of_publication: string;
  date_of_publication: string;
  publisher_const: string;
  holdings: { link: string };
  created_by: string;
  created_date: string;
  last_modified_by: string;
  last_modified_date: string;
  suppress_from_publishing: string;
  rank: string;
  cataloging_level: CatalogingLevel;
  brief_level: BriefLevel;
  anies: string[];
}

export interface LinkedRecordId {
  value: string;
  type: string;
}

export interface CatalogingLevel {
  value: string;
  desc: string;
}

export interface BriefLevel {
  value: string;
  desc: string;
}

export interface BibRecordField{
    change: string,
    tag: string,
    ind1: string,
    ind2: string,
    subfields: { code: string; value: string }[],
}


export interface ControlField {
  tag: string;
  value: string;
}

export interface SubField {
  code: string;
  value: string;
}

export interface DataField {
  tag: string;
  ind1: string;
  ind2: string;
  subfields: SubField[];
}

export interface MarcRecord {
  leader: string;
  controlFields: ControlField[];
  dataFields: DataField[];
}

