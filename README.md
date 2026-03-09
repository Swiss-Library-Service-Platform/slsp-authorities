# SLSP Authorities Cloud App

> [Français](#français) | [English](#english)

---

## Français

Application Angular (Ex Libris Alma Cloud App) pour rechercher des autorités IdRef et enrichir/modifier des champs MARC sur des notices bibliographiques NZ.

### Objectif fonctionnel

- Charger la notice NZ de l'entité Alma sélectionnée.
- Rechercher des autorités IdRef à partir des champs MARC de la notice.
- Injecter/mettre à jour/supprimer des champs MARC (dont le cas spécifique `902`).
- Gérer configuration et paramètres utilisateur depuis l'interface Cloud App.

### Stack technique

- Angular `18`
- RxJS `7`
- Angular Material
- `@exlibris/exl-cloudapp-angular-lib`
- `@ngx-translate/core`

### Démarrage

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

### Structure du code

Code principal dans `cloudapp/src/app`:

- `main/`: feature principale (liste des entités, détail notice, recherche IdRef, formulaires MARC)
- `services/`: services transverses (auth, init, requêtes NZ, IdRef, etc.)
- `models/`: modèles métier (`*.model.ts`)
- `configuration/`: écran de config app (`proxyUrl`)
- `settings/`: écran de settings utilisateur (`pageSize`, signature, etc.)

Fichiers pivots:

- `main/main-facade.service.ts`: orchestration haut niveau de la vue principale
- `services/nz-bib-record.service.ts`: appels Alma/NZ et mutation des notices
- `services/selected-bib-field.service.ts`: état du champ MARC sélectionné + résolution de structure
- `main/entity-detail/idref-search-results/idref-query-builder.service.ts`: construction de requêtes IdRef depuis le contexte MARC

### Flux de données (référence)

### 1 main.ts ###
    -Soit on affiche la liste des notices bibliographiques que alma met à disposition via entities$
    -Soit une notice est séléctionné et on affiche le detail de cette notice via entity-details
    Lorsque l'on selectionne une notice bibliographique dans le main.ts, on apelle selectedEntityState.selectedEntity.set()
    c'est selectedEntityState qui sert de référence à la notice bibliographique que l'on manipule

### 2 selectedEntityStateService.ts ###
    c'est le service qui sert de référence à la notice bibliographique que l'on manipule.
    -il contient selectedEntity qui est l'entité séléctionné depuis les notices dans entites$ de main.ts
    -selectedEntityDetails est également un signal qui correspond à la notice bibliographique de la NZ. Elle est mise à jour par nz-bib-record.service.ts dans la méthode getBibRecord() elle même appelé par refreshSelectedEntityDetails$

### 3 selectedBibFieldService.ts ###
    c'est le service qui contient les valeurs qui vont être écrites dans le marc-field-form.component.ts et le to902.component.ts.
    La valeur du signal de selectedFieldFromBibRecord peut être modifier depuis:
    -biblio-record.component via le pushToInput utiliser dans le template.
    -marc-field-form.component qui appelle sa méthode onSearch qui elle même appelle bib-record-field-modifier.service via setSelectedFieldFromBibRecord qui va modifier selectedFieldFromBibRecord.
    -idref-search-results.component qui va appelé la méthode updateSelectedEntryWithPPN du service idrefQueryBuilder qui va mettre à jour selectedFieldFromBibRecord.

### 4 bibRecordFieldModifierService.ts ###
    Ce service contient les méthodes qui sont utilisé dans le marc-field-form.component et le to902.component pour mettre à jour les valeurs des champs de l'entité. derrière pour faire les requettes, c'est le NzBibRecordService qui est appelé.

    Ce service est aussi utilisé pour gérer l'affichage des composants to902 et marcFieldForm, alors que cette logique devrait être géré par un autre service.

### 5 idrefQueryBuilderService.ts ###
    Ce service contient la source de donnée pour le formulaire de recherche idref du composant idref-search-results.component.ts
    Il est remplis depuis les sources suivantes:
    - bibliorecord.component via le bouton edit
    - marc-field-form.component via searchFromCurrentEntryContext qui apelle searchFromFormValues
    - idref-search-results.component via le formulaire

### 6 editing-field-backup.service ###
    ce service garde une reference à la notice bibliographique que l'on modifie, elle sert dans le cas où il faut retrouver la notice que l'on modifie depuis l'api de alma (apreès une modification d'un champs par exemple)

### 7 idref-search.service ###
    Ce service gère la recherche dans IdRef et stocke le résultat via le signal `idrefResult`. Il est appelé par `idrefQueryBuilder` via `searchFromQuery$()`.

### 8 authority-details.service ###
    Ce service stocke le détail d'une autorité IdRef pour un PPN donné via le signal `idrefAuthorityDetail`. Il récupère le XML depuis l'API IdRef et le parse en document DOM.

### 9 nz-bib-record.service ###
    c'est ce service qui est responsable de faire les apelles à la NZ en passant par le proxy.

### Améliorations à faire ###
    -Dans tous ces services, le ronomage de certaines fonctions, attributs, variables, etc. permettrait de comprendre bien plus facilement le comportement et la logique de la cloudapp.
    -Il y a deux méthodes onSearch dans le projet, une dans main-form.component et une dans idref-record.components il faudrait la factoriser en normant les processus de parsing plus généralement dans la cloudapp.

### Erreurs et warnings de l'application

Le tableau ci-dessous répertorie les messages de type **error** et **warn** affichés via `AlertService`.

| Type | Clé i18n | Affiché quand | Pourquoi | Traduction française |
|---|---|---|---|---|
| Error | `error.eventServiceError` | Échec de lecture `entities$` dans `MainFacadeService` | Le flux d'événements Cloud App n'a pas pu être consommé correctement. | Une erreur s'est produite avec le service d'événements d'Alma, il n'y a aucune entité ou détail à afficher |
| Error | `error.catalogerRoleError` | Initialisation (`MainFacadeService.init`) si l'utilisateur n'a pas le rôle catalogueur | Bloquer/alerter un profil insuffisant pour les opérations métier. | Vous avez besoin du rôle de catalogueur pour utiliser cette Cloud App |
| Error | `error.institutionAllowedError` | Initialisation (`MainFacadeService.init`) si l'institution n'est pas autorisée | Signaler un contexte institutionnel non supporté. | Votre institution n'est pas autorisée à utiliser cette Cloud App |
| Error | `error.proxyErrorMmsIdNotFound` | Échec du rafraîchissement des détails NZ (`refreshSelectedEntityDetails`) | Impossible de charger la notice NZ depuis le proxy (MMS ID introuvable ou erreur proxy). | Cette notice ne peut pas être modifiée. |
| Error | `error.eventServiceError` | Échec de recherche IdRef (`IdrefRecordService.searchFromFormValues`) | La recherche IdRef n'a pas abouti. | Une erreur s'est produite avec le service d'événements d'Alma, il n'y a aucune entité ou détail à afficher |
| Error | `error.eventServiceError` | Échec du chargement des détails d'autorité (`IdrefRecordComponent.showDetails`) | Le détail de l'autorité IdRef n'a pas pu être récupéré. | Une erreur s'est produite avec le service d'événements d'Alma, il n'y a aucune entité ou détail à afficher |
| Error | `error.eventServiceError` | Échec de suppression ou de rafraîchissement après suppression (`DeleteDialogComponent.onDelete`) | La suppression du champ MARC ou la resynchronisation NZ a échoué. | Une erreur s'est produite avec le service d'événements d'Alma, il n'y a aucune entité ou détail à afficher |
| Error | `search.noSelectedEntry` | Action update/add sans entrée de référence (`BibRecordFieldModifierService`) | Aucune ligne MARC n'est sélectionnée comme cible de mutation. | Aucune entrée sélectionnée |
| Warn | `search.updateNotAllowed` | Tentative de mise à jour d'un champ avec `$$0` hors `IDREF`/`RERO` | Empêcher la modification de champs avec des identifiants externes non autorisés. | Clé non trouvée dans `fr.json` (traduction manquante) |
| Error | `search.form.error.no$$2With$$0In6xx` | Tag `6xx` contenant `$$0 (IDREF)` sans `$$2 idref` | Enforce de cohérence MARC pour les champs 6xx liés à IdRef. | Le sous-champ $$2 idref est manquant, merci de corriger avant d'insérer le champ |
| Error | `search.form.error.emptyTag` | Champ `tag` vide au moment de valider le formulaire | Empêcher une mutation MARC invalide sans tag. | Impossible d'ajouter un champ sans étiquette, merci de corriger pour l'ajouter. |
| Warn | `search.deleteNotAllowed` | Tentative de suppression d'un champ protégé (`BiblioRecordComponent.deleteField`) | Prévenir la suppression d'un champ non autorisé par la règle métier MARC. | Clé non trouvée dans `fr.json` (traduction manquante) |
| Error | `search.to902.error.emptySignature` | Création/mise à jour du 902 sans signature utilisateur (`To902FormComponent`) | Le sous-champ `$$5` nécessite une signature pour tracer l'opération. | La signature utilisateur est vide, veuillez la remplir dans les paramètres. |
| Error | `config.messages.saveError` | Échec de sauvegarde de la configuration (`ConfigurationComponent.save`) | La persistance de la configuration Cloud App a échoué. | Erreur lors de l'enregistrement de la configuration |
| Error | `settings.messages.saveError` | Échec de sauvegarde des settings utilisateur (`SettingsComponent.save`) | La persistance des paramètres utilisateur a échoué. | Erreur lors de l'enregistrement des paramètres |

### Routes

- `#/` → vue principale
- `#/settings` → paramètres utilisateur
- `#/config` → configuration application (protégée par `ConfigurationGuard`)

### Scripts utiles

- `npm start` : lance `eca start`
- `npm run build` : lance `eca build`
- `npm run lint` : vérification ESLint
- `npm run lint:fix` : correction ESLint automatique
- `npm run format` : formatage Prettier
- `npm test` : tests via `eca test`

### Conventions de maintenance

- Préférer `*.model.ts` pour les modèles de domaine.
- Éviter les `subscribe()` imbriqués; composer les flux RxJS.
- Éviter les logs de debug permanents dans les services métier.
- Toute nouvelle feature doit expliciter: `UI intent -> orchestration -> data service -> state`.

### Ressources

- https://developers.exlibrisgroup.com/cloudapps/
- https://angular.dev/


---

## English

Angular application (Ex Libris Alma Cloud App) for searching IdRef authorities and enriching/modifying MARC fields on NZ bibliographic records.

### Functional Goal

- Load the NZ record of the selected Alma entity.
- Search IdRef authorities based on MARC fields from the record.
- Inject/update/delete MARC fields (including the specific `902` case).
- Manage configuration and user settings from the Cloud App interface.

### Technical Stack

- Angular `18`
- RxJS `7`
- Angular Material
- `@exlibris/exl-cloudapp-angular-lib`
- `@ngx-translate/core`

### Getting Started

Prerequisites:

- Node.js `22.x`
- Ex Libris Cloud App CLI (`eca`)

Installation:

```bash
npm install
```

Development server:

```bash
npm start
```

Build:

```bash
npm run build
```

### Code Structure

Main code in `cloudapp/src/app`:

- `main/`: main feature (entity list, record detail, IdRef search, MARC forms)
- `services/`: cross-cutting services (auth, init, NZ queries, IdRef, etc.)
- `models/`: domain models (`*.model.ts`)
- `configuration/`: app configuration screen (`proxyUrl`)
- `settings/`: user settings screen (`pageSize`, signature, etc.)

Key files:

- `main/main-facade.service.ts`: high-level orchestration of the main view
- `services/nz-bib-record.service.ts`: Alma/NZ calls and record mutations
- `services/selected-bib-field.service.ts`: selected MARC field state + structure resolution
- `main/entity-detail/idref-search-results/idref-query-builder.service.ts`: IdRef query building from MARC context

### Data Flow (Reference)

### 1 main.ts ###
    - Either we display the list of bibliographic records that Alma provides via entities$
    - Or a record is selected and we display its detail via entity-details
    When a bibliographic record is selected in main.ts, selectedEntityState.selectedEntity.set() is called.
    selectedEntityState serves as the reference for the bibliographic record being manipulated.

### 2 selectedEntityStateService.ts ###
    This is the service that serves as the reference for the bibliographic record being manipulated.
    - It contains selectedEntity, which is the entity selected from the records in entities$ of main.ts
    - selectedEntityDetails is also a signal corresponding to the NZ bibliographic record. It is updated by nz-bib-record.service.ts in the getBibRecord() method, itself called by refreshSelectedEntityDetails$

### 3 selectedBibFieldService.ts ###
    This is the service that holds the values to be written in marc-field-form.component.ts and to902.component.ts.
    The value of the selectedFieldFromBibRecord signal can be modified from:
    - biblio-record.component via pushToInput used in the template.
    - marc-field-form.component which calls its onSearch method, which in turn calls bib-record-field-modifier.service via setSelectedFieldFromBibRecord to modify selectedFieldFromBibRecord.
    - idref-search-results.component which calls the updateSelectedEntryWithPPN method of idrefQueryBuilder, which updates selectedFieldFromBibRecord.

### 4 bibRecordFieldModifierService.ts ###
    This service contains the methods used in marc-field-form.component and to902.component to update entity field values. Behind the scenes, NzBibRecordService is called to perform the requests.

    This service is also used to manage the display of the to902 and marcFieldForm components, although this display logic should be handled by a separate service.

### 5 idrefQueryBuilderService.ts ###
    This service contains the data source for the IdRef search form in the idref-search-results.component.ts component.
    It is populated from the following sources:
    - bibliorecord.component via the edit button
    - marc-field-form.component via searchFromCurrentEntryContext which calls searchFromFormValues
    - idref-search-results.component via the form

### 6 editing-field-backup.service ###
    This service keeps a reference to the bibliographic record being modified. It is used when the record needs to be retrieved from the Alma API (e.g., after a field modification).

### 7 idref-search.service ###
    This service manages IdRef searches and stores results via the `idrefResult` signal. It is called by `IdrefQueryBuilderService` via `searchFromQuery$()`.

### 8 authority-details.service ###
    This service stores the details of an IdRef authority for a given PPN via the `idrefAuthorityDetail` signal. It fetches XML from the IdRef API and parses it into a DOM document.

### 9 nz-bib-record.service ###
    This is the service responsible for making calls to the NZ through the proxy.

### Improvements to be made ###
    - In all these services, renaming certain functions, attributes, variables, etc. would make the behavior and logic of the Cloud App much easier to understand.
    - There are two onSearch methods in the project, one in main-form.component and one in idref-record.component. They should be factored out by standardizing the parsing processes more broadly in the Cloud App.

### Application Errors and Warnings

The table below lists **error** and **warn** messages displayed via `AlertService`.

| Type | i18n Key | Displayed when | Why | French translation |
|---|---|---|---|---|
| Error | `error.eventServiceError` | Failed to read `entities$` in `MainFacadeService` | The Cloud App event stream could not be consumed correctly. | Une erreur s'est produite avec le service d'événements d'Alma, il n'y a aucune entité ou détail à afficher |
| Error | `error.catalogerRoleError` | Initialization (`MainFacadeService.init`) if the user lacks the cataloguer role | Block/alert an insufficient profile for business operations. | Vous avez besoin du rôle de catalogueur pour utiliser cette Cloud App |
| Error | `error.institutionAllowedError` | Initialization (`MainFacadeService.init`) if the institution is not authorized | Report an unsupported institutional context. | Votre institution n'est pas autorisée à utiliser cette Cloud App |
| Error | `error.proxyErrorMmsIdNotFound` | Failed NZ detail refresh (`refreshSelectedEntityDetails`) | Unable to load the NZ record from the proxy (MMS ID not found or proxy error). | Cette notice ne peut pas être modifiée. |
| Error | `error.eventServiceError` | Failed IdRef search (`IdrefRecordService.searchFromFormValues`) | The IdRef search did not complete successfully. | Une erreur s'est produite avec le service d'événements d'Alma, il n'y a aucune entité ou détail à afficher |
| Error | `error.eventServiceError` | Failed to load authority details (`IdrefRecordComponent.showDetails`) | The IdRef authority details could not be retrieved. | Une erreur s'est produite avec le service d'événements d'Alma, il n'y a aucune entité ou détail à afficher |
| Error | `error.eventServiceError` | Failed deletion or post-deletion refresh (`DeleteDialogComponent.onDelete`) | The MARC field deletion or NZ resynchronization failed. | Une erreur s'est produite avec le service d'événements d'Alma, il n'y a aucune entité ou détail à afficher |
| Error | `search.noSelectedEntry` | Update/add action without a reference entry (`BibRecordFieldModifierService`) | No MARC row is selected as the mutation target. | Aucune entrée sélectionnée |
| Warn | `search.updateNotAllowed` | Attempt to update a field with `$$0` outside `IDREF`/`RERO` | Prevent modification of fields with unauthorized external identifiers. | Key not found in `fr.json` (missing translation) |
| Error | `search.form.error.no$$2With$$0In6xx` | Tag `6xx` containing `$$0 (IDREF)` without `$$2 idref` | Enforce MARC consistency for 6xx fields linked to IdRef. | Le sous-champ $$2 idref est manquant, merci de corriger avant d'insérer le champ |
| Error | `search.form.error.emptyTag` | Empty `tag` field when submitting the form | Prevent an invalid MARC mutation without a tag. | Impossible d'ajouter un champ sans étiquette, merci de corriger pour l'ajouter. |
| Warn | `search.deleteNotAllowed` | Attempt to delete a protected field (`BiblioRecordComponent.deleteField`) | Prevent deletion of a field not authorized by the MARC business rule. | Key not found in `fr.json` (missing translation) |
| Error | `search.to902.error.emptySignature` | Creating/updating 902 without a user signature (`To902FormComponent`) | The `$$5` subfield requires a signature to trace the operation. | La signature utilisateur est vide, veuillez la remplir dans les paramètres. |
| Error | `config.messages.saveError` | Failed to save configuration (`ConfigurationComponent.save`) | Cloud App configuration persistence failed. | Erreur lors de l'enregistrement de la configuration |
| Error | `settings.messages.saveError` | Failed to save user settings (`SettingsComponent.save`) | User settings persistence failed. | Erreur lors de l'enregistrement des paramètres |

### Routes

- `#/` → main view
- `#/settings` → user settings
- `#/config` → application configuration (protected by `ConfigurationGuard`)

### Useful Scripts

- `npm start`: runs `eca start`
- `npm run build`: runs `eca build`
- `npm run lint`: ESLint check
- `npm run lint:fix`: automatic ESLint fix
- `npm run format`: Prettier formatting
- `npm test`: tests via `eca test`

### Maintenance Conventions

- Prefer `*.model.ts` for domain models.
- Avoid nested `subscribe()` calls; compose RxJS streams instead.
- Avoid permanent debug logs in business services.
- Any new feature must follow: `UI intent -> orchestration -> data service -> state`.

### Resources

- https://developers.exlibrisgroup.com/cloudapps/
- https://angular.dev/