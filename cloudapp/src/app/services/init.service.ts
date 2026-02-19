import { inject, Injectable } from '@angular/core';
import { switchMap, of, map, tap, take } from 'rxjs';
import { Settings } from '../models/setting';
import { CloudAppSettingsService } from '@exlibris/exl-cloudapp-angular-lib';
import { MainFacadeService } from '../main/main-facade.service';
import { LoadingIndicatorService } from './loading-indicator.service';

@Injectable({
  providedIn: 'root'
})
export class InitService {

    public loader = inject(LoadingIndicatorService);
    public facade = inject(MainFacadeService);
    private settingsService = inject(CloudAppSettingsService);

  public constructor() {
    this.settingsService.get().pipe(
        // 1. Si settings existent, on les garde.
        //    Sinon on crée des settings par défaut.
        switchMap(settings => {
          if (settings.proxyUrl) {
            return of(settings);
          }
    
          const defaultSettings = new Settings();
        
          return this.settingsService.set(defaultSettings).pipe(
            // on renvoie les settings créés pour la suite de la chaîne
            map(() => defaultSettings)
          );
        }),
    
        // 2. On logge les settings finaux (ceux existants ou ceux nouvellement créés)
        tap(settings => console.log('Final settings: ', settings)),
    
        // 3. On ne s’abonne qu’une fois et on termine
        take(1)
      ).subscribe({
        next: () => {
          // 4. À ce stade, on est certain que les settings existent
          this.facade.init();
        },
        error: (err) => {
          console.error('Erreur lors de l’initialisation des settings: ', err);
          // éventuellement : gestion d’erreur user-friendly
        }
      });
   }
}
