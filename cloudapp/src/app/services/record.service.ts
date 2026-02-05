import { Injectable, signal } from '@angular/core';
import { Entity } from '@exlibris/exl-cloudapp-angular-lib';
import { Bib } from '../models/bib-records';

@Injectable({
	providedIn: 'root',
})
export class RecordService {
	public selectedEntity = signal<Entity | null>(null);
	public selectedEntityDetails = signal<Bib | undefined>(undefined);

	
  public resetSelectedEntity(): void {
		this.selectedEntity.set(null);
	}
}
