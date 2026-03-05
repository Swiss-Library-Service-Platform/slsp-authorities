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

## 1 main.ts ##
-Soit on affiche la liste des notices bibliographiques que alma met à disposition via entities$
-Soit une notice est séléctionné et on affiche le detail de cette notice via entity-details

Lorsque l'on selectionne une notice bibliographique dans le main.ts, on apelle recordService.selectedEntity.set() 
c'est recordService qui sert de référence à la notice bibliographique que l'on manipule

## 2 recordService.ts ## 
    c'est le service qui sert de référence à la notice bibliographique que l'on manipule.
    -il contient selectedEntity qui est l'entité séléctionné depuis les notices dans entites$ de main.ts
    -selectedEntityDetails est également un signal qui correspond à la notice bibliographique de la NZ. Elle est mise à jour par nzquery.service.ts  dans la méthode getBibRecord() elle même appelé par refreshSelectedEntityDetails$


## 3 idrefService.ts ## 
    c'est le service qui contient les valeurs qui vont être écrites dans le main-form.component.ts et le to902.component.ts.
    La valeur du signal de selectedFieldFromBibRecord peut être modifier depuis:
    -biblio-record.component via le pushToInput utiliser dans le template.
    -main-form.component qui appelle sa méthode onSearch qui elle même appelle bib-record-field-modifier.service via setSelectedFieldFromBibRecord qui va modifier selectedFieldFromBibRecord.
    -idref-record.component qui va appelé la méthode updateSelectedEntryWithPPN du service idrefRecordService qui va mettre à jour selectedFieldFromBibRecord.


## 4 bibRecordFieldModifierService.ts ## 
    Ce service contient les méthodes qui sont utilisé dans le main-form.component et le to902.component pour mettre à jour les valeurs des champs de l'entité. derrière pour faire les requettes, c'est le NzQuery.service qui est appelé.

    Ce service est aussi utilisé pour gérer l'affichage des composants to902 et mainForm, alors que cette logique devrait être géré par un autre service.

## 5 idrefRecordService.ts ## 
    Ce service contient la source de donnée pour le formulaire de recherche idref du composant idref-record.component.ts
    Il est remplis depuis les sources suivantes:
    - bibliorecord.component via le bouton edit
    - mainform.component via searchFromCurrentEntryContext qui apelle searchFromFormValues
    - idref-record.component via le formulaire

## 6 biblio-referenced-entry.service ## 
    ce service garde une reference à la notice bibliographique que l'on modifie, elle sert dans le cas où il faut retrouver la notice que l'on modifie depuis l'api de alma (apreès une modification d'un champs par exemple)
    
## 7 search-result.service ## 
    Ce service sert à gérer la recherche dans idref et stock également le résultat de la recherche. Dans le futur il faudrait diviser ce service car il gére aussi l'affichage
    Ce service est appelé par idref-record.service via searchFromFormValues

## 8 authority-details.service ## 
    ce service stocke le detail du résultat d'une rechercher idref pour un ppn donnée. Il sert à l'affichage de la vue complète de la ntoce d'authorité. Cependant ce service s'occupe également de l'affichage alors que ce devrait être dans un service séparé 

## 9 nzquery.service ## 
    c'est ce service qui est responsable de faire les apelles à la NZ en passant par le proxy.

amélioration à faire:
    -Dans tous ces services, le ronomage de certaines fonctions, attributs, variables, etc. permettrait de comprendre bien plus facilement le comportement et la logique de la cloudapp.
    -Il y a deux méthodes onSearch dans le projet, une dans main-form.component et une dans idref-record.components il faudrait la factoriser en normant les processus de parsing plus généralement dans la cloudapp.

## Erreurs et warnings de l'application

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

