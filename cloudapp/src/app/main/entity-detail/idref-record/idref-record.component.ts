/* eslint-disable @typescript-eslint/member-ordering */
import {
  Component,
  computed,
  inject,
  Signal,
  ViewChild,
  signal,
  effect
} from '@angular/core';


import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Doc, IDREF_FILTER_MAP, IDREF_RECORDTYPE_MAP, IDREF_RECORDTYPE_TO_ICON_MAP } from '../../../models/idref-model';
import { IdrefService } from '../../../services/idref.service';

@Component({
  selector: 'app-idref-record',
  templateUrl: './idref-record.component.html',
  styleUrl: './idref-record.component.scss'
})
export class IdrefRecordComponent {
  public selectedDoc: Doc |null = null;
  private idrefService = inject(IdrefService);

  public idrefResult = this.idrefService.idrefResult;
  public NZSelectedEntry = this.idrefService.NZSelectedEntry;
  public iconMap = IDREF_RECORDTYPE_TO_ICON_MAP;

  public numFound: Signal<number> = computed(
    () => this.idrefResult()?.response.numFound ?? 0
  );

  public docs: Signal<Doc[]> = computed(
    () => this.idrefResult()?.response.docs ?? []
  );

  //TODO: à améliorer car pour le moment on ne fait qu'une partie de la logique, on utilise uniquement 1 filtre sur le a$$
  //dans search index on a la valeur du recordType  à associer
  private searchIndex = computed(() => this.idrefService.getMarcStructure()?.label ?? "");

  //dans filters on a les filtres idref qui vont être utiles pour un tag/ind donnée
  private filters = computed(() => this.idrefService.getMarcStructure()?.filters ?? []);
  //Dans filtersValues on a la valeurs des filtre en fonction des filtres necessaire
  private filtersValues = computed(() => this.NZSelectedEntry()?.value);

  private queryInputValue = computed(() => {
    const persnameValue = this.filtersValues()?.find((value) => value.code === "a")?.value ?? "";
    const dates = this.filtersValues()?.find((value) => value.code === "d")?.value ?? "";

    if(dates.length>0){
      return `${persnameValue}, ${dates}`;
    }else{
      return persnameValue;
    }
  })

  //Dans constructedQuery on a le début de construction de la query
  private constructedQuery = computed(() => {

    let query = `${this.filters()[0]}:(`

    //c'est ici qu'on gère les différents cas de filtres
    //on commence par le cas où on utilise le nom et ou le prénom
    if (this.filters().join().includes("persname_t")) {
      //si c'est simplement un persname_t
      //on regarde si il y une virgule, si ou on separe le nom et le prenom
      const persnameValue = this.filtersValues()?.find((value) => value.code === "a")?.value.split(",") ?? [];

      //si il y a un nom et un prenom
      if (persnameValue && persnameValue.length > 1) {
        query = `${query}${persnameValue[0]} AND ${persnameValue[1]}`;
      } else {
        //si il n'y a qu'un des deux
        query = `${query}${persnameValue[0]}`;
      }

      if (this.filters().length > 1) {
        if (this.filters().join().includes("persname_t") && this.filters().join().includes("datenaissance_dt") && this.filters().join().includes("datemort_dt")) {
          //on commence par récupérer le sous champs correspondant aux dates 
          const dates = this.filtersValues()?.find((value) => value.code === "d")?.value;

          //si il n'y a qu'une date de naissance
          if (dates && dates.length >= 4 && dates.length < 8) {

            query = `${query} AND datenaissance_dt:${dates.substring(0,4)}`
            //la date est plus longue, que deux dates donc  il y a aussi une date de mort
          } else if (dates && dates.length > 8) {
            query = `${query} AND datenaissance_dt:${dates.substring(0,4)} AND datemort_dt:${dates.substring(dates.length-4,dates.length)}`
          } else {
            // date format unexpected — ignore
          }
        } else {
          // unsupported filter combination for now
        }
      }
    query = `${query})`
    }else{
      query = `${this.filters()[0]}:${this.filtersValues()?.find((value) => value.code === "a")?.value}`;
    }

    //on ajoute le recordType si il existe
    if(this.searchIndex().length > 0 && IDREF_RECORDTYPE_MAP.get(this.searchIndex())){
      query = `${query} AND recordtype_z:${IDREF_RECORDTYPE_MAP.get(this.searchIndex())}`
    }

    return query;
  });


  // Pagination state
  private pageIndex = signal(0);
  private pageSize = signal(10);


  // Slice côté client
  public paginatedDocs: Signal<Doc[]> = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();

    return this.docs().slice(start, end);
  });

  public searchForm: FormGroup;

  // ⭐⭐ Setter ViewChild ⭐⭐
  private _paginator?: MatPaginator;
  private fb = inject(FormBuilder);
  public constructor() {

    this.searchForm = this.fb.group({
      searchIndex: [''],
      constructedQuery: [''],
    });

    //on répercute les modifications du signal dans les champs des inputs
    effect(() => {
      const entry = this.NZSelectedEntry();

      if (entry) {


        this.searchForm.patchValue(
          {
            searchIndex: this.searchIndex(),
            constructedQuery: this.queryInputValue()
          },
          { emitEvent: false },
        );
      }
    });

    effect(() => {
      // internal pagination effect (no-op logging)
    });
  }


public pushTobiblioRecordForm(ppn_z: string): void {
  const selectedEntry = this.idrefService.NZSelectedEntry();

  if (!selectedEntry) {
    return;
  }

  // On clone le tableau pour rester "immutable"
  const newValues = [...selectedEntry.value];
  const currentPPNIndex = newValues.findIndex(
    (subfield) => subfield.code === '0'   // <== IMPORTANT : sans "$$"
  );

  if (currentPPNIndex !== -1) {
    // Mise à jour de la valeur existante
    newValues[currentPPNIndex] = {
      ...newValues[currentPPNIndex],
      value: `(IDREF)${ppn_z}`,
    };
  } else {
    // Ajout d'un nouveau sous-champ $$0
    newValues.push({
      code: '0',     
      value: ppn_z,
    });
  }

  const newEntry = {
    ...selectedEntry,
    value: newValues,
  };

  // update selected entry

  // Et là, on met à jour le signal
  this.idrefService.NZSelectedEntry.set(newEntry);
}


  public onSearch(): void {
    const values = this.searchForm.value as {
      searchIndex: string;
      constructedQuery: string;
    };
    // constructedQuery / searchIndex
    const queryValues = values.constructedQuery.split(",");
    let dateNaissance ="";
    let dateMort ="";
    let query= "";

    queryValues.forEach((value) => {
      if(/\b\d{4}\b/.test(String(value))){
        const YEAR_REGEX = /\d{4}/g;
        const matches = value.match(YEAR_REGEX) || [];
   
        dateNaissance = matches[0] ? ` AND datenaissance_dt:${matches[0].trim()}` : "";
        dateMort = matches[1] ? ` AND datemort_dt:${matches[1].trim()}` : "";
      }else{
        if(query.length > 0){
          query = `${query} AND ${value.trim()}`
        }else{
          query = value.trim()
        }
      }
    });
    query = `(${query}${dateNaissance}${dateMort})`


    const recordTypeCharac = IDREF_RECORDTYPE_MAP.get(values.searchIndex);

    if(recordTypeCharac){
      query = `${IDREF_FILTER_MAP.get(values.searchIndex)}:${query} AND recordtype_z:${recordTypeCharac}`
    } else {
      query = `all:${query}`
    }
    this.idrefService.searchFromQuery(query);
  }

  public showDetails(ppn: string):void {
    this.idrefService.searchWithPPN(ppn).subscribe(e => this.idrefService.idrefAuthorityDetail.set(e));
  }

  @ViewChild(MatPaginator)
  public set paginator(p: MatPaginator | undefined) {
    if (!p) return;

    this._paginator = p;

    // Ajoute l'abonnement ICI → maintenant le paginator existe bien
    p.page.subscribe(event => {
      this.pageIndex.set(event.pageIndex);
      this.pageSize.set(event.pageSize);
    });
  }

}
