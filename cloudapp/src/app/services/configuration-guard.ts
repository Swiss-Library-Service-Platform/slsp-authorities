import { inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { CloudAppEventsService, CloudAppRestService } from "@exlibris/exl-cloudapp-angular-lib";
import { Observable, switchMap, map } from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class ConfigurationGuard {

    private eventsService = inject(CloudAppEventsService);
    private restService = inject(CloudAppRestService);
    private router = inject(Router);

  public canActivate(): Observable<boolean> {
    return this.eventsService.getInitData().pipe(
      switchMap(initData => this.restService.call(`/users/${initData.user.primaryId}`)),
      map(user => {
        if (!user.user_role.some((role: { role_type: { value: string; }; }) => role.role_type.value === '204')) {
          this.router.navigate(['/error'],
            { queryParams: { error: 'access denied' } });

          return false;
        }

        return true;
      })
    );
  }
}
