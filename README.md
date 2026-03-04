# SLSP Authorities Cloud App

Application Angular (Ex Libris Alma Cloud App) pour rechercher des autorités IdRef et enrichir/modifier des champs MARC sur des notices bibliographiques NZ.

## Objectif fonctionnel

- Charger la notice NZ de l'entité Alma sélectionnée.
- Rechercher des autorités IdRef à partir des champs MARC de la notice.
- Injecter/mettre à jour/supprimer des champs MARC (dont le cas spécifique `902`).
- Gérer configuration et paramètres utilisateur depuis l'interface Cloud App.

## Stack technique

- Angular `18`
- RxJS `7`
- Angular Material
- `@exlibris/exl-cloudapp-angular-lib`
- `@ngx-translate/core`

## Démarrage

Prérequis:

- Node.js `22.x`
- Ex Libris Cloud App CLI (`eca`)

Installation:

```bash
npm install
```

Lancement dev:

```bash
npm start
```

Build:

```bash
npm run build
```

## Structure du code

Code principal dans `cloudapp/src/app`:

- `main/`: feature principale (liste des entités, détail notice, recherche IdRef, formulaires MARC)
- `services/`: services transverses (auth, init, requêtes NZ, IdRef, etc.)
- `models/`: modèles métier (`*.model.ts`)
- `configuration/`: écran de config app (`proxyUrl`)
- `settings/`: écran de settings utilisateur (`pageSize`, signature, etc.)

Fichiers pivots:

- `main/main-facade.service.ts`: orchestration haut niveau de la vue principale
- `services/nzquery.service.ts`: appels Alma/NZ et mutation des notices
- `services/idref.service.ts`: appels IdRef + état résultat/détail
- `main/entity-detail/idref-record/idref-record.service.ts`: construction de requêtes IdRef depuis le contexte MARC

## Flux de données (référence)

1 main.ts
-Soit on affiche la liste des notices bibliographiques que alma met à disposition via entities$
-Soit une notice est séléctionné et on affiche le detail de cette notice via entity-details

Lorsque l'on selectionne une notice bibliographique dans le main.ts, on apelle recordService.selectedEntity.set() 
c'est recordService qui sert de référence à la notice bibliographique que l'on manipule

2 recordService.ts
    c'est le service qui sert de référence à la notice bibliographique que l'on manipule.
    -il contient selectedEntity qui est l'entité séléctionné depuis les notices dans entites$ de main.ts
    -selectedEntityDetails est également un signal qui correspond à la notice bibliographique de la NZ. Elle est mise à jour par nzquery.service.ts  dans la méthode getBibRecord() elle même appelé par refreshSelectedEntityDetails$

    cette partie là des données correspond grossièrement aux composants à gauche de l'interface

3 idrefService.ts

4 bibRecordFieldModifierService.ts

## Routes

- `#/` → vue principale
- `#/settings` → paramètres utilisateur
- `#/config` → configuration application (protégée par `ConfigurationGuard`)

## Scripts utiles

- `npm start` : lance `eca start`
- `npm run build` : lance `eca build`
- `npm run lint` : vérification ESLint
- `npm run lint:fix` : correction ESLint automatique
- `npm run format` : formatage Prettier
- `npm test` : tests via `eca test`

## Conventions de maintenance

- Préférer `*.model.ts` pour les modèles de domaine.
- Éviter les `subscribe()` imbriqués; composer les flux RxJS.
- Éviter les logs de debug permanents dans les services métier.
- Toute nouvelle feature doit expliciter: `UI intent -> orchestration -> data service -> state`.

## Ressources

- https://developers.exlibrisgroup.com/cloudapps/
- https://angular.dev/

