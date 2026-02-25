# Contributing

## Objectif

Ce document fixe les règles minimales pour garder un code lisible, harmonieux et simple à reprendre.

## Principes d'architecture

- UI components: affichage, événements utilisateur, aucun traitement métier lourd.
- Feature services/facades: orchestration des cas d'usage.
- Data services: appels HTTP et accès aux APIs externes.
- Models: fichiers `*.model.ts` dans `cloudapp/src/app/models`.

Flux attendu:

1. UI intent
2. orchestration service/facade
3. data service
4. state update (`signal`/`computed`)
5. rendu UI

## Règles RxJS / Signals

- Dans les composants, utiliser `takeUntilDestroyed()` pour les abonnements.
- Éviter les `subscribe()` imbriqués; préférer `switchMap`, `forkJoin`, `catchError`, `finalize`.
- Garder les side effects UI (alertes, loaders) au niveau façade/feature, pas dans les utilitaires purs.

## Règles de code

- Pas de nouveaux fichiers `setting.ts` / `config.ts` legacy, utiliser `settings.model.ts` et `config.model.ts`.
- Garder les noms explicites (pas de variables 1 lettre hors itérateurs locaux).
- Pas de `console.log` permanent dans le code métier.
- Limiter les commentaires aux cas non évidents.

## Checklist PR

- [ ] Le flux de données suit la chaîne UI -> orchestration -> data -> state.
- [ ] Aucune logique métier nouvelle dans un composant UI.
- [ ] Pas de régression de route (`/`, `/settings`, `/config`).
- [ ] `npm run lint` passe localement.
- [ ] La documentation (`README.md`) reste alignée si l'architecture change.

## Nettoyage structure

Le dossier `cloudapp/src/app/main/services` est considéré obsolète (vide). Ne pas y ajouter de nouveaux fichiers.
