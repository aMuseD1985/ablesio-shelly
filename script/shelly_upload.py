#!/usr/bin/env python3
"""Spielt ein Script in Stuecken auf einen Shelly (umgeht die 8-KB-Grenze des Web-Editors).
Aufruf:  python3 shelly_upload.py 10.10.10.166 ablesio-stecker-4c4f1b9d62.js [Script-ID]
Ohne Script-ID wird ein neues Script angelegt. Das bisherige ablesio-Script vorher in der Web-Oberflaeche stoppen und loeschen."""
import json, sys, time, urllib.error, urllib.request

def rpc(ip, method, params):
    req = urllib.request.Request(f"http://{ip}/rpc/{method}", data=json.dumps(params).encode(), headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            out = json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        sys.exit(f"Fehler bei {method}: HTTP {e.code} {e.read().decode(errors='replace')[:300]}")
    if isinstance(out, dict) and "code" in out and "message" in out:
        sys.exit(f"Fehler bei {method}: {out}")
    return out

ip, path = sys.argv[1], sys.argv[2]
code = open(path, encoding="utf-8").read()
sid = int(sys.argv[3]) if len(sys.argv) > 3 else rpc(ip, "Script.Create", {"name": "ablesio"})["id"]
try: rpc(ip, "Script.Stop", {"id": sid})
except Exception: pass
n = 1024
for i in range(0, len(code), n):
    r = rpc(ip, "Script.PutCode", {"id": sid, "code": code[i:i + n], "append": i > 0})
    print(f"Stueck {i // n + 1}/{-(-len(code) // n)}: Laenge jetzt {r.get('len')}")
    time.sleep(0.3)
back = ""
g = rpc(ip, "Script.GetCode", {"id": sid, "offset": 0, "len": 100000})
back = g.get("data", "")
if back != code:
    sys.exit(f"Pruefung fehlgeschlagen: auf dem Geraet {len(back)} Zeichen statt {len(code)} - bitte diese Ausgabe an Claude schicken")
rpc(ip, "Script.SetConfig", {"id": sid, "config": {"enable": True, "name": "ablesio"}})
rpc(ip, "Script.Start", {"id": sid})
print(f"fertig: Script {sid}, {len(code)} Zeichen, gestartet")
