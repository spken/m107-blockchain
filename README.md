# M107 Blockchain Certificate System

## Dokumentationsübersicht

### [`ANWENDUNGSHANDHABUNG.md`](./ANWENDUNGSHANDHABUNG.md)
Benutzerhandbuch für die Applikation (Installation, Bedienung, Workflows, Beschreibung der Anwendung)

### [`PROJEKTANALYSE.md`](./PROJEKTANALYSE.md)
Technische Implementierung, Architektur und kritische Bewertung der Anforderungserfüllung

### [`TEST_DOKUMENTATION.md`](./TEST_DOKUMENTATION.md)
Umfassende Test-Suite-Doku mit Backend-, Frontend- und Integration-Tests (100% Pass-Rate)

### [`KONZEPT.md (LB01)`](./KONZEPT.md)
Konzeptionelle Grundlagen, Problemstellung und Blockchain-Architektur

## Tests ausführen

### Alle Tests automatisch ausführen
```bash
chmod +x run-all-tests.sh
./run-all-tests.sh
```

### Backend Tests einzeln
```bash
cd backend && npm run test:integration
```

### Frontend Tests einzeln
```bash
cd frontend && npm run test:integration
```

## 📋 Features

- ✅ **Dezentrale Zertifikatsverwaltung** mit Blockchain-Technologie
- ✅ **Multi-Node-Netzwerk** mit Proof-of-Authority Konsensus
- ✅ **Web-basierte Benutzeroberfläche** mit React/TypeScript
- ✅ **Automatisierte Zertifikat-Verifikation** und Authentizität-Prüfung
- ✅ **Umfassende Test-Suite** mit Integration und Performance Tests
- ✅ **Institution-basierte Zugriffskontrollen** und Berechtigungen
- ✅ **Real-time Blockchain-Monitoring** und Netzwerk-Status
- ✅ **API-basierte Architektur** für erweiterte Integration

## 🛠️ Technologie-Stack

- **Backend**: Node.js, Express.js, Crypto (Elliptic Curves)
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Blockchain**: Custom PoA Implementation
- **Testing**: Custom Test Suites, Integration Tests
- **Automation**: Bash Scripts, NPM Scripts

## 📄 Lizenz

Dieses Projekt wurde als Teil des M107 Moduls entwickelt und dient Bildungszwecken.
