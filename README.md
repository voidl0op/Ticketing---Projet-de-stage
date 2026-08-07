# Ticketing - Projet de stage

Système de gestion des incidents informatiques : les utilisateurs créent un compte, se connectent, déclarent des tickets d'incident, et consultent la liste de leurs tickets.

Ce projet a été réalisé dans le cadre d'un stage pour apprendre le développement backend (Flask + MySQL). Il n'est **pas destiné à un usage en production** — la sécurité (mots de passe en clair, pas de sessions serveur, etc.) a volontairement été laissée simple pour se concentrer sur l'apprentissage du flux frontend ↔ backend ↔ base de données.

## Stack technique

- **Frontend** : HTML / CSS / JavaScript vanilla (pas de framework)
- **Backend** : Python (Flask)
- **Base de données** : MySQL

## Structure du projet

```
frontend/
  index.html          → page d'inscription (point d'entrée)
  pages/
    login.html         → connexion
    list.html           → liste des tickets de l'utilisateur connecté
    ticket.html         → création d'un nouveau ticket
  css/
  js/
  assets/

backend/
  app.py               → routes de l'API Flask
  db.py                → connexion à la base MySQL
  .env                 → identifiants de connexion (non versionné, à créer soi-même)
```

## Prérequis

- [Python 3.9+](https://www.python.org/downloads/)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (en local ou distant) + un client comme MySQL Workbench
- Un navigateur web

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/voidl0op/Ticketing---Projet-de-stage.git
cd Ticketing---Projet-de-stage
```

### 2. Créer la base de données et les tables

Dans MySQL Workbench (ou tout autre client SQL) :

```sql
CREATE DATABASE ticketing;
USE ticketing;

CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  user_email    VARCHAR(255) NOT NULL UNIQUE,
  user_password VARCHAR(255) NOT NULL,
  user_role     ENUM('0','1','2') NOT NULL DEFAULT '2',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ticket (
  ticket_id          INT AUTO_INCREMENT PRIMARY KEY,
  titre              VARCHAR(255) NOT NULL,
  categorie          ENUM('systeme','reseau','admins','helpdesk') NOT NULL,
  priorite           ENUM('informationelle','haute','critique') NOT NULL,
  description_ticket TEXT NOT NULL,
  user_id            INT,
  statut             ENUM('nouveau','en cours','résolu','cloturé') NOT NULL DEFAULT 'nouveau',
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

> `user_role` : `'0'` = admin, `'1'` = agent, `'2'` = utilisateur standard (rôle par défaut à l'inscription).

### 3. Configurer les variables d'environnement

Créer un fichier `backend/.env` (il n'est pas versionné, voir `.gitignore`) :

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=ticketing
```

### 4. Installer les dépendances Python

```bash
cd backend
pip install flask flask-cors mysql-connector-python python-dotenv
```

### 5. Lancer le backend

```bash
python app.py
```

L'API tourne alors sur `http://127.0.0.1:5000`.

### 6. Lancer le frontend

Le frontend est en HTML/CSS/JS statique — il suffit d'ouvrir `frontend/index.html` dans un navigateur, ou d'utiliser une extension comme **Live Server** (VS Code) pour éviter d'éventuels soucis de chemins relatifs.

> Le backend accepte les requêtes cross-origin (`flask-cors`), donc peu importe sur quel port le frontend tourne.

## Utilisation

1. **Inscription** (`index.html`) — créer un compte
2. **Connexion** (`pages/login.html`) — se connecter avec l'email/mot de passe créés
3. **Créer un ticket** (`pages/ticket.html`) — titre, description, catégorie, priorité
4. **Liste des tickets** (`pages/list.html`) — voir ses propres tickets

## Limitations connues

- Les mots de passe sont stockés en clair (pas de hachage)
- Pas de système de session côté serveur — l'état de connexion n'est géré que côté client
- Pas d'interface d'administration pour l'instant