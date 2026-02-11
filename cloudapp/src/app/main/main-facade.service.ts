/* eslint-disable @typescript-eslint/member-ordering */
import { computed, inject, Injectable, signal } from '@angular/core';
import { CloudAppEventsService, AlertService, Entity, EntityType, RefreshPageResponse } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';

import { toSignal } from '@angular/core/rxjs-interop';
import { filter, tap, catchError, EMPTY, forkJoin, switchMap, of, finalize, Observable } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { IdrefService } from '../services/idref.service';
import { LoadingIndicatorService } from '../services/loading-indicator.service';
import { NZQueryService } from '../services/nzquery.service';
import { RecordService } from '../services/record.service';
import { IdrefRecordService } from './entity-detail/idref-record/idref-record.service';
import { IdrefSearchService } from './biblio-record/idref-search/idref-search.service';


@Injectable({
  providedIn: 'root'
})
export class MainFacadeService {
/** roles & institution */
  public hasCatalogerRole = signal(false);
  public isInstitutionAllowed = signal(false);

  private eventsService = inject(CloudAppEventsService);
  private alert = inject(AlertService);
  private translate = inject(TranslateService);
  private auth = inject(AuthenticationService);
  private loader = inject(LoadingIndicatorService);
  private recordService = inject(RecordService);
  private idrefService = inject(IdrefService);
  private nzQuery = inject(NZQueryService);
  private idrefRecordService = inject(IdrefRecordService);
  private idrefSearchService = inject(IdrefSearchService);
  

public entities = toSignal<Entity[]>(
    this.eventsService.entities$.pipe(
      filter((entities) => entities.every(e => e.type === EntityType.BIB_MMS)),

      tap(() => this.recordService.resetSelectedEntity()),

      tap((entities) => {
        if (entities.length === 1) {
          this.selectEntity(entities[0]);
        }
      }),

      catchError((error) => {
        this.alert.error(
          this.translate.instant('error.restApiError', [(error as Error).message]),
          { autoClose: false }
        );

        return EMPTY;
      }),

    )
  );

  /** expose selected entity */
  public selectedEntity = computed(() => this.recordService.selectedEntity());

  /** expose selected entity details */
  public selectedEntityDetails = computed(() =>
    this.recordService.selectedEntityDetails()
  );

  // ------------------
  // INIT LOGIC
  // ------------------

  public init():void {
    this.loader.show();

    forkJoin({
      hasRole: this.auth.checkUserRoles$(),
      allowed: this.auth.isInstitutionAllowed$(),
    }).pipe(
      tap(({ hasRole, allowed }) => {
        this.hasCatalogerRole.set(hasRole);
        this.isInstitutionAllowed.set(allowed);

        if (!hasRole)
          this.alert.error(this.translate.instant('error.catalogerRoleError'), { autoClose: false });

        if (!allowed)
          this.alert.error(this.translate.instant('error.institutionAllowedError'), { autoClose: false });
      }),

      switchMap(() => this.refresh()),

      catchError(() => {
        this.alert.warn(this.translate.instant("main.acceptRefreshModal"));

        return of({} as RefreshPageResponse);
      }),

      finalize(() => this.loader.hide())
    ).subscribe();
  }

  // ------------------
  // USER ACTIONS
  // ------------------

  public selectEntity(entity: Entity): void {
    this.recordService.selectedEntity.set(entity);
    this.nzQuery.getBibRecord(entity).subscribe((bib) => {
      this.recordService.selectedEntityDetails.set(bib);
    });
  }

  public refresh(): Observable<RefreshPageResponse> {
    return this.eventsService.refreshPage();
  }

  public reset(): void {
    this.idrefSearchService.reset();
    this.idrefRecordService.reset();
  }

}
