import { xmlEntry } from '../models/bib-records';

export const tagGroups: {
	[groupName: string]: { tags: string[]; color: string };
} = {
	idrefLinked: { tags: ['100', '110'], color: '#a2f7a7' },
	relevant: { tags: ['650', '655'], color: '#feffae' },
	otherAuthorityLinked: { tags: ['651'], color: '#ebebeb' },
};

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

export interface idrefSearch {
	label: string;
	filters: string[];
	recordtypes: string[];
}

export const MARC_STRUCTURE = new Map<string, idrefSearch>([
	['100|0 ', { label: 'Personne', filters: ['persname_t', 'datenaisance_dt', 'datemort_dt'], recordtypes: ['a'] }],
	['100|1 ', { label: 'Personne', filters: ['persname_t', 'datenaisance_dt', 'datemort_dt'], recordtypes: ['a'] }],
	['700|0 ', { label: 'Personne', filters: ['persname_t', 'datenaisance_dt', 'datemort_dt'], recordtypes: ['a'] }],
	['700|1 ', { label: 'Personne', filters: ['persname_t', 'datenaisance_dt', 'datemort_dt'], recordtypes: ['a'] }],
	['600|0 ', { label: 'Personne', filters: ['persname_t', 'datenaisance_dt', 'datemort_dt'], recordtypes: ['a'] }],
	['600|1 ', { label: 'Personne', filters: ['persname_t', 'datenaisance_dt', 'datemort_dt'], recordtypes: ['a'] }],

	['110|  ', { label: 'Collectivité', filters: ['corpname_t'], recordtypes: ['b'] }],
	['610|  ', { label: 'Collectivité', filters: ['corpname_t'], recordtypes: ['b'] }],
	['710|  ', { label: 'Collectivité', filters: ['corpname_t'], recordtypes: ['b'] }],

	['111|  ', { label: 'Congrès', filters: ['conference_t'], recordtypes: ['b'] }],
	['611|  ', { label: 'Congrès', filters: ['conference_t'], recordtypes: ['b'] }],
	['711|  ', { label: 'Congrès', filters: ['conference_t'], recordtypes: ['b'] }],

	['100|3 ', { label: 'Famille', filters: ['famname_t'], recordtypes: ['e'] }],
	['600|3 ', { label: 'Famille', filters: ['famname_t'], recordtypes: ['e'] }],
	['700|3 ', { label: 'Famille', filters: ['famname_t'], recordtypes: ['e'] }],

	['130|  ', { label: 'Titre uniforme', filters: ['uniformtitle_t'], recordtypes: ['f'] }],
	['630|  ', { label: 'Titre uniforme', filters: ['uniformtitle_t'], recordtypes: ['f'] }],
	['730|  ', { label: 'Titre uniforme', filters: ['uniformtitle_t'], recordtypes: ['f'] }],

	['600|1 |a,t', { label: 'Auteur / titre', filters: ['nametitle_t'], recordtypes: ['h'] }],
	['600|0 |a,t', { label: 'Auteur / titre', filters: ['nametitle_t'], recordtypes: ['h'] }],

	['650|  ', { label: 'Sujet', filters: ['subjectheading_t'], recordtypes: ['r'] }],

	['651|  ', { label: 'Nom géographique', filters: ['geoname_t'], recordtypes: ['c'] }],
	['751|  ', { label: 'Nom géographique', filters: ['geoname_t'], recordtypes: ['c'] }],

	['655|  ', { label: 'Forme / genre', filters: ['formgenreheading_t'], recordtypes: ['r'] }],
	['902|  ', { label: '', filters: [''], recordtypes: ['']}],
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

export const MARC_STRUCTURE_KEY = getMarStructureKey();

export function getIdrefRecordsFromXmlentry(entry: xmlEntry): { label: string; filters: string[]; recordtypes: string[] } | undefined {
	const tag = entry.tag;
	const ind1 = entry.ind1.length > 0 ? entry.ind1 : ' ';
	const ind2 = entry.ind2.length > 0 ? entry.ind2 : ' ';
	const subfields: string[] = [];

	entry.value.forEach((v) => {
		subfields.push(v.code);
	});

	const subfieldsStr = subfields.sort().join(',');
	let result = MARC_STRUCTURE.get(`${tag}|${ind1}${ind2}|${subfieldsStr}`);

	if (result) {
		return result;
	}

	result = MARC_STRUCTURE.get(`${tag}|${ind1}${ind2}`);

	if (result) return result;
	if ((result = MARC_STRUCTURE.get(`${tag}|  `))) return result;

	return;
}

export const IDREF_FILTER_MAP = new Map<string, string>([
	['Personne', 'persname_t'],
	['Collectivité', 'corpname_t'],
	['Congrès', 'conference_t'],
	['Famille', 'famname_t'],
	['Titre uniforme', 'uniformtitle_t'],
	['Auteur / titre', 'nametitle_t'],
	['Sujet', 'subjectheading_t'],
	['Nom de marque', 'trademark_t'],
	['Noms géographiques', 'geogname_t'],
	['Forme', 'formgenreheading_t'],
]);

export const IDREF_RECORDTYPE_MAP = new Map<string, string>([
	['Personne', 'a'],
	['Collectivité', 'b'],
	['Congrès', 'b'],
	['Famille', 'e'],
	['Titre uniforme', 'f'],
	['Auteur / titre', 'h'],
	['Sujet', 'r'],
	['Nom de marque', 'd'],
	['Noms géographiques', 'c'],
	['Forme', 'r'],
]);

export const INVERTED_IDREF_RECORDTYPE_MAP = new Map<string, string>([
	['a', 'Personne'],
	['b', 'Collectivité'],
	['e', 'Famille'],
	['f', 'Titre uniforme'],
	['h', 'Auteur / titre'],
	['r', 'Sujet'],
	['d', 'Nom de marque'],
	['c', 'Noms géographiques'],
]);

export const IDREF_RECORDTYPE_TO_ICON_MAP = new Map<string, string>([
	['a', 'person'],
	['b', 'groups'],
	['e', 'groups'],
	['f', 'title'],
	['h', 'person'],
	['r', 'subject'],
	['d', 'title'],
	['c', 'globe_location_pin'],
]);
