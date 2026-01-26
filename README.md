
# SLSPAuthorities CloudApp — Documentation

⚠️**Attention**, pour le moment cette cloudapp est en développement et toutes les fonctionnalités ne sont pas encore implémentées.

## 1. Introduction

### 1.1. Description  
La CloudApp *SLSPAuthorities* vise à simplifier les workflows de catalogage, actuellement rendus complexes par l’intégration IdRef dans Alma.  
La version de base permet :  
- la recherche directe dans IdRef pour effectuer des liens d’autorité,  
- la possibilité pour des catalogueurs *sans accès IdRef* de demander la création ou modification d’autorités IdRef,  
- la liaison facilitée entre notices bibliographiques et autorités IdRef.

### 1.2. Nom de la CloudApp  
**SLSPAuthorities** est proposé comme nom centralisant tous les services liés aux autorités, afin d’éviter la multiplication des CloudApps dans le futur.

⚠️**Actuellement** la cloudapp utilise uniquement les notices liés à Idref.
---

## 2. Prérequis

L’utilisateur typique est un catalogueur Alma qui veut pouvoir modifier les liens vers les notices d'authorités d'une notice bibliographique.

---

## 3. Architecture

Le CloudApp doit :  
- interroger IdRef pour récupérer les autorités ;  
- lire et modifier les notices bibliographiques de l’Alma NZ.

⚠️ **Un NZ API key est requis**. L’API CloudApp standard **ne permet pas d’accéder aux données NZ**.  
→ Un **proxy** est nécessaire pour stocker la clé et transmettre les requêtes vers Alma NZ.  

Côté IdRef, aucun proxy n’est requis (pas d’authentification).

---

## 4. CloudApp

### 4.1. Ouverture de la CloudApp
La CloudApp doit être ouverte avec une ou plusieurs notices actives dans Alma  
Sinon → message d’erreur : **No active record, please open a bibliographical record in the Metadata editor**.


Cas possibles :  
- une seule notice → ouverture directe,  
- plusieurs notices → affichage d’une liste.

---

### 4.2. Affichage de la notice courante

Fonctionnalités :  
- **Affichage par défaut** → uniquement les champs pertinents (100, 110, 650, 651, 655, …)  
- **Affichage étendu** → bouton permettant de voir la notice complète  
- Codes couleur :  
  - **Jaune** → champ pertinent sans autorité IdRef (modifiable)  
  - **Gris** → autorité non-IdRef (non modifiable)  
  - **Vert** → autorité IdRef (modifiable)  
- Affichage du titre (champ 245 ou autre logique à tester)  
- Bouton « Enregistrer & actualiser »  
- Barre de recherche IdRef

---

### 4.3. modification des notices bibliographique

⚠️**Pas encore implémenté**

---

### 4.4. Recherche dans IdRef

⚠️**Pas encore implémenté**

---

### 4.5. Création/modification du champs 902


⚠️**Pas encore implémenté**

---

## 5. IdRef

### 5.1. API Solr

**Endpoint :**  
`https://www.idref.fr/Sru/Solr`

Pour effectuer des recherches dans Idref, la cloudapp utilise l'API munie du moteur de recherche Solr de Idre.

documentation: https://documentation.abes.fr/aideidrefdeveloppeur/index.html

---

### 5.2. Afficher le detail d'une notice d'authorité

Pour récupérer le detail d'une notice d'authorité, la cloudapp utilise l'endpoint suivant:
`https://www.idref.fr/{PPN}.xml`

---

## 6. NZ et proxy SLSP

Le proxy doit :  
- vérifier les rôles utilisateur (l'utilisateur doit avoir le rôle catalogueur, id=204)
- vérifier l’IZ et l’environnement (SLSP uniquement)  

---


## Documentation

- API IdRef : https://documentation.abes.fr/aideidrefdeveloppeur/index.html#UtiliserApiSolr  
- Autres CloudApps similaires : *(à compléter)*