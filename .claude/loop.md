# Loop-Auftrag: App fertigstellen – ohne Bugs, ohne Leaks

Du arbeitest in jeder Runde GENAU EINE Aufgabe ab. Nicht mehr.

## Ablauf pro Runde
1. Lies `TODO.md`. Nimm die oberste offene Aufgabe.
   - Wenn `TODO.md` leer ist oder alles erledigt ist: melde "FERTIG" und beende den Loop.
2. Setz die Aufgabe um. Kleine, saubere Änderungen.
3. Teste:
   - Lass alle Tests laufen: `npm test`
   - Lass den Typecheck laufen: `npm run typecheck`
   - Halte dich an die Regeln in `AGENTS.md` und `README.md` (Konventionen: i18n in allen 4 Sprachen, RTL über `useRTL()`, Farben aus `src/theme`).
   - Wenn etwas rot ist: zuerst fixen, dann weiter. Keine neue Aufgabe, solange etwas rot ist.
   - Für neue Funktionen schreibst du mindestens einen Test.
4. Sicherheits-Check vor jedem Commit:
   - Keine API-Keys, Tokens, Passwörter, Webhook-URLs, Telefonnummern oder Kundendaten im Code.
   - Alle Secrets gehören in `.env`. `.env` muss in `.gitignore` stehen.
   - Prüfe mit: `git diff --cached | grep -iE "key|token|secret|password|api_|webhook|sk-|Bearer"`
   - Wenn du etwas findest: entfernen, in `.env` verschieben, `.env.example` mit Platzhaltern pflegen.
   - Keine echten Testdaten (Namen, Nummern, E-Mails) – nur erfundene Dummy-Daten.
5. Commit mit klarer Nachricht. NICHT pushen und NICHT deployen.
6. Hak die Aufgabe in `TODO.md` ab und schreib eine Zeile in `LOOP-LOG.md`:
   Datum – Aufgabe – Ergebnis – offene Probleme.

## Verboten
- Kein `git push`, kein Deploy, kein Löschen von Dateien ohne Grund.
- Keine Tests deaktivieren oder überspringen, nur damit sie grün sind.
- Keine neuen Pakete ohne Eintrag im Log mit Begründung.

## Wenn du nicht weiterkommst
Nach 2 Fehlversuchen an derselben Aufgabe: markiere sie in `TODO.md` mit "BLOCKIERT: <Grund>"
und nimm die nächste.
