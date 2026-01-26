import { xmlEntry } from './bib-records';

//mapping des couleurs des champs en fonction de leur rapport avec des notices d'authorités
export const tagGroups: {
	[groupName: string]: { tags: string[]; color: string };
} = {
	idrefLinked: { tags: ['100', '110'], color: '#a2f7a7' },
	relevant: { tags: ['650', '655'], color: '#feffae' },
	otherAuthorityLinked: { tags: ['651'], color: '#ebebeb' },
};

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

//réponse d'une requette sur idref
export interface IdrefRecords {
	responseHeader: ResponseHeader;
	response: Response;
}
//on à besoin des clés car on ne peux pas les récupérer depuis l'interface IdrefSolrIndex car les interface n'existent que dans le ts mais pas dans le js final
export const IdrefSolrIndexKeys = [
	'persname_t',
	'persname_s',
	'nom_t',
	'nom_s',
	'prenom_t',
	'prenom_s',
	'bestnom_t',
	'bestnom_s',
	'bestprenom_t',
	'bestprenom_s',
	'corpname_t',
	'corpname_s',
	'conference_t',
	'conference_s',
	'datenaissance_dt',
	'datemort_dt',
	'subjectheading_t',
	'subjectheading_s',
	'formgenreheading_t',
	'formgenreheading_s',
	'geogname_t',
	'geogname_s',
	'famname_t',
	'famname_s',
	'uniformtitle_t',
	'uniformtitle_s',
	'nametitle_t',
	'nametitle_s',
	'trademark_t',
	'trademark_s',
	'equivalent_t',
	'equivalent_s',
	'classification_t',
	'classification_s',
	'TR231_t',
	'TR231_s',
	'TR241_t',
	'TR241_s',
	'ppn_z',
	'rcrcre_z',
	'rcrmod_z',
	'datemod_z',
	'dateetat_dt',
	'rcr_t',
	'all',
];

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

export const MARC_STRUCTURE = new Map<
	string,
	idrefSearch
>([
	// Personne
	[
		'100|0 ',
		{
			label: 'Personne',
			filters: ['persname_t', 'datenaisance_dt', 'datemort_dt'],
			recordtypes: ['a'],
		},
	],
	[
		'100|1 ',
		{
			label: 'Personne',
			filters: ['persname_t', 'datenaisance_dt', 'datemort_dt'],
			recordtypes: ['a'],
		},
	],
	[
		'700|0 ',
		{
			label: 'Personne',
			filters: ['persname_t', 'datenaisance_dt', 'datemort_dt'],
			recordtypes: ['a'],
		},
	],
	[
		'700|1 ',
		{
			label: 'Personne',
			filters: ['persname_t', 'datenaisance_dt', 'datemort_dt'],
			recordtypes: ['a'],
		},
	],
	[
		'600|0 ',
		{
			label: 'Personne',
			filters: ['persname_t', 'datenaisance_dt', 'datemort_dt'],
			recordtypes: ['a'],
		},
	],
	[
		'600|1 ',
		{
			label: 'Personne',
			filters: ['persname_t', 'datenaisance_dt', 'datemort_dt'],
			recordtypes: ['a'],
		},
	],

	// Collectivité
	[
		'110|  ',
		{ label: 'Collectivité', filters: ['corpname_t'], recordtypes: ['b'] },
	],
	[
		'610|  ',
		{ label: 'Collectivité', filters: ['corpname_t'], recordtypes: ['b'] },
	],
	[
		'710|  ',
		{ label: 'Collectivité', filters: ['corpname_t'], recordtypes: ['b'] },
	],

	// Congrès
	[
		'111|  ',
		{ label: 'Congrès', filters: ['conference_t'], recordtypes: ['b'] },
	],
	[
		'611|  ',
		{ label: 'Congrès', filters: ['conference_t'], recordtypes: ['b'] },
	],
	[
		'711|  ',
		{ label: 'Congrès', filters: ['conference_t'], recordtypes: ['b'] },
	],

	// Famille
	['100|3 ', { label: 'Famille', filters: ['famname_t'], recordtypes: ['e'] }],
	['600|3 ', { label: 'Famille', filters: ['famname_t'], recordtypes: ['e'] }],
	['700|3 ', { label: 'Famille', filters: ['famname_t'], recordtypes: ['e'] }],

	// Titre uniforme
	[
		'130|  ',
		{
			label: 'Titre uniforme',
			filters: ['uniformtitle_t'],
			recordtypes: ['f'],
		},
	],
	[
		'630|  ',
		{
			label: 'Titre uniforme',
			filters: ['uniformtitle_t'],
			recordtypes: ['f'],
		},
	],
	[
		'730|  ',
		{
			label: 'Titre uniforme',
			filters: ['uniformtitle_t'],
			recordtypes: ['f'],
		},
	],

	// Auteur / titre
	[
		'600|1 |a,t',
		{ label: 'Auteur / titre', filters: ['nametitle_t'], recordtypes: ['h'] },
	],
	[
		'600|0 |a,t',
		{ label: 'Auteur / titre', filters: ['nametitle_t'], recordtypes: ['h'] },
	],

	// Sujet
	[
		'650|  ',
		{ label: 'Sujet', filters: ['subjectheading_t'], recordtypes: ['r', 'd'] },
	],

	// Nom géographique
	[
		'651|  ',
		{ label: 'Nom géographique', filters: ['geoname_t'], recordtypes: ['c'] },
	],
	[
		'751|  ',
		{ label: 'Nom géographique', filters: ['geoname_t'], recordtypes: ['c'] },
	],

	// Forme / genre
	[
		'655|  ',
		{
			label: 'Forme / genre',
			filters: ['formgenreheading_t'],
			recordtypes: ['r'],
		},
	],
]);

function getMarStructureKey(): string[] {
	const mapStructureIterator = MARC_STRUCTURE.keys();
	let key = mapStructureIterator.next();
	const keys: string[] = [];

	if (key.value) {
		keys.push(key.value.substring(0, 3));
	}

	while (!key.done) {
		keys.push(key.value.substring(0, 3));
		key = mapStructureIterator.next();
	}

	return keys;
}

//les champs pouvant être relié à idref qui sont calculé depuis MARC_STRUCTURE
export const MARC_STRUCTURE_KEY = getMarStructureKey();

export function getIdrefRecordsFromXmlentry(
	entry: xmlEntry,
): { label: string; filters: string[]; recordtypes: string[] } | undefined {
	console.log('entry: ', entry);

	const tag = entry.tag;
	const ind1 = entry.ind1.length > 0 ? entry.ind1 : ' ';
	const ind2 = entry.ind2.length > 0 ? entry.ind2 : ' ';
	const subfields: string[] = [];

	entry.value.forEach((v) => {
		subfields.push(v.code);
	});

	//ici on met ans l'ordre pour que cela corresponde au mapping
	const subfieldsStr = subfields.sort().join(',');
	let result = MARC_STRUCTURE.get(`${tag}|${ind1}${ind2}|${subfieldsStr}`);

	//d'abord on regarde si on a besoin de spécifier les subfields
	if (result) {
		return result;
	} else {
		//si pas de subfields on regarde les indicateurs
		result = MARC_STRUCTURE.get(`${tag}|${ind1}${ind2}`);

		if (result) {
			return result;
		} else if ((result = MARC_STRUCTURE.get(`${tag}|  `))) {
			return result;
		} else {
			console.error('il ny a pas de mapping associé');

			return;
		}
	}
}

export const recordType = new Map<string, string>([
	['a', 'Personne physique'],
	['b', 'Collectivité (sauf Congrès)'],
	['s', 'Congrès'],
	['c', 'Nom géographique'],
	['d', 'Marque'],
	['e', 'Famille'],
	['f', 'Titre uniforme'],
	['h', 'Auteur Titre'],
	['j','Rameau : notice Nom commun Rameau ou notice d’autre type ayant une subdivision de sujet Rameau'],
	['r', 'Regroupement'],
	['t', 'FMeSH'],
	['u', 'Forme Rameau'],
	['v', 'Genre Rameau'],
	['w', 'Centre de ressources (RCR) = bibliothèque Sudoc'],
	['x', 'Descripteur chronologique Rameau (laps de temps)'],
]);
