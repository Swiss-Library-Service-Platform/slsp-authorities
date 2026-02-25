import { inject, Injectable, signal } from '@angular/core';
import { of, map, tap, take, catchError, shareReplay, finalize, forkJoin, mapTo, switchMap } from 'rxjs';
import { Observable } from 'rxjs';
import { Settings } from '../models/settings.model';
import {
	CloudAppConfigService,
	CloudAppSettingsService,
} from '@exlibris/exl-cloudapp-angular-lib';
import { LoadingIndicatorService } from './loading-indicator.service';
import { Config } from '../models/config.model';

@Injectable({
	providedIn: 'root',
})
export class InitService {
	// Membres publics.
	public loader = inject(LoadingIndicatorService);

	// Signal de suivi de l'état d'initialisation.
	public initialized = signal(false);

	// Observable qui se complète quand l'initialisation est terminée.
	public initialized$: Observable<void>;

	// Membres privés.
	private settingsService = inject(CloudAppSettingsService);
	private configService = inject(CloudAppConfigService);
	private settingsReady$: Observable<Settings>;
	private configReady$: Observable<Config>;

	public constructor() {
		this.loader.show();
		this.settingsReady$ = this.ensureSettings$().pipe(
			shareReplay({ bufferSize: 1, refCount: false })
		);
		this.configReady$ = this.ensureConfig$().pipe(
			shareReplay({ bufferSize: 1, refCount: false })
		);
		this.initialized$ = this.initialize().pipe(
			tap(() => this.initialized.set(true)),
			shareReplay({ bufferSize: 1, refCount: false }),
			finalize(() => this.loader.hide())
		);
	}

	/**
	 * Initialise les settings et la config au démarrage.
	 * Crée des valeurs par défaut si elles n'existent pas.
	 * À appeler via APP_INITIALIZER au démarrage de l'app.
	 */
	public initialize(): Observable<void> {
		return forkJoin({
			settings: this.settingsReady$,
			config: this.configReady$,
		}).pipe(
			mapTo(void 0),
			take(1),
			catchError((err) => {
				console.error('Erreur lors de l\'initialisation: ', err);

				// On continue même en cas d'erreur (l'app peut se charger partiellement)
				return of(void 0);
			})
		);
	}

	public getConfig$(): Observable<Config> {
		return this.configReady$;
	}

	private ensureSettings$(): Observable<Settings> {
		return this.settingsService.get().pipe(
			take(1),
			switchMap((settings) => {
				if (settings?.userSignature) {
					return of(settings as Settings);
				}

				const defaultSettings = new Settings();

				return this.settingsService.set(defaultSettings).pipe(map(() => defaultSettings));
			})
		);
	}

	private ensureConfig$(): Observable<Config> {
		return this.configService.get().pipe(
			take(1),
			switchMap((config) => {
				if (config?.proxyUrl) {
					return of(config as Config);
				}

				const defaultConfig = new Config();

				return this.configService.set(defaultConfig).pipe(map(() => defaultConfig));
			})
		);
	}
}
