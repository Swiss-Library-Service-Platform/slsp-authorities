/* eslint-disable @typescript-eslint/member-ordering */
import { computed, inject, Injectable, signal } from '@angular/core';
import { CloudAppEventsService, AlertService, Entity, EntityType, RefreshPageResponse } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, tap, catchError, EMPTY, forkJoin, switchMap, of, finalize, Observable } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { LoadingIndicatorService } from '../services/loading-indicator.service';
import { NZQueryService } from '../services/nzquery.service';
import { RecordService } from '../services/record.service';
import { IdrefRecordService } from './entity-detail/idref-record/idref-record.service';
import { searchService } from './biblio-record/search/search.service';

@Injectable({
	providedIn: 'root',
})
export class MainFacadeService {
	/** Rôles et autorisations institutionnelles. */
	public hasCatalogerRole = signal(false);
	public isInstitutionAllowed = signal(false);

	private eventsService = inject(CloudAppEventsService);
	private alert = inject(AlertService);
	private translate = inject(TranslateService);
	private auth = inject(AuthenticationService);
	private loader = inject(LoadingIndicatorService);
	private recordService = inject(RecordService);
	private nzQuery = inject(NZQueryService);
	private idrefRecordService = inject(IdrefRecordService);
	private searchService = inject(searchService);

	public entities = toSignal<Entity[]>(
		this.eventsService.entities$.pipe(
			filter((entities) => entities.every((e) => e.type === EntityType.BIB_MMS)),

			tap(() => this.recordService.resetSelectedEntity()),

			tap((entities) => {
				if (entities.length === 1) {
					this.selectEntity(entities[0]);
				}
			}),

			catchError((error) => {
				this.alert.error(this.translate.instant('error.restApiError', [(error as Error).message]), {
					autoClose: false,
				});

				return EMPTY;
			})
		)
	);

	/** Expose l'entité sélectionnée. */
	public selectedEntity = computed(() => this.recordService.selectedEntity());

	/** Expose les détails de l'entité sélectionnée. */
	public selectedEntityDetails = computed(() => this.recordService.selectedEntityDetails());

	// ------------------
	// LOGIQUE D'INITIALISATION
	// ------------------

	public init(): void {
		this.loader.show();

		forkJoin({
			hasRole: this.auth.checkUserRoles$(),
			allowed: this.auth.isInstitutionAllowed$(),
		})
			.pipe(
				tap(({ hasRole, allowed }) => {
					this.hasCatalogerRole.set(hasRole);
					this.isInstitutionAllowed.set(allowed);

					if (!hasRole)
						this.alert.error(this.translate.instant('error.catalogerRoleError'), {
							autoClose: false,
						});

					if (!allowed)
						this.alert.error(this.translate.instant('error.institutionAllowedError'), {
							autoClose: false,
						});
				}),

				switchMap(() => this.refresh()),

				catchError(() => {
					this.alert.warn(this.translate.instant('main.acceptRefreshModal'));

					return of({} as RefreshPageResponse);
				}),

				finalize(() => this.loader.hide())
			)
			.subscribe();
	}

	// ------------------
	// ACTIONS UTILISATEUR
	// ------------------

	public selectEntity(entity: Entity): void {
		this.recordService.selectedEntity.set(entity);
		this.nzQuery.refreshSelectedEntityDetails();
	}

	public refresh(): Observable<RefreshPageResponse> {
		return this.eventsService.refreshPage();
	}

	public reset(): void {
		this.searchService.reset();
		this.recordService.resetSelectedEntity();
		this.idrefRecordService.reset();
	}

	public refreshSelectedEntityDetails(): void {
		this.nzQuery.refreshSelectedEntityDetails();
	}
}
