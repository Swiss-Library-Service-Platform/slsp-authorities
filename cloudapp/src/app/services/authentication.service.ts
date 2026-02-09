import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CloudAppEventsService } from '@exlibris/exl-cloudapp-angular-lib';
import { catchError, forkJoin, map, mapTo, Observable, of, shareReplay, switchMap, take, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  public readonly ready$: Observable<void>;

  private proxyUrl= environment.proxyUrl;

  //Services
  private eventsService = inject(CloudAppEventsService);
  private http = inject(HttpClient);

  //httpOptions
  private httpOptions!: { headers: HttpHeaders; params: { isProdEnvironment: boolean } };
  private xmlHttpOptions!: { headers: HttpHeaders; params: { isProdEnvironment: boolean } };

  /** 🔁 Initialisation (token + httpOptions), faite une seule fois */
  private init$: Observable<void>;

  public constructor() {
    this.init$ = this.createInit$();
    this.ready$ = this.init$.pipe(take(1)); // garantit 1 seule émission
  }

    // ---------------------------
    // 🔐 Vérifications d'accès
    // ---------------------------
  
    /** ✅ Attend l'init avant d'appeler l'API rôles */
    public checkUserRoles$(): Observable<boolean> {
      return this.ready$.pipe(
        switchMap(() =>
          this.http.get<{ hasRequiredRoles: boolean }>(
            `${this.proxyUrl}/check-user-roles`,
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
      switchMap(() => this.http.get(`${this.proxyUrl}/isallowed`, this.httpOptions)),
      map((response) => !!response),
      catchError((error) => {
        console.error('Institution check failed:', error);

        return of(false);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

    /** S'assure que tout est prêt & autorisé */
  public ensureAccess$(): Observable<void> {
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

  public getReady():Observable<void>{
    return this.ready$;
  }

  public getHttpOptions():{ headers: HttpHeaders; params: { isProdEnvironment: boolean } }{
    return this.httpOptions;
  }

  public getXmlHttpOptions():{ headers: HttpHeaders; params: { isProdEnvironment: boolean } }{
    return this.xmlHttpOptions;
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

        this.xmlHttpOptions = {
          params: { isProdEnvironment },
          headers: new HttpHeaders({
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/xml',
          }),
        };


      }),
      mapTo(void 0),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }
}
