import { Component, computed, inject} from '@angular/core';
import { Entity } from '@exlibris/exl-cloudapp-angular-lib';
import { MainFacadeService } from '../main-facade.service';

@Component({
	selector: 'app-entity-list',
	templateUrl: './entity-list.component.html',
  styleUrl: './entity-list.component.scss',
})
export class EntityListComponent {
	
private facade = inject(MainFacadeService);

  // On lit directement les entités exposées par le facade
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public entities = computed<Entity[]>(() => this.facade.entities() ?? []);

  public selectEntity(entity: Entity): void {
    this.facade.selectEntity(entity);
  }

}
