
// proxy.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
  AlertService,
  CloudAppEventsService,
  CloudAppRestService,
  Entity,
  HttpMethod
} from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError, EMPTY, finalize, forkJoin, map, mapTo, Observable, of,
  shareReplay, switchMap, tap, throwError, take
} from 'rxjs';
import { LoadingIndicatorService } from './loading-indicator.service';
import { Bib, DataField, xmlEntry } from '../models/bib-records';
import { environment } from '../environments/environment';
import { areDataFieldsEqual, marcRecordToXml, xmlEntryToDataField, xmlToMarcRecord } from '../utils/stringUtils';

@Injectable({ providedIn: 'root' })
export class ProxyService {
  /** ✅ Émet 1 fois quand init$ est prêt */
  public readonly ready$: Observable<void>;
  public loader = inject(LoadingIndicatorService);
  private alert = inject(AlertService);
  private translate = inject(TranslateService);
  private eventsService = inject(CloudAppEventsService);
  private restService = inject(CloudAppRestService);
  private http = inject(HttpClient);
  private entity = signal<Entity | undefined>(undefined);

  private httpOptions!: { headers: HttpHeaders; params: { isProdEnvironment: boolean } };
  private baseUrl = environment.proxyUrl;

  /** 🔁 Initialisation (token + httpOptions), faite une seule fois */
  private init$: Observable<void>;

  public constructor() {
    this.init$ = this.createInit$();
    this.ready$ = this.init$.pipe(take(1)); // garantit 1 seule émission
  }

  public setEntity(entity: Entity): void {
    this.entity.set(entity);
  }

  public getEntity(): Entity | undefined {
    return this.entity();
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMsg = (error as any)?.message || (error as any)?.statusText || 'Unknown error';

        this.alert.error(this.translate.instant('error.restApiError', [errorMsg]), { autoClose: false });

        return EMPTY;
      }),
      finalize(() => this.loader.hide()),
    );
  }

  /** Récupère la notice bib de la NZ pour l'entité sélectionnée
   *  puis fait une deuxième requête basée sur ce résultat
   */
  public updateBibRecord(selectedEntry: xmlEntry, updatedDataField: DataField): Observable<Bib> {
    return this.ensureAccess$().pipe(
      switchMap(() => {
        const entity = this.entity();

        if (!entity) {
          return throwError(() => new Error('Aucune entité sélectionnée.'));
        }

        return this.getNzMmsIdFromEntity(entity);
      }),
      switchMap((nzMmsId) => {
        console.log(nzMmsId)

        // 1ère requête : récupérer l'entité la plus à jour
        return this.http.get<Bib>(
          `${this.baseUrl}/p/api-eu.hosted.exlibrisgroup.com/almaws/v1/bibs/${nzMmsId}`,
          this.httpOptions,
        ).pipe(
          // 2ème requête : utiliser le Bib (ou nzMmsId) pour un nouvel appel
          switchMap((bib) => {

            const marcRecord = xmlToMarcRecord(bib.anies[0]);
            const index = marcRecord.dataFields.findIndex(field =>
              areDataFieldsEqual(field, xmlEntryToDataField(selectedEntry))
            );


            console.log(marcRecord)
            
            
            if (index !== -1) {
              // Mise à jour
              marcRecord.dataFields[index] = updatedDataField;
            } else {
              // Ajout si non trouvé
              marcRecord.dataFields.push(updatedDataField);
            }

            console.log(marcRecord)


            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return this.http.get<any>(
              `${this.baseUrl}/some/other/endpoint/${marcRecord}`,
              this.httpOptions,
            );
          }),
        );
      }),
      catchError((error) => {
        const errorMsg =
          (error)?.message ||
          (error)?.statusText ||
          'Unknown error';

        this.alert.error(
          this.translate.instant('error.restApiError', [errorMsg]),
          { autoClose: false },
        );

        return EMPTY;
      }),
      finalize(() => this.loader.hide()),
    );
  }

  // ---------------------------
  // 🔐 Vérifications d'accès
  // ---------------------------

  /** ✅ Attend l'init avant d'appeler l'API rôles */
  public checkUserRoles$(): Observable<boolean> {
    return this.ready$.pipe(
      switchMap(() =>
        this.http.get<{ hasRequiredRoles: boolean }>(
          `${this.baseUrl}/check-user-roles`,
          this.httpOptions,
        ),
      ),
      map((res) => res?.hasRequiredRoles ?? false),
      catchError((error) => {
        console.error('Role check failed:', error);

        return of(false);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  /** ✅ Attend l'init avant d'appeler l'API d’autorisation d’IZ */
  public isInstitutionAllowed$(): Observable<boolean> {
    return this.ready$.pipe(
      switchMap(() => this.http.get(`${this.baseUrl}/isallowed`, this.httpOptions)),
      map((response) => !!response),
      catchError((error) => {
        console.error('Institution check failed:', error);

        return of(false);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  /**
   * Retrieves the NZ MMS ID from the given entity.
   */
  private getNzMmsIdFromEntity(entity: Entity): Observable<string> {
    const id = entity.id;

    console.log("entity: ", entity)

    if (entity.link.indexOf('?nz_mms_id') >= 0) {
      return of(id);
    }

    return this.restService.call({
      method: HttpMethod.GET,
      url: entity.link,
      queryParams: { view: 'brief' }
    }).pipe(
      switchMap(response => {
        const nzMmsId: string = response?.linked_record_id?.value;

        if (!nzMmsId) throw new Error('No NZ MMSID found in linked record');

        return of(nzMmsId);
      }),
      catchError(error => {
        console.error('Error retrieving NZ MSSID. Trying with entity ID.', error);

        return of(entity.id);
      }),
      shareReplay(1)
    );
  }

  /** ⚙️ Construit httpOptions une fois */
  private createInit$(): Observable<void> {
    return forkJoin({
      initData: this.eventsService.getInitData(),
      authToken: this.eventsService.getAuthToken(),
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
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  /** S'assure que tout est prêt & autorisé (utilisé par getBibRecord) */
  private ensureAccess$(): Observable<void> {
    return this.ready$.pipe( // ✅ attend l'init
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
