import { Injectable, signal } from '@angular/core';
import { BibRecordField } from '../models/bib-records';

@Injectable({
  providedIn: 'root'
})
export class BiblioReferencedEntryService {

	// Sauvegarde la notice en cours de modification, car les champs n'ont pas d'identifiant propre.

  private savedCurrentEntry = signal<BibRecordField | undefined>(undefined);

  public setSavedCurrentEntry(entry: BibRecordField): void{
		this.savedCurrentEntry.set(entry);
	}

	public getSavedCurrentEntry(): BibRecordField |undefined {
		return this.savedCurrentEntry();
	}
}
