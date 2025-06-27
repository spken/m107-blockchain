# Handhabung der CertiChain Applikation

## Übersicht

**CertiChain** ist eine dezentrale Blockchain-Applikation zur Verwaltung von Bildungszertifikaten. Die Anwendung besteht aus einem **Backend** (Node.js Server auf Port 3001) und einem **Frontend** (React/Vite Webinterface).

## Startseite und Navigation

### Hauptnavigation

Die Anwendung verfügt über 7 Hauptbereiche, die über Tabs zugänglich sind:

| Tab | Icon | Beschreibung |
|-----|------|--------------|
| **Dashboard** | 🏠 | Übersicht aller Zertifikate |
| **Issue Certificate** | ➕ | Neue Zertifikate ausstellen |
| **Verify Certificate** | 🔍 | Zertifikate überprüfen |
| **Wallets** | 🏆 | Wallet-Verwaltung |
| **Mempool** | ⏰ | Warteschlange für Transaktionen |
| **Blockchain** | 🧱 | Blockchain-Übersicht |
| **Network** | 🌐 | Netzwerk-Management |

### Header-Bereich

Der Header zeigt wichtige Systeminformationen:
- **CertiChain Logo** und Titel
- **Institution-Badge** mit aktueller Bildungseinrichtung
- **Netzwerk-Status** (Online/Offline/Initialisierung)
- **Verbindungsfehler-Anzeige** mit Retry-Button

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

## Workflow der Anwendung

### Hauptfunktionen

#### 1. **Dashboard (Startseite)**
**Zweck:** Zentrale Übersicht aller ausgestellten Zertifikate

**Funktionen:**
- 📋 Anzeige aller Zertifikate in Tabellenform
- 🔍 Suchfunktion nach Zertifikaten
- ✅ Schnelle Verifikation einzelner Zertifikate
- 👁️ Detailansicht durch Klick auf Zertifikat
- 🔄 Refresh-Button für manuelle Aktualisierung

#### 2. **Zertifikat ausstellen (Issue Certificate)**
**Zweck:** Neue Bildungszertifikate erstellen und in die Blockchain einbringen

**Workflow:**
1. Formular ausfüllen:
   - Empfänger-Name
   - Kurs-/Studiengangsname
   - Institution
   - Abschlussdatum
   - Zusätzliche Informationen
2. **Submit** klicken
3. Zertifikat wird als Transaktion in den Mempool eingereiht
4. Automatische Weiterleitung zum **Mempool-Tab**
5. Mining-Prozess beginnt automatisch

#### 3. **Zertifikat verifizieren (Verify Certificate)**
**Zweck:** Authentizität und Gültigkeit von Zertifikaten überprüfen

**Workflow:**
1. Zertifikat-ID eingeben (Format: `cert_1234567890`)
2. **Verify** klicken
3. Blockchain-basierte Verifikation startet
4. Ergebnis-Anzeige:
   - ✅ **Gültig:** Grüne Bestätigung mit Zertifikatsdetails
   - ❌ **Ungültig:** Rote Warnung mit Fehlerbeschreibung
5. Bei gültigen Zertifikaten: Link zur Detailansicht

#### 4. **Wallets**
**Zweck:** Verwaltung von Kryptographie-Schlüsseln und Adressen

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

## Besonderheiten

### Benutzerfreundlichkeit
- **Keine Blockchain-Kenntnisse erforderlich:** Alle technischen Prozesse laufen im Hintergrund
- **Automatische Führung:** System leitet neue Nutzer durch die Initialisierung
- **Responsive Design:** Funktioniert auf Desktop und Tablet
- **Echtzeit-Feedback:** Sofortiges visuelles Feedback bei allen Aktionen

### Sicherheit
- **Blockchain-Integrität:** Alle Zertifikate sind manipulationssicher gespeichert
- **Kryptographische Verifikation:** Digitale Signaturen für alle Transaktionen
- **Dezentrale Architektur:** Keine Single-Point-of-Failure
- **DSGVO-konform:** Keine personenbezogenen Daten auf der Blockchain

### Performance
- **Schnelle Verifikation:** Zertifikats-Checks in unter 2 Sekunden
- **Effizientes Mining:** Automatische Difficulty-Anpassung
- **Cached Data:** Intelligente Daten-Zwischenspeicherung für bessere UX
- **Optimierte API:** Minimale Latenz zwischen Frontend und Backend

---

*Erstellt am 27. Juni 2025 | CertiChain v1.0*
