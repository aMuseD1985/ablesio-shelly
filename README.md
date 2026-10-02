# ablesio-shelly

Öffentliche **Freigabeliste** für das Script, das [ablesio.de](https://ablesio.de) auf Shelly-Messsteckern einsetzt – und das Script selbst zum Nachlesen.

## Wozu?

ablesio kann das Script auf den Steckern aktualisieren (Fernwartung). Damit ein kompromittierter ablesio-Server **kein** fremdes Script auf die Geräte bringen kann, prüft jeder Shelly vor einem Update zweierlei:

1. Das neue Script kommt von ablesio.de.
2. Sein **SHA-256-Fingerabdruck** steht in [`releases.txt`](releases.txt) **in diesem Repository** – einer zweiten, unabhängigen Quelle, die nur der Betreiber pflegt.

Nur wenn beides stimmt (und der Besitzer das Update am Gerät mit einem Tastendruck freigibt), wird installiert. Ein Angreifer müsste ablesio.de **und** dieses GitHub-Konto übernehmen.

## Inhalt

| Datei | Inhalt |
|---|---|
| `releases.txt` | freigegebene Script-Versionen: `sha256  version  datum  hinweis` |
| `script/ablesio-shelly.js` | das Script im Klartext (lesbare Fassung; auf dem Gerät läuft eine kompakte Fassung ohne Kommentare) |
| `CHANGELOG.md` | was sich je Version geändert hat |

Hier steht **nichts Geheimes** – nur Prüfsummen und Klartext-Code.

## Stand

**Vorbereitet, noch nicht aktiv.** Heute enthält jedes Script den Melde-Link seines Steckers, dadurch unterscheidet sich der Code je Gerät. Bevor die Prüfung scharf geschaltet wird, wandert der Melde-Link in den Gerätespeicher (Shelly-KVS) – dann laufen alle Stecker mit identischem Code, und es gibt genau **eine Prüfsumme je Version**.

## Sicherheit dieses Repositorys

- Schreiben darf nur der Betreiber; Konto mit Zwei-Faktor-Anmeldung.
- Auf dem ablesio-Server liegt **kein** Zugang zu diesem Repository.
- Neue Einträge in `releases.txt` nur über einen eigenen Commit nach Prüfung der neuen Version.
