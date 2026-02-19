import { BibRecordField } from '../models/bib-records';
import { MarcStructureValues } from '../models/idref-model';

export const IDREF_RECORDTYPE_TO_ICON_MAP = new Map<string, string>([
	['a', 'personne'],
	['b', 'congres'],
	['e', 'famille'],
	['f', 'titre_uniforme'],
	['h', 'auteur_titre'],
	['j', 'sujet'],
	['d', 'nom_marque'],
	['c', 'noms_geographiques'],
	['v', 'forme_genre'] 
]);
export const tagGroups: {
	[groupName: string]: { tags: string[]; color: string };
} = {
	idrefLinked: { tags: ['100', '110'], color: '#a2f7a7' },
	relevant: { tags: ['650', '655'], color: '#feffae' },
	otherAuthorityLinked: { tags: ['651'], color: '#ebebeb' },
};


export const MARC_STRUCTURE = new Map<string, MarcStructureValues>([
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

	['650|  ', { label: 'Sujet', filters: ['subjectheading_t'], recordtypes: ['j'] }],

	['651|  ', { label: 'Nom géographique', filters: ['geoname_t'], recordtypes: ['c'] }],
	['751|  ', { label: 'Nom géographique', filters: ['geoname_t'], recordtypes: ['c'] }],

	['655|  ', { label: 'Forme / genre', filters: ['formgenreheading_t'], recordtypes: ['v'] }],
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

export function getIdrefRecordsFromBibRecordField(entry: BibRecordField): { label: string; filters: string[]; recordtypes: string[] } | undefined {
	const tag = entry.tag;
	const ind1 = entry.ind1.length > 0 ? entry.ind1 : ' ';
	const ind2 = entry.ind2.length > 0 ? entry.ind2 : ' ';
	const subfields: string[] = [];

	entry.subfields.forEach((v) => {
		subfields.push(v.code);
	});

	//utile pour le sous sous champs 650|1 |a,t et 650|0 |a,t 
	const subfieldsStr = subfields.sort().join(',');
	let result = MARC_STRUCTURE.get(`${tag}|${ind1}${ind2}|${subfieldsStr}`);

	if (result) return result;
	//le cas le plus commun il y a seulement le tag et les indexes qui importent
	result = MARC_STRUCTURE.get(`${tag}|${ind1}${ind2}`);

	if (result) return result;
	if ((result = MARC_STRUCTURE.get(`${tag}|  `))) return result;

	return;
}

function buildIdrefFilterMap(): Map<string, string> {
    const map = new Map<string, string>();

    for (const { label, filters } of MARC_STRUCTURE.values()) {
        if (!label || !filters?.length) continue;
        // On ne set qu'une seule fois par label

        if (!map.has(label)) {
            map.set(label, filters[0]);
        }
    }

    return map;
}

function buildIdrefRecordtypeMap(): Map<string, string> {
    const map = new Map<string, string>();

    for (const { label, recordtypes } of MARC_STRUCTURE.values()) {
        if (!label || !recordtypes?.length || !recordtypes[0]) continue;
		
        if (!map.has(label)) {
            map.set(label, recordtypes[0]);
        }
    }

    return map;
}

function buildInvertedIdrefRecordtypeMap(
    source: Map<string, string>
): Map<string, string> {
    const map = new Map<string, string>();

    for (const [label, recordType] of source.entries()) {
        if (!recordType) continue;
        // Si plusieurs labels partagent le même recordType, le dernier gagne.
        map.set(recordType, label);
    }

    return map;
}

export const MARC_STRUCTURE_KEY = getMarStructureKey();
export const IDREF_FILTER_MAP = buildIdrefFilterMap()
export const IDREF_RECORDTYPE_MAP = buildIdrefRecordtypeMap()
export const INVERTED_IDREF_RECORDTYPE_MAP = buildInvertedIdrefRecordtypeMap(IDREF_RECORDTYPE_MAP)
