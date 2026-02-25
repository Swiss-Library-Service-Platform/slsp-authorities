// Types et interfaces de réponse Solr.
export interface Params {
	wt: string;
	q: string;
}

export interface ResponseHeader {
	status: number;
	QTime: number;
	params: Params;
}

export interface Doc {
	dateetat_dt: string;
	dateindex_dt: string;
	id: string;
	ppn_z: string;
	datecre_z: string;
	datemod_z: string;
	rcrcre_z: string;
	rcrmod_z: string;
	recordtype_z: string;
	affcourt_z: string;
	subdivision_z: string;
	heading_z: string;
	bestnom_s: string[];
	bestnom_t: string[];
	esr_s: string[];
	affcourt_r: string[];
	idsext_s: string[];
	d120_s: string[];
	persname_t: string[];
	persname_s: string[];
	genre_t: string[];
	nom_s: string[];
	nom_t: string[];
	bestprenom_s: string[];
	bestprenom_t: string[];
	langue_s: string[];
	d103_s: string[];
	pays_s: string[];
	prenom_t: string[];
	prenom_s: string[];
	all: string[];
	pays_t: string[];
	genre_s: string[];
}

export interface Response {
	numFound: number;
	start: number;
	docs: Doc[];
}

// Réponse d'une requête IdRef via Solr.
export interface IdrefRecords {
	responseHeader: ResponseHeader;
	response: Response;
}

export interface MarcStructureValues{
	label: string;
	filters: string[];
	recordtypes: string[];
}

// Réexporte les constantes/utilitaires partagés pour conserver les chemins d'import existants.
export { tagGroups, MARC_STRUCTURE, MARC_STRUCTURE_KEY, getIdrefRecordsFromBibRecordField, IDREF_FILTER_MAP, IDREF_RECORDTYPE_MAP, IDREF_RECORDTYPE_TO_ICON_MAP } from '../shared/idref-constants';
