import { Component, input, output } from '@angular/core';
import { Entity } from '@exlibris/exl-cloudapp-angular-lib';

@Component({
	selector: 'app-entity-list',
	templateUrl: './entity-list.component.html',
})
export class EntityListComponent {
	public entities = input.required<Entity[]>();
	public selectedEntity = output<Entity>();

	public selectEntity(entity: Entity): void {
		this.selectedEntity.emit(entity);
	}
}
