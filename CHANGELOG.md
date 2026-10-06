# Änderungen am Shelly-Script

## 58e961b7ea – ablesio Build 2026-10-06.175

- **Gegenprobe für den Update-Weg:** nur die Test-Kennung `UPD_PROBE` geändert (3 statt 2), Funktion sonst unverändert. Dient dazu, den Update-Weg (Freigabe in der App, dreimal Taste, Download, Prüfsumme) auf einem Stecker mit `4c4f1b9d62` zu prüfen.

## 4c4f1b9d62 – ablesio Build 2026-10-06.174

- **Update-Sperre repariert und sichtbar:** Der Tastendruck wird jetzt über den Schaltwechsel des Relais erkannt (Laufzeit des Geräts). Während des Freigabe-Fensters leuchtet der LED-Ring lila, die Script-Konsole meldet jeden Schritt.
- Freigabe-Fenster 30 Minuten; solange es offen ist, meldet sich der Stecker jede Minute.

## 26944a9e36 – ablesio Build 2026-10-06.172

- **Update-Probe:** unbenutzte Kennung `UPD_PROBE` in der KVS-Fassung, damit ein Stecker mit der Vorversion `d4c2b43372` den kompletten Update-Weg (Freigabe in der App, dreimal schnell die Taste, Download in Teilen, Prüfsumme, zweites Script) durchlaufen kann. Funktion sonst unverändert.

## d4c2b43372 – ablesio Build 2026-10-06.162

- **Kompaktere Gerätefassung** (11.231 statt 13.001 Bytes): Leerraum um Satzzeichen entfernt, Funktion unverändert (Token-genau gegen die bisherige Fassung geprüft). Schafft Platz für die Prüfsummen-Abfrage gegen `releases.txt`.
- **Melde-Link und Erzeugungs-Modus im Gerätespeicher (KVS)**: der Code ist auf allen Steckern identisch, es gibt eine Prüfsumme je Version (`releases.txt`).
- `script/ablesio-shelly.js` zeigt jetzt die lesbare KVS-Fassung mit Kommentaren.

## v3 – Stand ablesio Build 2026-10-01.67

- **Aufruf-Warteschlange** (`rpc()`, höchstens 2 gleichzeitig): behebt „Too many calls in progress“ auf neueren Firmwares (z. B. Plug M Gen3, 1.8.99); Fehler in Rückmeldungen beenden das Script nicht mehr.
- **Licht-Indikation** am LED-Ring (orange meldet, blau misst, grün umstecken, rot keine Verbindung), Aufblitzen je Meldung, Tageslimit gegen Flash-Verschleiß.
- **Immer an**: Plugs mit Schalter schalten nach dem Einstecken ein, Taste schaltet nicht aus (nur Plugs, nie Einbau-Module).
- Schnellstart, Puffer bei Ausfall, Eco-Modus, WLAN-Signal, Firmware-Hinweis, Fernwartung (Selbst-Update in Stücken mit Prüfsumme).
