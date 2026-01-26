import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import {
	AlertService,
	CloudAppEventsService,
	Entity,
	EntityType,
	RefreshPageResponse,
} from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, filter, finalize, tap } from 'rxjs/operators';
import { LoadingIndicatorService } from '../services/loading-indicator.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Bib } from '../models/bib-records';
import { ProxyService } from '../services/proxy.service';

@Component({
	selector: 'app-main',
	templateUrl: './main.component.html',
	styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
	public entities: Entity[] = [];
	public selectedEntity: Entity | null = null;
	public selectedEntityDetails$: Observable<Bib> = EMPTY;
	public loader = inject(LoadingIndicatorService);
	public authToken!: string;

	/** XML content of the selected record */
	//public xml: string;
	/** String representation of XML content */
	//public xmlString: string;

	private eventsService = inject(CloudAppEventsService);
	private alert = inject(AlertService);
	private translate = inject(TranslateService);
	private destroyRef = inject(DestroyRef);
	private proxyService = inject(ProxyService);

	private entities$: Observable<Entity[]>;

	public constructor() {
		this.entities$ = this.eventsService.entities$.pipe(
			//filter in order to select only bibrecords
			filter((entities) =>
				entities.every((entity) => entity.type === EntityType.BIB_MMS),
			),
			//seulement les entité présentes dans la NZ TODO: c'ets pas très propre, ça ne fonctionne que pour la NZ
			/*filter((entities) =>
				entities.every((entity) => entity.id.endsWith("01")),
			),*/
			takeUntilDestroyed(this.destroyRef),
			tap(() => this.reset()),
			//filter((entities) => // filter by EntityType),
			//map((entities) => // map to custom model),
			tap((entities) => (this.entities = entities)),

			// si un seul entity, auto-sélection
			tap((entities) => {
				if (entities.length === 1) {
					this.selectEntity(entities[0]);
				}
			}),

			catchError((error) => {
				const errorMsg = (error as Error).message;

				this.alert.error(
					this.translate.instant('error.restApiError', [errorMsg]),
					{
						autoClose: false,
					},
				);

				return EMPTY;
			}),
			finalize(() => {
				this.loader.hide();
			}),
		);
	}

	public ngOnInit(): void {
		this.loader.show();

		this.refresh().subscribe({
			next: () => {
				// ✅ Ici, on est sûr que le refresh est TERMINÉ
				console.log('Refresh terminé, je peux continuer');
			},
			error: (err) => {
				console.error('Erreur pendant le refresh', err);
			},
		});
		this.entities$.subscribe();
	}

	public selectEntity(entity: Entity): void {
		this.selectedEntity = entity;
		this.loader.show();
		console.log(entity)
		this.selectedEntityDetails$ = this.proxyService.getBibRecord(entity);
	}

	public action(): void {
		this.alert.info(this.translate.instant('main.actionMessage'), {
			autoClose: true,
		});
	}

	public reset(): void {
		this.selectedEntity = null;
	}

	public refresh(): Observable<RefreshPageResponse> {
		return this.eventsService.refreshPage();
	}
}
