import { Injectable, signal } from '@angular/core';
import { xmlEntry } from '../models/bib-records';

@Injectable({
  providedIn: 'root'
})
export class BiblioReferencedEntryService {

  //on a besoin de sauvegarder la notice que l'on est en train de modifier car comme il n'y a pas d'id sur les champs

  private savedCurrentEntry = signal<xmlEntry | undefined>(undefined);

  public setSavedCurrentEntry(entry: xmlEntry): void{
		this.savedCurrentEntry.set(entry);
	}

	public getSavedCurrentEntry(): xmlEntry |undefined {
		return this.savedCurrentEntry();
	}
}
