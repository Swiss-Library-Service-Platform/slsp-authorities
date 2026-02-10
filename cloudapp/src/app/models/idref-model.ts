// Types and Solr response interfaces
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

//réponse d'une requette sur idref via Solr
export interface IdrefRecords {
	responseHeader: ResponseHeader;
	response: Response;
}

export interface IdrefSolrIndex {
	persname_t: string;
	persname_s: string;

	nom_t: string;
	nom_s: string;

	prenom_t: string;
	prenom_s: string;

	bestnom_t: string;
	bestnom_s: string;

	bestprenom_t: string;
	bestprenom_s: string;

	corpname_t: string;
	corpname_s: string;

	conference_t: string;
	conference_s: string;

	datenaissance_dt: string;
	datemort_dt: string;

	subjectheading_t: string;
	subjectheading_s: string;

	formgenreheading_t: string;
	formgenreheading_s: string;

	geogname_t: string;
	geogname_s: string;

	famname_t: string;
	famname_s: string;

	uniformtitle_t: string;
	uniformtitle_s: string;

	nametitle_t: string;
	nametitle_s: string;

	trademark_t: string;
	trademark_s: string;

	equivalent_t: string;
	equivalent_s: string;

	classification_t: string;
	classification_s: string;

	TR231_t: string;
	TR231_s: string;

	TR241_t: string;
	TR241_s: string;

	ppn_z: string;
	rcrcre_z: string;
	rcrmod_z: string;
	datemod_z: string;
	dateetat_dt: string;

	rcr_t: string;
	all: string;
}

export interface idrefSearch{
	label: string;
	filters: string[];
	recordtypes: string[];
}

// Re-export shared constants/utilities to keep existing import paths stable
export { tagGroups, IdrefSolrIndexKeys, MARC_STRUCTURE, MARC_STRUCTURE_KEY, getIdrefRecordsFromXmlentry, IDREF_FILTER_MAP, IDREF_RECORDTYPE_MAP, INVERTED_IDREF_RECORDTYPE_MAP, IDREF_RECORDTYPE_TO_ICON_MAP } from '../shared/idref-constants';
