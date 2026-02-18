import { Injectable, signal } from '@angular/core';
import { Entity } from '@exlibris/exl-cloudapp-angular-lib';
import { NzBibRecord } from '../models/bib-records';


@Injectable({
	providedIn: 'root',
})
export class RecordService {
	public selectedEntity = signal<Entity | null>(null);
	public selectedEntityDetails = signal<NzBibRecord | undefined>(undefined);

	public resetSelectedEntity(): void {
		this.selectedEntity.set(null);
	}
}
