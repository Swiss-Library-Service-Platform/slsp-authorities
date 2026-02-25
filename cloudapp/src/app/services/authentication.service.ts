import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CloudAppEventsService } from '@exlibris/exl-cloudapp-angular-lib';
import {
	catchError,
	forkJoin,
	map,
	mapTo,
	Observable,
	of,
	shareReplay,
	switchMap,
	take,
	tap,
	throwError,
} from 'rxjs';
import { InitService } from './init.service';

@Injectable({
	providedIn: 'root',
})
export class AuthenticationService {
	public readonly ready$: Observable<void>;
	public readonly hasRoles$: Observable<boolean>;
	public readonly institutionAllowed$: Observable<boolean>;
	// Services.
	private eventsService = inject(CloudAppEventsService);
	private http = inject(HttpClient);
	private initService = inject(InitService);
	private proxyUrl: string | undefined;

	// Options HTTP.
	private httpOptions!: { headers: HttpHeaders; params: { isProdEnvironment: boolean } };
	private xmlHttpOptions!: { headers: HttpHeaders; params: { isProdEnvironment: boolean } };

	/** Initialise le token et les options HTTP une seule fois. */
	private init$: Observable<void>;
	private accessState$: Observable<{ hasRoles: boolean; allowed: boolean }>;

	public constructor() {
		this.init$ = this.createInit$();
		this.ready$ = this.init$.pipe(take(1)); // Garantit une seule émission.
		this.hasRoles$ = this.createUserRolesCheck$();
		this.institutionAllowed$ = this.createInstitutionAllowedCheck$();
		this.accessState$ = forkJoin({
			hasRoles: this.hasRoles$,
			allowed: this.institutionAllowed$,
		}).pipe(shareReplay({ bufferSize: 1, refCount: false }));
	}

	// ---------------------------
	// VÉRIFICATIONS D'ACCÈS
	// ---------------------------

	/** Attend l'initialisation avant l'appel à l'API des rôles. */
	public checkUserRoles$(): Observable<boolean> {
		return this.hasRoles$;
	}

	/** Attend l'initialisation avant l'appel à l'API d'autorisation d'IZ. */
	public isInstitutionAllowed$(): Observable<boolean> {
		return this.institutionAllowed$;
	}

	/** Vérifie que l'initialisation est terminée et que l'accès est autorisé. */
	public ensureAccess$(): Observable<void> {
		return this.accessState$.pipe(
			switchMap(({ hasRoles, allowed }) => {
				if (!hasRoles || !allowed) {
					return throwError(() => new Error('Access denied'));
				}

				return of(void 0);
			})
		);
	}

	public getReady(): Observable<void> {
		return this.ready$;
	}

	public getHttpOptions(): { headers: HttpHeaders; params: { isProdEnvironment: boolean } } {
		return this.httpOptions;
	}

	public getXmlHttpOptions(): { headers: HttpHeaders; params: { isProdEnvironment: boolean } } {
		return this.xmlHttpOptions;
	}

	/** Construit `httpOptions` et `proxyUrl` une seule fois. */
	private createInit$(): Observable<void> {
		return forkJoin({
			config: this.initService.getConfig$().pipe(take(1)),
			initData: this.eventsService.getInitData().pipe(take(1)),
			authToken: this.eventsService.getAuthToken().pipe(take(1)),
		}).pipe(
			tap(({ config, initData, authToken }) => {
				const proxyUrl = config.proxyUrl;
				this.proxyUrl = proxyUrl;

				const regExp = new RegExp('^https(.*)psb(.*)com/?$|.*localhost.*');
				const isProdEnvironment = !regExp.test(initData.urls.alma);

				this.httpOptions = {
					params: { isProdEnvironment },
					headers: new HttpHeaders({
						Authorization: `Bearer ${authToken}`,
						'Content-Type': 'application/json',
					}),
				};

				this.xmlHttpOptions = {
					params: { isProdEnvironment },
					headers: new HttpHeaders({
						Authorization: `Bearer ${authToken}`,
						'Content-Type': 'application/xml',
					}),
				};
			}),
			mapTo(void 0),
			shareReplay({ bufferSize: 1, refCount: false })
		);
	}

	private createUserRolesCheck$(): Observable<boolean> {
		return this.ready$.pipe(
			switchMap(() => {
				if (!this.proxyUrl) {
					return of(false);
				}

				return this.http.get<{ hasRequiredRoles: boolean }>(
					`${this.proxyUrl}/check-user-roles`,
					this.httpOptions
				);
			}),
			map((res) => {
				if (typeof res === 'boolean') {
					return res;
				}

				return res?.hasRequiredRoles ?? false;
			}),
			catchError((error) => {
				console.error('Role check failed:', error);

				return of(false);
			}),
			shareReplay({ bufferSize: 1, refCount: false })
		);
	}

	private createInstitutionAllowedCheck$(): Observable<boolean> {
		return this.ready$.pipe(
			switchMap(() => {
				if (!this.proxyUrl) {
					return of(false);
				}

				return this.http.get(`${this.proxyUrl}/isallowed`, this.httpOptions);
			}),
			map((response) => !!response),
			catchError((error) => {
				console.error('Institution check failed:', error);

				return of(false);
			}),
			shareReplay({ bufferSize: 1, refCount: false })
		);
	}
}
