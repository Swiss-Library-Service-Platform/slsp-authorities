import { Injectable, signal } from '@angular/core';
import { BibRecordField } from '../models/bib-records';

@Injectable({
  providedIn: 'root'
})
export class BiblioReferencedEntryService {

  //on a besoin de sauvegarder la notice que l'on est en train de modifier car comme il n'y a pas d'id sur les champs

  private savedCurrentEntry = signal<BibRecordField | undefined>(undefined);

  public setSavedCurrentEntry(entry: BibRecordField): void{
		this.savedCurrentEntry.set(entry);
	}

	public getSavedCurrentEntry(): BibRecordField |undefined {
		return this.savedCurrentEntry();
	}
}
