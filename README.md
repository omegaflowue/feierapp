# Feierplanungsapp

Eine Webanwendung zur Planung von Events und Feiern.

## Technologien
- Frontend: Vue.js
- Backend: Yii Framework (PHP)
- Datenbank: MySQL

## Features

### Feierplaner
- Erstellen von Einladungen mit Datum, Uhrzeit, Ort
- Versenden von Einladungslinks an Gäste
- Übersicht über Zu-/Absagen
- Verwaltung von Kinderanzahl pro Gast
- Organisation von Speisen/Getränken
- Erfassung von Unverträglichkeiten
- Besondere Hinweise und Beachtenswertes

### Gäste
- Anzeige der Einladung über personalisierten Link
- RSVP (Zu-/Absage)
- Eingabe persönlicher Informationen
- Jederzeit änderbar über personalisierten Link

## Struktur
```
/backend    - Yii Framework API
/frontend   - Vue.js Application
/database   - SQL Schema
```