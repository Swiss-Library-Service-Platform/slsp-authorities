import { inject, Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';


@Injectable({
  providedIn: 'root'
})
export class IconService {
  private readonly matIconRegistry = inject(MatIconRegistry);
  private readonly domSanitizer = inject(DomSanitizer);

  public constructor() {
    this.registerIcons();
  }

  private registerIcons(): void {
    const icons: Record<string, string> = {
      congres: 'assets/icons/congres.svg',
      famille: 'assets/icons/famille.svg',
      personne: 'assets/icons/personne.svg',
      titre_uniforme: 'assets/icons/titre_uniforme.svg',
      auteur_titre: 'assets/icons/auteur_titre.svg',
      sujet: 'assets/icons/sujet.svg',
      nom_marque: 'assets/icons/nom_marque.svg',
      nom_geographique: 'assets/icons/nom_geographique.svg',
      forme_genre: 'assets/icons/forme_genre.svg',
    };

    Object.entries(icons).forEach(([name, path]) => {
      this.matIconRegistry.addSvgIcon(
        name,
        this.domSanitizer.bypassSecurityTrustResourceUrl(path)
      );
    });
  }
}
