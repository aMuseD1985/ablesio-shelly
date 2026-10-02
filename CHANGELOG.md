# Änderungen am Shelly-Script

## v3 – Stand ablesio Build 2026-10-01.67

- **Aufruf-Warteschlange** (`rpc()`, höchstens 2 gleichzeitig): behebt „Too many calls in progress“ auf neueren Firmwares (z. B. Plug M Gen3, 1.8.99); Fehler in Rückmeldungen beenden das Script nicht mehr.
- **Licht-Indikation** am LED-Ring (orange meldet, blau misst, grün umstecken, rot keine Verbindung), Aufblitzen je Meldung, Tageslimit gegen Flash-Verschleiß.
- **Immer an**: Plugs mit Schalter schalten nach dem Einstecken ein, Taste schaltet nicht aus (nur Plugs, nie Einbau-Module).
- Schnellstart, Puffer bei Ausfall, Eco-Modus, WLAN-Signal, Firmware-Hinweis, Fernwartung (Selbst-Update in Stücken mit Prüfsumme).
