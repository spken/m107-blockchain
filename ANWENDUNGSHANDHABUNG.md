# Handhabung der CertiChain Applikation

## Inhaltsverzeichnis

- [Übersicht](#übersicht)
- [Anwendung starten](#anwendung-starten)
  - [1. Backend starten](#1-backend-starten)
  - [2. Frontend starten](#2-frontend-starten)
  - [3. Automatische Initialisierung](#3-automatische-initialisierung)
- [Startseite und Navigation](#startseite-und-navigation)
  - [Hauptnavigation](#hauptnavigation)
  - [Header-Bereich](#header-bereich)
- [Workflow der Anwendung](#workflow-der-anwendung)
  - [Hauptfunktionen](#hauptfunktionen)
  - [Typischer Arbeitsablauf](#typischer-arbeitsablauf)
- [Automatisierte Prozesse](#automatisierte-prozesse)
  - [Hintergrund-Automatisierung](#hintergrund-automatisierung)
  - [Status-Anzeigen](#status-anzeigen)
- [Fehlerbehebung](#fehlerbehebung)
  - [Häufige Probleme und Lösungen](#häufige-probleme-und-lösungen)
  - [Experten-Tipps](#experten-tipps)
- [Besonderheiten](#besonderheiten)
  - [Benutzerfreundlichkeit](#benutzerfreundlichkeit)
  - [Sicherheit](#sicherheit)
  - [Performance](#performance)

---

## Übersicht

**CertiChain** ist eine dezentrale Blockchain-Applikation zur Verwaltung von Bildungszertifikaten. Die Anwendung besteht aus einem **Backend** (Node.js Server auf Port 3001 (Hauptsächlich) und einem Netzwerk von das aus Port 3001, 3002, 3003 besteht) und einem **Frontend** (React/Vite Webinterface).

## Anwendung starten

### 1. Backend starten

```bash
cd backend
npm install
npm run nodes
```

- Server läuft auf allen Nodes (3001, 3002, 3003)
- API-Endpunkte werden verfügbar

### 2. Frontend starten

```bash
cd frontend
npm install
npm run dev
```

- Webinterface läuft auf Port 5173 (http://localhost:5173/)
- Automatische Verbindung zum Backend und Netzwerk

### 3. Automatische Initialisierung

- Bei erster Verbindung wird das Blockchain-Netzwerk automatisch initialisiert
- Anzeige: "Initializing Blockchain Network"
- Genesis-Block wird erstellt
- Netzwerk-Peers werden konfiguriert

## Startseite und Navigation

### Hauptnavigation

Die Anwendung verfügt über 7 Hauptbereiche, die über Tabs zugänglich sind:

| Tab                    | Icon | Beschreibung                    |
| ---------------------- | ---- | ------------------------------- |
| **Dashboard**          | 🏠   | Übersicht aller Zertifikate     |
| **Issue Certificate**  | ➕   | Neue Zertifikate ausstellen     |
| **Verify Certificate** | 🔍   | Zertifikate überprüfen          |
| **Wallets**            | 🏆   | Wallet-Verwaltung               |
| **Mempool**            | ⏰   | Warteschlange für Transaktionen |
| **Blockchain**         | 🧱   | Blockchain-Übersicht            |
| **Network**            | 🌐   | Netzwerk-Management             |

### Header-Bereich

Der Header zeigt wichtige Systeminformationen:

- **CertiChain Logo** und Titel
- **Institution-Badge** mit aktueller Bildungseinrichtung
- **Netzwerk-Status** (Online/Offline/Initialisierung)
- **Verbindungsfehler-Anzeige** mit Retry-Button

## Workflow der Anwendung

### Hauptfunktionen

#### 1. **Dashboard (Startseite)**

**Zweck:** Zentrale Übersicht aller ausgestellten Zertifikate

**Funktionen:**

- Anzeige aller Zertifikate in Tabellenform
- Suchfunktion nach Zertifikaten
- Schnelle Verifikation einzelner Zertifikate
- Detailansicht durch Klick auf Zertifikat
- Refresh-Button für manuelle Aktualisierung

#### 2. **Zertifikat ausstellen (Issue Certificate)**

**Zweck:** Neue Bildungszertifikate erstellen und in die Blockchain einbringen

**Workflow:**

1. **Recipient Wallet auswählen:**
   - Aus der Dropdown-Liste ein Wallet wählen ODER
   - Manuell eine Wallet-Adresse eingeben
   - _Hinweis: Falls keine Wallets verfügbar sind, zuerst unter "Wallets" ein neues Wallet erstellen_

2. **Formular ausfüllen:**
   - Empfänger-Name
   - Zertifikat-Typ (Bachelor, Master, PhD, etc.)
   - Kurs-/Studiengangsname
   - Credential Level
   - Abschlussdatum
   - Note (optional)
   - Ablaufdatum (optional)

3. **Submit** klicken
4. Zertifikat wird als Transaktion in den Mempool eingereiht
5. Automatische Weiterleitung zum **Mempool-Tab**
6. Mining-Prozess beginnt automatisch

#### 3. **Zertifikat verifizieren (Verify Certificate)**

**Zweck:** Authentizität und Gültigkeit von Zertifikaten überprüfen

**Workflow:**

1. Zertifikat-ID eingeben
   - Ansehbar bei "View" auf Certificate -> Technical Info -> Certificate ID
2. **Verify** klicken
3. Blockchain-basierte Verifikation startet
4. Ergebnis-Anzeige:
   - **Gültig:** Grüne Bestätigung mit Zertifikatsdetails
   - **Ungültig:** Rote Warnung mit Fehlerbeschreibung
5. Bei gültigen Zertifikaten: Link zur Detailansicht

#### 4. **Wallets**

**Zweck:** Verwaltung von Kryptographie-Schlüsseln und Adressen

**Funktionen:**

- **Neues Wallet erstellen:** "Create Wallet" Button klicken
- **Wallet-Label vergeben:** Benutzerfreundliche Namen
- **Public/Private Keys anzeigen:** Für technische Details
- **Transaktionshistorie:** Alle Ein- und Ausgänge
- **Zertifikate-Übersicht:** Alle dem Wallet zugewiesenen Zertifikate

**Wichtiger Hinweis:**

- Wallets müssen **vor** der Zertifikatausstellung erstellt werden
- Nach dem Erstellen sind sie sofort in der "Issue Certificate" Dropdown verfügbar
- Demo-Wallets werden automatisch erstellt, falls keine vorhanden sind

**Funktionen:**

- Anzeige aller verfügbaren Wallets
- Erstellung neuer Wallets
- Public/Private Key Management
- Transaktionshistorie pro Wallet

#### 5. **Mempool**

**Zweck:** Überwachung wartender Transaktionen

**Anzeige:**

- Liste aller offenen Transaktionen
- Zeitstempel der Einreichung
- Transaktions-Status
- Badge im Tab zeigt Anzahl wartender Transaktionen
- Automatische Aktualisierung alle 30 Sekunden

#### 6. **Blockchain**

**Zweck:** Technische Übersicht der Blockchain-Struktur

**Funktionen:**

- Anzeige aller Blöcke in chronologischer Reihenfolge
- Block-Details (Hash, Previous Hash, Timestamp)
- Transaktionen pro Block
- Netzwerk-Consensus-Informationen
- Badge zeigt aktuelle Block-Anzahl

#### 7. **Network**

**Zweck:** Netzwerk-Management und Konfiguration

**Funktionen:**

- Peer-Verbindungen verwalten
- Institution registrieren/bearbeiten
- Netzwerk-Status überwachen
- Manuelle Netzwerk-Initialisierung

## Typischer Arbeitsablauf

### Für Institutionen (Zertifikat ausstellen)

1. **Verbindung prüfen** → Grüner Punkt im Header = System bereit
2. **Dashboard** → Überblick über bestehende Zertifikate
3. **Issue Certificate** → Neues Zertifikat erstellen
4. **Mempool** → Transaktion im Mining-Prozess beobachten
5. **Dashboard** → Bestätigung des neuen Zertifikats

### Für Verifizierer (Zertifikat prüfen)

1. **Verify Certificate** öffnen
2. Zertifikat-ID eingeben
3. Verifikationsergebnis abwarten
4. Bei Bedarf: Detailansicht öffnen

### Für Administratoren (System-Überwachung)

1. **Network** → Peer-Status prüfen
2. **Blockchain** → Block-Integrität kontrollieren
3. **Mempool** → Transaktions-Durchsatz überwachen

## Automatisierte Prozesse

### Hintergrund-Automatisierung

- **Auto-Initialisierung** des Blockchain-Netzwerks bei Erststart
- **Periodischer Consensus** alle 30 Sekunden zur Synchronisation
- **Live-Updates** aller Daten ohne manuelles Refresh
- **Fehlerbehandlung** mit automatischem Retry-Mechanismus
- **Mining-Automatik** für wartende Transaktionen

### Status-Anzeigen

- **Verbindungsstatus:** Echtzeit-Anzeige der Backend-Verbindung
- **Mining-Status:** Live-Updates während Block-Mining
- **Sync-Status:** Anzeige der Netzwerk-Synchronisation
- **Error-Handling:** Benutzerfreundliche Fehlermeldungen mit Lösungsvorschlägen

## Fehlerbehebung

### Probleme und Lösungen (falls sie auftauchen würden)

#### **Problem: "Keine Wallets in Certificate Issuance verfügbar"**

**Ursache:** Noch keine Wallets erstellt
**Lösung:**

1. Zum **Wallets-Tab** wechseln
2. **"Create Wallet"** klicken
3. Optional: Wallet-Label eingeben
4. Zurück zu **"Issue Certificate"** - Wallet sollte jetzt verfügbar sein

#### **Problem: "Certificate Verification failed"**

**Ursache:** Falsche oder nicht existierende Zertifikat-ID
**Lösung:**

1. ID aus dem Dashboard kopieren
2. Vollständige ID ohne Leerzeichen eingeben
3. Falls Problem bestehen bleibt: Blockchain-Sync prüfen

#### **Problem: "Backend Connection Failed"**

**Ursache:** Backend-Server nicht gestartet
**Lösung:**

1. Terminal öffnen: `cd backend`
2. Server starten: `npm run nodes`
3. Warten bis "Node initialized" erscheint
4. Frontend neu laden

#### **Problem: "Transaction stuck in Mempool"**

**Ursache:** Mining-Prozess unterbrochen
**Lösung:**

1. Im **Mempool-Tab** prüfen
2. Warten (Mining erfolgt automatisch alle 15 Sekunden)
3. Bei längerem Warten: Backend neu starten

#### **Problem: "Network Initialization Failed"**

**Ursache:** Port-Konflikte oder Node-Kommunikation gestört
**Lösung:**

1. Alle Node-Prozesse beenden
2. Ports prüfen: 3001, 3002, 3003
3. Backend mit `npm run nodes` neu starten
4. ca. 30s für vollständige Initialisierung warten
