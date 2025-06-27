# Integration Tests Ausführung

## Übersicht

Die Integration Tests wurden implementiert und können auf verschiedene Weise ausgeführt werden:

## 📋 Verfügbare Test-Suites

### 1. Backend Integration Tests
**Datei:** `backend/src/test/IntegrationTest.js`

**Tests:**
- Certificate Issuance End-to-End Flow
- Multi-Node Network Synchronization  
- Certificate Verification Flow
- API Error Handling
- Performance and Load Testing

**Ausführung:**
```bash
cd backend
npm run test:integration
```

### 2. Frontend Integration Tests
**Datei:** `frontend/integration-test.js`

**Tests:**
- Frontend Build Process
- Environment Configuration
- API Integration Testing
- Certificate Management Workflow

**Ausführung:**
```bash
cd frontend
npm run test:integration
```

### 3. Comprehensive E2E Tests
**Datei:** `run-integration-tests.js` (Projekt-Root)

**Tests:**
- Kompletter Backend + Frontend Test
- Automatisches Starten der Backend-Nodes
- End-to-End Certificate Lifecycle
- System unter Last testen

**Ausführung:**
```bash
# Im Projekt-Root-Verzeichnis
node run-integration-tests.js
```

## 🚀 Schnellstart

### Voraussetzungen

1. **Backend Dependencies installiert:**
```bash
cd backend
npm install
```

2. **Frontend Dependencies installiert:**
```bash
cd frontend  
npm install
```

3. **Node-fetch für Integration Tests:**
```bash
cd backend
npm install node-fetch
cd ../frontend
npm install node-fetch
```

### Alle Tests ausführen

**Option 1: Umfassende Tests (Empfohlen)**
```bash
node run-integration-tests.js
```

**Option 2: Einzelne Test-Suites**
```bash
# Backend Tests (Backend-Nodes müssen laufen)
cd backend
npm run nodes  # In separatem Terminal
npm run test:integration

# Frontend Tests (Backend muss laufen)
cd frontend
npm run test:integration
```

## 📊 Test-Berichte

Die Tests generieren detaillierte Berichte mit:
- ✅ Erfolgreiche Tests
- ❌ Fehlgeschlagene Tests  
- ⚠️ Warnungen
- 📊 Pass-Rate Statistiken
- 🕒 Ausführungszeiten

### Beispiel-Output:

```
[2025-06-27T...] [SUITE] 🚀 Starting Integration Test Suite
[2025-06-27T...] [TEST] ✅ PASS: Institution wallet created successfully
[2025-06-27T...] [TEST] ✅ PASS: Certificate creation request successful
[2025-06-27T...] [TEST] ✅ PASS: Certificate retrieval successful
...
[2025-06-27T...] [REPORT] Total Tests: 25
[2025-06-27T...] [REPORT] Passed: 25
[2025-06-27T...] [REPORT] Failed: 0
[2025-06-27T...] [REPORT] Pass Rate: 100.0%
[2025-06-27T...] [SUCCESS] 🎉 ALL TESTS PASSED!
```

## 🔧 Fehlerbehebung

### Problem: "Server not reachable"
**Lösung:**
```bash
# Backend-Nodes starten
cd backend
npm run nodes
```

### Problem: "Dependencies missing"
**Lösung:**
```bash
# Dependencies installieren
cd backend && npm install
cd ../frontend && npm install
```

### Problem: "Port already in use"
**Lösung:**
```bash
# Prozesse beenden
pkill -f "node.*CertificateNode"
# Oder manuell Ports 3001, 3002, 3003 freigeben
```

### Problem: "Frontend build fails"
**Lösung:**
```bash
cd frontend
rm -rf node_modules
npm install
npm run build
```

## 📝 Test-Coverage

Die Integration Tests decken ab:

### ✅ Vollständig getestet:
- Certificate Issuance (API → Blockchain)
- Certificate Verification
- Wallet Creation & Management
- Faucet Functionality
- Multi-Node Synchronization
- API Error Handling
- Basic Performance Testing

### ⚠️ Teilweise getestet:
- Frontend UI Interactions (simuliert)
- Network Consensus unter Last
- Cross-Platform Kompatibilität

### ❌ Nicht getestet:
- Browser-spezifische Funktionen
- Mobile Responsiveness
- Accessibility Features

## 🎯 Nächste Schritte

1. **Automatisierung:** CI/CD Pipeline Setup
2. **Erweiterte Tests:** Browser-Automation mit Playwright/Selenium
3. **Performance:** Stress-Tests mit mehr Nodes
4. **Monitoring:** Test-Metriken Dashboard

## 📞 Support

Bei Problemen mit den Integration Tests:

1. **Logs prüfen:** Alle Tests generieren detaillierte Logs
2. **Backend Status:** `curl http://localhost:3001/health`
3. **Node Status:** `npm run nodes` ausgeben prüfen
4. **Dependencies:** `npm install` in beiden Verzeichnissen

---

*Letzte Aktualisierung: 27. Juni 2025*
