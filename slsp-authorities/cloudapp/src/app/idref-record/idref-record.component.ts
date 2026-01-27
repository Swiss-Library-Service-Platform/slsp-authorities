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
import { IdrefService } from '../services/idref.service';
import { Doc } from '../models/idref-model';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-idref-record',
  templateUrl: './idref-record.component.html',
  styleUrl: './idref-record.component.scss'
})
export class IdrefRecordComponent {
  private idrefService = inject(IdrefService);

  public idrefResult = this.idrefService.idrefResult;

  public numFound: Signal<number> = computed(
    () => this.idrefResult()?.response.numFound ?? 0
  );

  public docs: Signal<Doc[]> = computed(
    () => this.idrefResult()?.response.docs ?? []
  );

  // Pagination state
  private pageIndex = signal(0);
  private pageSize = signal(5);

  // Slice côté client
  public paginatedDocs: Signal<Doc[]> = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();

    return this.docs().slice(start, end);
  });

  // ⭐⭐ Setter ViewChild ⭐⭐
  private _paginator?: MatPaginator;

  public constructor(){
    effect(() => {
      console.log('--- Effect ---');
      console.log('pageIndex :', this.pageIndex());
      console.log('pageSize  :', this.pageSize());
      console.log('docs paginés :', this.paginatedDocs());
    });
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
