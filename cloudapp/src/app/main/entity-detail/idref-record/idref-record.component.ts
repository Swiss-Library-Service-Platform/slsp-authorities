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
import { Doc, IDREF_RECORDTYPE_TO_ICON_MAP } from '../../../models/idref-model';
import { IdrefService } from '../../../services/idref.service';
import { IdrefRecordService } from './idref-record.service';
import { CloudAppSettingsService } from '@exlibris/exl-cloudapp-angular-lib';
import { Settings } from '../../../models/setting';
import { IconService } from '../../../services/icon.service';

@Component({
  selector: 'app-idref-record',
  templateUrl: './idref-record.component.html',
  styleUrl: './idref-record.component.scss'
})
export class IdrefRecordComponent {
  public selectedDoc: Doc | null = null;
  private idrefService = inject(IdrefService);
  private idrefRecordService = inject(IdrefRecordService);
  private settingsService = inject(CloudAppSettingsService)
  private readonly iconService = inject(IconService);

  // Signals from services
  public idrefResult = this.idrefService.idrefResult;
  public NZSelectedEntry = this.idrefService.NZSelectedEntry;
  public iconMap = IDREF_RECORDTYPE_TO_ICON_MAP;

  // Presentation signals
  public numFound: Signal<number> = computed(
    () => this.idrefResult()?.response.numFound ?? 0
  );

  public docs: Signal<Doc[]> = computed(
    () => this.idrefResult()?.response.docs ?? []
  );

  // Business logic from service
  private searchIndex = this.idrefRecordService.getSearchIndex();
  private queryInputValue = this.idrefRecordService.buildQueryInputValue();
  public constructedQuery = this.idrefRecordService.buildConstructedQuery();

  // Pagination state
  private pageIndex = signal(0);
  public pageSize = signal(10);

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
    this.settingsService.get().subscribe(
      settings => {
        this.pageSize.set((settings as Settings).pageSize)
      }
    )

    this.searchForm = this.fb.group({
      searchIndex: [''],
      constructedQuery: [''],
    });

    // On répercute les modifications du signal dans les champs des inputs
    effect(() => {
      const entry = this.NZSelectedEntry();

      if (entry) {
        this.searchForm.patchValue(
          {
            searchIndex: this.searchIndex(),
            constructedQuery: this.queryInputValue()
          },
          { emitEvent: false }
        );
      }
    });

    // Synchronise les signaux du service avec le formulaire
    effect(() => {
      const searchIndex = this.idrefRecordService.formSearchIndex();
      const constructedQuery = this.idrefRecordService.formConstructedQuery();

      this.searchForm.patchValue(
        {
          searchIndex,
          constructedQuery
        },
        { emitEvent: false }
      );
    });
  }

  public pushTobiblioRecordForm(ppn_z: string): void {
    this.idrefRecordService.updateSelectedEntryWithPPN(ppn_z);
  }
  

  public onSearch(): void {
    const values = this.searchForm.value as {
      searchIndex: string;
      constructedQuery: string;
    };
    const query = this.idrefRecordService.buildQueryFromFormValues(
      values.searchIndex,
      values.constructedQuery
    );
    
    this.idrefService.searchFromQuery(query);
  }

  public showDetails(ppn: string): void {
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
