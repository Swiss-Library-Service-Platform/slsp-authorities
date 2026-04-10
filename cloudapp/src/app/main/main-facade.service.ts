/* eslint-disable @typescript-eslint/member-ordering */
import { computed, inject, Injectable, signal } from '@angular/core';
import { CloudAppEventsService, AlertService, Entity, EntityType, RefreshPageResponse } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, tap, catchError, EMPTY, forkJoin, switchMap, of, finalize, Observable } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { LoadingIndicatorService } from '../services/loading-indicator.service';
import { NzBibRecordService } from '../services/nz-bib-record.service';
import { SelectedEntityStateService } from '../services/selected-entity-state.service';
import { IdrefQueryBuilderService } from './entity-detail/idref-search-results/idref-query-builder.service';
import { BibRecordFieldModifierService } from './biblio-record/marc-field-editor/bib-record-field-modifier.service';


@Injectable({
	providedIn: 'root',
})
export class MainFacadeService {
	/** Rôles et autorisations institutionnelles. */
	public authChecked = signal(false);
	public hasCatalogerRole = signal(false);
	public isInstitutionAllowed = signal(false);

	private eventsService = inject(CloudAppEventsService);
	private alert = inject(AlertService);
	private translate = inject(TranslateService);
	private auth = inject(AuthenticationService);
	private loader = inject(LoadingIndicatorService);
	private selectedEntityState = inject(SelectedEntityStateService);
	private nzBibRecordService = inject(NzBibRecordService);
	private idrefQueryBuilder = inject(IdrefQueryBuilderService);
	private bibRecordFieldModifierService = inject(BibRecordFieldModifierService);

	public entities = toSignal<Entity[]>(
		this.eventsService.entities$.pipe(
			filter((entities) => entities.every((e) => e.type === EntityType.BIB_MMS)),

			tap(() => this.selectedEntityState.resetSelectedEntity()),

			tap((entities) => {
				if (entities.length === 1) {
					this.selectEntity(entities[0]);
				}
			}),

			catchError((error) => {
				this.alert.error(this.translate.instant('error.eventServiceError', [(error as Error).message]), {
					autoClose: false,
				});

				return EMPTY;
			})
		)
	);

	/** Expose l'entité sélectionnée. */
	public selectedEntity = computed(() => this.selectedEntityState.selectedEntity());

	/** Expose les détails de l'entité sélectionnée. */
	public selectedEntityDetails = computed(() => this.selectedEntityState.selectedEntityDetails());

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
					this.authChecked.set(true);

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

				catchError(() => of({} as RefreshPageResponse)),

				finalize(() => this.loader.hide())
			)
			.subscribe();
	}

	// ------------------
	// ACTIONS UTILISATEUR
	// ------------------

	public selectEntity(entity: Entity): void {
		this.selectedEntityState.selectedEntity.set(entity);
		this.refreshSelectedEntityDetails();
	}

	public refresh(): Observable<RefreshPageResponse> {
		return this.eventsService.refreshPage();
	}

	public reset(): void {
		this.bibRecordFieldModifierService.reset();
		this.selectedEntityState.resetSelectedEntity();
		this.idrefQueryBuilder.reset();
	}

	public refreshSelectedEntityDetails(): void {
		this.loader.show();
		this.nzBibRecordService
			.refreshSelectedEntityDetails$()
			.pipe(
				catchError(() => {
					const mmsId = this.selectedEntityState.selectedEntity()?.id ?? '';

					this.selectedEntityState.resetSelectedEntity();
					this.alert.error(
						this.translate.instant('error.proxyErrorMmsIdNotFound', [mmsId]),
						{ autoClose: false }
					);

					return EMPTY;
				}),
				finalize(() => this.loader.hide())
			)
			.subscribe();
	}
}
