GAME ROOM v1076

Zmiany:
- TYPER v2116 dodany jako osobny folder: games/typer/
- Kliknięcie kafelka TYPER w GAME ROOM otwiera games/typer/index.html
- GAME ROOM przekazuje do Typera: kod pokoju, nazwę pokoju, nick, numer gracza, język i informację czy gracz jest adminem.
- TYPER v2116 ma tryb GAME ROOM: pomija ekran PIN/logowania i od razu otwiera pokój Typera.
- Stary TYPER v2116 nie jest nadpisywany; jest kopią zintegrowaną w tym projekcie.

Pliki do podmiany/dodania:
- index.html
- app.js
- style.css
- manifest.json
- DODAĆ CAŁY FOLDER: games/typer/

Uwaga:
- To jest pierwszy krok integracji. Dane Typera nadal działają w strukturze rooms/{kod} w Firebase Typera.
- Następny krok: uporządkowanie ścieżek Firebase pod games/typer, jeśli test wejścia do pokoju przejdzie poprawnie.
