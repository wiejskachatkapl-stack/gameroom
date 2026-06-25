GAME ROOM v1010

1. Wrzuć wszystkie pliki z katalogu "pliki do podmiany" do głównego katalogu repozytorium GitHub Pages.
2. Struktura musi zostać zachowana, szczególnie:
   assets/screens/bg_login.png
   assets/screens/bg_profile.png
   assets/screens/bg_rooms.png
3. Po wgraniu otwórz index.html albo stronę GitHub Pages.
4. Jeśli przeglądarka trzyma starą wersję, odśwież Ctrl+F5 albo wyczyść cache strony.

Wersja v1009 używa grafik z zaakceptowanych ekranów jako prawdziwych plików PNG.
Firebase będzie podpięty później.


v1010:
- usunięto rejestrację service workera z app.js, aby GitHub Pages wdrażał się stabilnie,
- sw.js czyści stare cache,
- poprawiono pozycję i wygląd numeru gracza na ekranie tworzenia profilu.
