import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
	AlertService,
	CloudAppEventsService,
	CloudAppRestService,
	Entity,
	HttpMethod 
} from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { catchError, EMPTY, finalize, forkJoin, map, mapTo, Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { LoadingIndicatorService } from './loading-indicator.service';
import { Bib } from '../models/bib-records';
import { environment } from '../environments/environment';
@Injectable({
	providedIn: 'root',
})
export class ProxyService {
	public loader = inject(LoadingIndicatorService);
	private alert = inject(AlertService);
	private translate = inject(TranslateService);
	private eventsService = inject(CloudAppEventsService);
	private restService = inject(CloudAppRestService);
	private http = inject(HttpClient);

	private httpOptions!: object;
	private baseUrl = environment.proxyUrl;

	
/** 🔁 Flux d'initialisation, exécuté une seule fois puis rejoué à tous les abonnés */
  private init$: Observable<void>;

  public constructor() {
    this.init$ = this.createInit$();
  }

  // ---------------------------
  // 📚 Appel NZ : Bib record
  // ---------------------------

  /** Récupère la notice bib de la NZ pour l'entité sélectionnée */
  public getBibRecord(entity: Entity): Observable<Bib> {
    return this.ensureAccess$().pipe(
		switchMap(() => this.getNzMmsIdFromEntity(entity)),
      switchMap((nzMmsId) =>
        this.http.get<Bib>(
          `${this.baseUrl}/p/api-eu.hosted.exlibrisgroup.com/almaws/v1/bibs/${nzMmsId}`,
          this.httpOptions,
        ),
      ),
      catchError((error) => {
        const errorMsg =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any)?.message || (error as any)?.statusText || 'Unknown error';

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

  /**
   * Retrieves the NZ MMS ID from the given entity.
   * @param entity - The entity for which to retrieve the NZ MMS ID
   * @returns Observable of NZ MMS ID
   */
  private getNzMmsIdFromEntity(entity: Entity): Observable<string> {
    const id = entity.id;

    if (entity.link.indexOf("?nz_mms_id") >= 0) {
      return of(id);
    }

    return this.restService.call({
      method: HttpMethod.GET,
      url: entity.link,
      queryParams: { view: 'brief' }
    })
      .pipe(
        switchMap(response => {
          const nzMmsId: string = response?.linked_record_id?.value;

          if (!nzMmsId) {
            throw new Error('No NZ MMSID found in linked record');
          }

          return of(nzMmsId);
        }),
        catchError(error => {
          console.error('Error retrieving NZ MSSID. Trying with entity ID.', error);

          return of(entity.id);
        }),
        shareReplay(1)
      );
  }

  /** Crée le flux d'initialisation (token + httpOptions), partagé entre tous les abonnés */
  private createInit$(): Observable<void> {
    return forkJoin({
      initData: this.eventsService.getInitData().pipe(),
      authToken: this.eventsService.getAuthToken().pipe(),
    }).pipe(
      tap(({ initData, authToken }) => {
        const regExp = new RegExp('^https(.*)psb(.*)com/?$|.*localhost.*');
        const isProdEnvironment = !regExp.test(initData.urls.alma);

        this.httpOptions = {
          params: { isProdEnvironment },
          headers: new HttpHeaders({
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          }),
        };
      }),
      mapTo(void 0),
      // 🔁 Pour que l'init ne se fasse qu'une seule fois
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  // ---------------------------
  // 🔐 Vérifications d'accès
  // ---------------------------

  /** Vérifie que l'utilisateur a les rôles requis (Observable<boolean>) */
  private checkUserRoles$(): Observable<boolean> {
    return this.http
      .get<{ hasRequiredRoles: boolean }>(
        `${this.baseUrl}/check-user-roles`,
        this.httpOptions,
      )
      .pipe(
        map((res) => res?.hasRequiredRoles ?? false),
        catchError((error) => {
          console.error('Role check failed:', error);

          // En cas d'erreur, on considère que ce n’est pas ok
          return of(false);
        }),
      );
  }

  /** Vérifie que l'IZ est autorisée à utiliser la CloudApp (Observable<boolean>) */
  private isInstitutionAllowed$(): Observable<boolean> {
    return this.http
      .get(`${this.baseUrl}/isallowed`, this.httpOptions)
      .pipe(
        map((response) => !!response),
        catchError((error) => {
          console.error('Institution check failed:', error);

          return of(false);
        }),
      );
  }

  /** S'assure que tout est prêt & autorisé avant d'appeler l'API NZ */
  private ensureAccess$(): Observable<void> {
    return this.init$.pipe(
      switchMap(() =>
        forkJoin({
          hasRoles: this.checkUserRoles$(),
          allowed: this.isInstitutionAllowed$(),
        }),
      ),
      switchMap(({ hasRoles, allowed }) => {
        if (!hasRoles || !allowed) {
          return throwError(() => new Error('Access denied'));
        }

        return of(void 0);
      }),
    );
  }
}
