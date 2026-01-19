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

export interface IdrefResolution {
  /** Clé dans IDREF_MAPPING, ex. "person", "subject", "trademark", ... */
  typeKey: keyof typeof IDREF_MAPPING;
  /** Libellé lisible (ex. Personne, Sujet, …) */
  label: string;
  /** Filtres Solr IdRef recommandés pour la recherche texte (ex. ["persname_t", ...]) */
  filters: string[];
  /** Codes recordtype_z à filtrer dans la requête (ex. ["a"], ["j","t"], …) */
  recordtypes: string[];
  /** Score de correspondance (pour désambiguiser lorsqu’on passe presentSubfields) */
  score: number;
  /** Définition(s) MARC qui ont matché */
  matchedMarcDefs: Array<{ tag: string; indicators: [string, string]; subfields: string[] }>;
}


// idref-mapping.ts (mise à jour)
export interface IdRefMapping {
  label: string;
  /** Champ(s) Solr IdRef pertinents pour la recherche texte */
  filters: string[];
  /** Codes recordtype_z IdRef pour ce type (filtre obligatoire) */
  recordtypes: string[];     // ex: ['a'] pour Personne, ['j','t'] pour Sujet (RAMEAU/FMeSH)
  /** Zones MARC applicables à ce type IdRef */
  marc: Array<{
    tag: string;                    // ex: "700", "110", "650"
    indicators: [string, string];   // ind1, ind2 (' ' = blanc)
    subfields: string[];            // ex: ['a','b','q','d']
  }>;
}

//les champs pouvant être relié à idref
export const allowedTags = ['100', '110', '650', '651', '655'];

export function getAllowedTags(): string[]{
	return [];
}


export const IDREF_MAPPING: Record<string, IdRefMapping> = {
  person: {
    label: 'Personne',
    filters: ['persname_t', 'datenaisance_dt', 'datemort_dt'],
    recordtypes: ['a'], // Personne physique
    marc: [
      { tag: '100', indicators: ['0',' '], subfields: [] },
      { tag: '100', indicators: ['1',' '], subfields: [] },
      { tag: '700', indicators: ['0',' '], subfields: [] },
      { tag: '700', indicators: ['1',' '], subfields: [] },
      { tag: '600', indicators: ['0',' '], subfields: [] },
      { tag: '600', indicators: ['1',' '], subfields: [] }
    ]
  },

  corporate: {
    label: 'Collectivité',
    filters: ['corpname_t'],
    recordtypes: ['b'], // Collectivité (hors congrès)
    marc: [
      { tag: '110', indicators: [' ',' '], subfields: [] },
      { tag: '610', indicators: [' ',' '], subfields: [] },
      { tag: '710', indicators: [' ',' '], subfields: [] }
    ]
  },

  conference: {
    label: 'Congrès',
    filters: ['conference_t'],
    recordtypes: ['s'], // Congrès
    marc: [
      { tag: '111', indicators: [' ',' '], subfields: [] },
      { tag: '611', indicators: [' ',' '], subfields: [] },
      { tag: '711', indicators: [' ',' '], subfields: [] }
    ]
  },

  family: {
    label: 'Famille',
    filters: ['famname_t'],
    recordtypes: ['e'], // Famille
    marc: [
      { tag: '100', indicators: ['3',' '], subfields: [] },
      { tag: '600', indicators: ['3',' '], subfields: [] },
      { tag: '700', indicators: ['3',' '], subfields: [] }
    ]
  },

  uniformTitle: {
    label: 'Titre uniforme',
    filters: ['uniformtitle_t'],
    recordtypes: ['f'], // Titre uniforme
    marc: [
      { tag: '130', indicators: [' ',' '], subfields: [] },
      { tag: '630', indicators: [' ',' '], subfields: [] },
      { tag: '730', indicators: [' ',' '], subfields: [] }
    ]
  },

  nameTitle: {
    label: 'Auteur / titre',
    filters: ['nametitle_t'],
    recordtypes: ['h'], // Auteur–Titre
    marc: [
      { tag: '600', indicators: ['1',' '], subfields: ['a','t'] },
      { tag: '600', indicators: ['0',' '], subfields: ['a','t'] }
    ]
  },

  subject: {
    label: 'Sujet',
    filters: ['subjectheading_t'],
    recordtypes: ['j','t'], // j = RAMEAU (nom commun & notices avec subdivision RAMEAU), t = FMeSH
    marc: [
      { tag: '650', indicators: [' ',' '], subfields: [] }
    ]
  },

  trademark: {
    label: 'Nom de marque',
    filters: ['trademark_t'],
    recordtypes: ['d'], // Marque
    marc: [
      { tag: '650', indicators: [' ',' '], subfields: [] }
    ]
  },

  geographic: {
    label: 'Nom géographique',
    filters: ['geoname_t'],
    recordtypes: ['c'], // Nom géographique
    marc: [
      { tag: '651', indicators: [' ',' '], subfields: [] },
      { tag: '751', indicators: [' ',' '], subfields: [] }
    ]
  },

  formGenre: {
    label: 'Forme / genre',
    filters: ['formgenreheading_t'],
    recordtypes: ['u','v'], // u = Forme RAMEAU ; v = Genre RAMEAU
    marc: [
      { tag: '655', indicators: [' ',' '], subfields: [] }
    ]
  },
};

export const tagIndex = Object.values(IDREF_MAPPING)
  .flatMap(mapping => mapping.marc.map(rule => ({ ...rule, type: mapping.label })))
  .reduce((acc, rule) => {
    acc[rule.tag] = acc[rule.tag] || [];
    acc[rule.tag].push(rule);

    return acc;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as Record<string, any[]>)

  
export function validateMarc(tag: string, indicators: string[], subfields: string[]): boolean {
  const rules = tagIndex[tag];

  if (!rules) return false;

  return rules.some(rule =>
    rule.indicators.every((ind: string, i: number) => ind === ' ' || ind === indicators[i]) &&
    rule.subfields.every((sf: string) => subfields.includes(sf))
  );
}


