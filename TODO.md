# TODO – Atlas Fit (Loop-Aufgaben)

Eine Aufgabe pro Runde. Erledigt = [x].

- [ ] `.gitignore`: `.env` und `.env*` ergänzen (nicht nur `.env*.local`), `.env.example` anlegen
- [ ] Ganzes Repo auf Secrets, echte Namen, Telefonnummern, E-Mails und private Links prüfen und alles entfernen, was nicht öffentlich sein soll
- [ ] `COMMUNITY_DISCORD_URL` in `app/(tabs)/profile.tsx` in eine Konfig-Datei auslagern (Platzhalter bleibt, bis der echte Link da ist)
- [ ] Gewichtseinträge: ältere Einträge bearbeiten und löschen können (mit `confirmAction()`), inkl. Tests
- [ ] Verbrannte Kalorien im Tagebuch für jeden Tag anzeigen, nicht nur heute, inkl. Tests
- [ ] OpenFoodFacts-Barcode-Lookup: Fehlerfälle abfangen (offline, Timeout, Produkt nicht gefunden) mit verständlicher Meldung in allen 4 Sprachen, inkl. Tests
- [ ] i18n-Check: Test schreiben, der prüft, dass en/fr/de/ar dieselben Keys haben
- [ ] Accessibility: allen interaktiven Elementen `accessibilityLabel` geben, wo es fehlt
- [ ] EAS-Build-Konfiguration (`eas.json`) für Android und iOS anlegen, ohne Credentials im Repo
- [ ] README-Abschnitt „Status“ aktualisieren

## Nicht für den Loop (machst du selbst)
- Auf echten Android/iOS-Geräten testen (Kamera, Tastatur, Safe Areas)
- Nährwerte von einer Ernährungsberaterin prüfen lassen
- Store-Eintrag und Screenshots
