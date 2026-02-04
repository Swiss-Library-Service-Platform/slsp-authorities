import { Injectable, signal } from '@angular/core';
import { Entity } from '@exlibris/exl-cloudapp-angular-lib';

@Injectable({
  providedIn: 'root'
})
export class RecordServiceService {

  private selectedEntity= signal<Entity | null>(null);

  public setSelectedEntity(selectedEntity:Entity|null): void{
    this.selectedEntity.set(selectedEntity);
  }

  public getSelectedEntity(): Entity|null{
    return this.selectedEntity();
  }

  public resetSelecedEntity():void{
    this.selectedEntity.set(null)
  }
}
