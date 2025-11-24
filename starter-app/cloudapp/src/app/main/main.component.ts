import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import {
	AlertService,
	CloudAppEventsService,
	CloudAppRestService,
	Entity,
} from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { LoadingIndicatorService } from '../services/loading-indicator.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
	selector: 'app-main',
	templateUrl: './main.component.html',
	styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
	public entities: Entity[] = [];
	public selectedEntity: Entity | null = null;
	public selectedEntityDetails$: Observable<Entity> | null = null;
	public loader = inject(LoadingIndicatorService);

	private restService = inject(CloudAppRestService);
	private eventsService = inject(CloudAppEventsService);
	private alert = inject(AlertService);
	private translate = inject(TranslateService);
	private destroyRef = inject(DestroyRef);

	private entities$: Observable<Entity[]>;

	public constructor() {
		this.entities$ = this.eventsService.entities$.pipe(
			takeUntilDestroyed(this.destroyRef),
			tap(() => this.reset()),
			//filter((entities) => // filter by EntityType),
			//map((entities) => // map to custom model),
			tap((entities) => (this.entities = entities)),
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
		this.entities$.subscribe();
	}

	public selectEntity(entity: Entity): void {
		this.selectedEntity = entity;
		this.loader.show();

		this.selectedEntityDetails$ = this.restService.call(entity.link).pipe(
			finalize(() => {
				this.loader.hide();
			}),
		);
	}

	public action(): void {
		this.alert.info(this.translate.instant('main.actionMessage'), {
			autoClose: true,
		});
	}

	public reset(): void {
		this.selectedEntity = null;
	}
}
