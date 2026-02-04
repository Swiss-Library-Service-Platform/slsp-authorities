import { Injectable, signal } from '@angular/core';
import { Entity } from '@exlibris/exl-cloudapp-angular-lib';

@Injectable({
  providedIn: 'root'
})
export class RecordService {

  public selectedEntity= signal<Entity | null>(null);

  public setSelectedEntity(selectedEntity:Entity|null): void{
    console.log(selectedEntity)
    this.selectedEntity.set(selectedEntity);
  }


  public resetSelecedEntity():void{
    this.selectedEntity.set(null)
  }
}
