# Änderungen am Shelly-Script

## e013b76372 – ablesio Build 2026-10-06.176

- **Taste dauerhaft auf `momentary` („Attached“):** Das Script stellt die Taste beim Start auf `momentary` (vorher `detached`) und wechselt im Update-Fenster nicht mehr. Drücke werden nur gezählt, solange ein Update freigegeben ist. Kehrseite: Ein Druck im Alltag schaltet das Relais um.

## c58343e6e4 – ablesio Build 2026-10-06.187

- **Ringfarbe:** Die Farbliste wird bei jedem Schreiben frisch kopiert (Verdacht: das gemeinsame Array für „an“ und „aus“ wird vom Gerät abgelehnt, Fehler `Missing or bad argument 'config'`). Bei einem Fehler meldet das Script die gesendete Einstellung als `led.p` (und `led.err`) in der Meldung.
- Konsolen-/Diagnosefeld `gate.ev` entfernt (Platz).

## be75c15a37 – ablesio Build 2026-10-06.185

- **Ring immer mit voller Helligkeit** (100 statt 25–90), in allen Fassungen.
- **Ring bleibt nicht mehr in der falschen Farbe hängen:** Wird das Schreiben der Ringfarbe vom Gerät abgelehnt, merkt das Script den Fehler (`led.err` in der Meldung) und versucht es nach 20 s noch einmal. 30 s nach dem Start und danach alle 10 Minuten liest es die tatsächliche Farbe und Helligkeit und schreibt bei Abweichung neu (behebt das dauerhafte Lila nach einem Update). Geschrieben wird nur bei Abweichung (Flash-Schonung, Tageslimit bleibt).

## b22562edab – ablesio Build 2026-10-06.180

- **Ring bleibt nicht lila hängen:** Alle 60 s wird ein Lila ohne Grund (kein Update-Fenster, kein Update, keine große Übertragung) zurückgesetzt. 25 s nach dem Start wird ein von der Vorversion hinterlassenes Lila zurückgesetzt.
- **Meldung alle 5 Minuten, solange ein Update auf Freigabe wartet** (im Freigabe-Fenster jede Minute), sonst wie gehabt alle 15 Minuten. Der Server steuert das mit `poll` (Minutenzahl).
- **Meldezeit gestreut:** Bei langem Takt wird jede Runde um bis zu ±30 s verschoben, damit nicht alle Stecker zur selben Sekunde melden (`Math.random`, abgesichert).
- Konsolen-Ausgaben gekürzt (Platz).

## fa37bd0bf1 – ablesio Build 2026-10-06.179

- **Matter bleibt wie vom Kunden eingestellt:** Das Script schaltet Matter nicht mehr ab.
- **Freier Arbeitsspeicher:** Die Meldung enthält `ram` (alle 5 Minuten gemessen), damit sich ein Speicherengpass durch Matter erkennen lässt.

## cc48f9c9b9 – ablesio Build 2026-10-06.178

- **Folge-Version für den Update-Test:** nur die Test-Kennung `UPD_PROBE` geändert (7 statt 3), Funktion sonst unverändert. Dient dazu, den Update-Weg (Freigabe in der App, Taste im Fenster, Download, Prüfsumme) auf einem Stecker mit `691859d795` zu prüfen.

## 691859d795 – ablesio Build 2026-10-06.177

- **Ein Tastendruck im Freigabe-Fenster genügt** (vorher dreimal): Sobald der Kunde das Update in der App freigegeben hat und der Ring lila leuchtet, startet der erste Druck das Update. Das Relais wird danach wieder eingeschaltet.
- **Robustere Tastenerkennung:** Ein Schaltvorgang wird aus `delta` oder `info` des Ereignisses gelesen.
- **Diagnose:** Die Meldung enthält ein Feld `gate` (Fenster-Sekunden, Fenster offen, Zahl der gezählten Tastendrücke, letztes Ereignis), damit sich Fehler am Gerät ohne Konsole finden lassen.
- Taste dauerhaft `momentary` (seit e013b76372, nie ausgeliefert).

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

## 4c225f129a – ablesio Build 2026-10-07.211

- **Nur noch drei Timer:** Meldetakt plus ein 60-s-Haushaltstakt statt sechs Timern. Behebt „Too many running timers“ (Script stoppte beim Öffnen des Update-Fensters) und den dauerhaft lila Ring.
