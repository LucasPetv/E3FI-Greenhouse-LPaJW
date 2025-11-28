# Gewächshaus Steuerung - Frontend

Modernes Web-Dashboard zur Überwachung und Steuerung der Gewächshaus-Simulation.

## Features

- 📊 **Echtzeit-Dashboard** mit Live-Updates über WebSocket
- 🏠 **Gewächshaus-Übersicht** mit allen 4 Gewächshäusern
- 📋 **Detailansicht** für jedes Gewächshaus mit 8 Tischen
- 🎛️ **Steuerung**:
  - Bewässerung pro Tisch
  - Düngung pro Tisch (nur mit Bewässerung)
  - Belüftung (Fan) pro Gewächshaus
  - Abschattung pro Gewächshaus (0-100%)
- 📈 **Sensor-Visualisierung**:
  - Temperatur
  - Luftfeuchtigkeit
  - Bodenfeuchtigkeit
  - Bodenfruchtbarkeit
  - Pflanzenanzahl und -größe
- ✅ **Ernte-Status**: Zeigt an, wann Pflanzen versandbereit sind

## Installation

1. Starte den Backend-Server:
```bash
cd ../server
npm start
```

2. Öffne das Frontend:
```bash
# Einfach index.html im Browser öffnen
# ODER einen lokalen Server verwenden:
npx http-server -p 8080
```

3. Öffne im Browser: `http://localhost:8080` oder direkt die `index.html`

## Verwendung

### Dashboard
- Zeigt Gesamtübersicht aller Gewächshäuser
- Statistiken: Anzahl Gewächshäuser, Tische, Pflanzen, Durchschnittsgröße

### Gewächshaus auswählen
- Klicke auf eine Gewächshaus-Karte
- Detailansicht öffnet sich mit allen 8 Tischen
- Steuerung von Belüftung und Abschattung

### Tisch-Details
- Klicke auf einen Tisch in der Detailansicht
- Modal öffnet sich mit allen Sensor-Daten
- Steuerung von Bewässerung und Düngung
- Ernte-Status mit Versand-Bereitschaft

## Technologien

- **HTML5** - Struktur
- **CSS3** - Modernes, responsives Design mit Glasmorphismus
- **Vanilla JavaScript** - Keine Frameworks, nur pure JS
- **WebSocket** - Echtzeit-Updates vom Server
- **REST API** - Kommunikation für Steuerungsbefehle

## Design

- 🎨 Dunkles Theme mit Grün-Akzenten
- 📱 Voll responsiv für mobile Geräte
- ✨ Smooth Animationen und Transitions
- 🎯 Intuitive Benutzeroberfläche

## API-Endpunkte

Das Frontend kommuniziert mit folgenden API-Endpunkten:

- `GET /api/greenhouses` - Alle Gewächshäuser
- `GET /api/greenhouses/:id/sensors` - Details eines Gewächshauses
- `GET /api/tables/:greenhouseId/:tableId` - Details eines Tisches
- `POST /api/tables/:id/water` - Bewässerung steuern
- `POST /api/tables/:id/fertilizer` - Düngung steuern
- `POST /api/greenhouses/:id/fan` - Belüftung steuern
- `POST /api/greenhouses/:id/shading` - Abschattung steuern

## WebSocket

Verbindung zu: `ws://localhost:3000`

Empfängt Live-Updates der Sensordaten alle paar Sekunden.
