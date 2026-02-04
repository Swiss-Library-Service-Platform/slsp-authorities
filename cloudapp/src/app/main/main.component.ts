/* eslint-disable @typescript-eslint/no-explicit-any */

// main.component.ts
import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import {
  AlertService,
  CloudAppEventsService,
  Entity,
  EntityType,
  RefreshPageResponse,
} from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, Observable, forkJoin, of } from 'rxjs';
import { catchError, filter, finalize, switchMap, tap } from 'rxjs/operators';
import { LoadingIndicatorService } from '../services/loading-indicator.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Bib } from '../models/bib-records';
import { ProxyService } from '../services/proxy.service';;
import { RecordService } from '../services/record.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  public entities: Entity[] = [];
  public selectedEntityDetails$: Observable<Bib> = EMPTY;
  public loader = inject(LoadingIndicatorService);
  public hasCatalogerRole = false;
  public isInstitutionAllowed = false;
  public recordService = inject(RecordService)
  public selectedEntity = computed(() => this.recordService.selectedEntity())

  private eventsService = inject(CloudAppEventsService);
  private alert = inject(AlertService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private proxyService = inject(ProxyService);

  private entities$: Observable<Entity[]>;

  public constructor() {
    this.entities$ = this.eventsService.entities$.pipe(
      filter((entities) => entities.every((e) => e.type === EntityType.BIB_MMS)),
      takeUntilDestroyed(this.destroyRef),
      tap(() => this.reset()),
      tap((entities) => (this.entities = entities)),
      tap((entities) => { if (entities.length === 1) this.selectEntity(entities[0]); }),
      catchError((error) => {
        const errorMsg = (error as Error).message;

        this.alert.error(this.translate.instant('error.restApiError', [errorMsg]), { autoClose: false });

        return EMPTY;
      }),
    );
  }

  public ngOnInit(): void {
    this.loader.show();

    // ✅ Attend implicitement ready$ via les méthodes publiques du service
    forkJoin({
      hasRole: this.proxyService.checkUserRoles$(),
      allowed: this.proxyService.isInstitutionAllowed$(),
    }).pipe(
      tap(({ hasRole, allowed }) => {
        this.hasCatalogerRole = hasRole;
        this.isInstitutionAllowed = allowed;

        if (!hasRole) {
          this.alert.error(this.translate.instant('error.catalogerRoleError'), { autoClose: false });
        }

        if (!allowed) {
          this.alert.error(this.translate.instant('error.institutionAllowedError'), { autoClose: false });
        }
      }),
      // Ensuite seulement, on déclenche le refresh de la page
      switchMap(() => this.refresh()),
      tap(() => console.log('Refresh terminé, je peux continuer')),
      catchError((err) => {
        console.error('Erreur pendant l’initialisation/refresh', err);

        return of<RefreshPageResponse>({} as any);
      }),
      finalize(() => this.loader.hide()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    // Abonnement aux entités
    this.entities$.subscribe();
  }

  public selectEntity(entity: Entity): void {
    this.recordService.setSelectedEntity(entity)
    this.loader.show();
    console.log(entity);
    this.proxyService.setEntity(entity)
    this.selectedEntityDetails$ = this.proxyService.getBibRecord(entity);
  }

  public reset(): void {
    this.recordService.resetSelecedEntity()
  }

  public refresh(): Observable<RefreshPageResponse> {
    return this.eventsService.refreshPage();
  }
}
