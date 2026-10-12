
const API_URL = "https://script.google.com/macros/s/AKfycbybsJKxWfUbeysLy2QdTTE4MT45PWjWnwMLx_yQaVslSt7J2Z4NXBw-fNvkXXnCgAog/exec";

let alleBegriffe = [];
let suchbegriffAktuell = "";
let ladeFehler = null;

// ------------------------------
// GLOSSAR ANZEIGEN
// ------------------------------

async function zeigeGlossar(optionen = {}) {
    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="seitenkopf">
            <div>
                <p class="seitenlabel">WISSEN & LEXIKON</p>
                <h2>📖 TeamGlossar</h2>
                <p class="untertitel">
                    Fachbegriffe einfach finden und verstehen.
                </p>
            </div>
            <button id="neuerBegriffButton">+ Neuer Begriff</button>
        </div>

        <div class="suchbereich">
            <label for="glossarSuche">Glossar durchsuchen</label>
            <input
                id="glossarSuche"
                type="search"
                placeholder="Begriff, Erklärung oder Kategorie suchen ..."
                autocomplete="off"
            >
            <p id="trefferInfo" class="hinweis">
                Glossar wird geladen ...
            </p>
        </div>

        <div class="liste" id="glossarListe" aria-live="polite">
            <p>Begriffe werden geladen ...</p>
        </div>
    `;

    document.getElementById("neuerBegriffButton")
        .addEventListener("click", neuerBegriff);

    const suche = document.getElementById("glossarSuche");
    const liste = document.getElementById("glossarListe");
    const trefferInfo = document.getElementById("trefferInfo");

    suche.value = optionen.suche ?? suchbegriffAktuell;

    function renderBegriffe() {
        const suchtext = suche.value
            .trim()
            .toLocaleLowerCase("de");

        suchbegriffAktuell = suche.value;

        const gefiltert = alleBegriffe.filter(begriff => {
            const text = [
                begriff.term,
                begriff.definition,
                begriff.category,
                begriff.author
            ]
                .filter(Boolean)
                .join(" ")
                .toLocaleLowerCase("de");

            return text.includes(suchtext);
        });

        liste.replaceChildren();

        trefferInfo.textContent =
            `${gefiltert.length} von ${alleBegriffe.length} Begriffen`;

        if (gefiltert.length === 0) {
            const leer = document.createElement("div");
            leer.className = "leerzustand";

            const titel = document.createElement("h3");
            titel.textContent = suchtext
                ? "Keine Treffer gefunden"
                : "Noch keine Begriffe vorhanden";

            const text = document.createElement("p");
            text.textContent = suchtext
                ? "Versuche einen anderen Suchbegriff."
                : "Füge den ersten Begriff zu eurem TeamGlossar hinzu.";

            leer.append(titel, text);
            liste.appendChild(leer);
            return;
        }

        gefiltert.forEach(begriff => {
            const eintrag = document.createElement("article");
            eintrag.className = "begriffkarte";

            const titel = document.createElement("h3");
            titel.textContent = begriff.term || "Ohne Titel";
            eintrag.appendChild(titel);

            if (begriff.category) {
                const kategorie = document.createElement("span");
                kategorie.className = "kategorietag";
                kategorie.textContent = begriff.category;
                eintrag.appendChild(kategorie);
            }

            const definition = document.createElement("p");
            definition.className = "begriffdefinition";
            definition.textContent =
                begriff.definition || "Keine Definition vorhanden.";

            eintrag.appendChild(definition);

            if (begriff.author) {
                const autor = document.createElement("p");
                autor.className = "hinweis";
                autor.textContent = `Eingetragen von: ${begriff.author}`;
                eintrag.appendChild(autor);
            }

            liste.appendChild(eintrag);
        });
    }

    suche.addEventListener("input", renderBegriffe);

    try {
        const antwort = await fetch(API_URL);

        if (!antwort.ok) {
            throw new Error("HTTP " + antwort.status);
        }

        const begriffe = await antwort.json();

        if (!Array.isArray(begriffe)) {
            throw new Error("Die API hat keine Liste geliefert.");
        }

        alleBegriffe = begriffe;
        ladeFehler = null;
        renderBegriffe();

        // Nach dem Speichern prüfen, ob der neue Begriff sichtbar ist.
        if (optionen.neuerTerm) {
            const gespeichert = alleBegriffe.some(begriff =>
                String(begriff.term || "").trim().toLocaleLowerCase("de") ===
                optionen.neuerTerm.trim().toLocaleLowerCase("de")
            );

            const status = document.getElementById("glossarStatus");

            if (status) {
                status.textContent = gespeichert
                    ? `„${optionen.neuerTerm}“ ist im Glossar sichtbar.`
                    : `Der Eintrag „${optionen.neuerTerm}“ ist noch nicht sichtbar. Bitte prüfe später erneut, ob er in Google Sheets gespeichert wurde.`;
                status.className = gespeichert
                    ? "speicher-erfolg"
                    : "hinweis";
            }
        }
    } catch (fehler) {
        ladeFehler = fehler;

        liste.replaceChildren();

        const meldung = document.createElement("p");
        meldung.className = "fehlermeldung";
        meldung.textContent =
            "Glossar konnte nicht geladen werden. Bitte prüfe die Verbindung und versuche es erneut.";

        liste.appendChild(meldung);
        trefferInfo.textContent = fehler.message;
    }
}

// ------------------------------
// NEUEN BEGRIFF HINZUFÜGEN
// ------------------------------

function neuerBegriff() {
    const liste = document.getElementById("glossarListe");

    liste.innerHTML = `
        <div class="formularbereich">
            <h3>Neuen Begriff hinzufügen</h3>
            <p class="untertitel">
                Teile dein Wissen mit dem Team.
            </p>

            <form id="begriffFormular">
                <label for="term">Begriff *</label>
                <input
                    id="term"
                    name="term"
                    required
                    maxlength="200"
                    placeholder="z. B. Onboarding"
                >

                <label for="category">Kategorie</label>
                <input
                    id="category"
                    name="category"
                    maxlength="100"
                    placeholder="z. B. Personal"
                >

                <label for="definition">Definition *</label>
                <textarea
                    id="definition"
                    name="definition"
                    required
                    maxlength="5000"
                    rows="5"
                    placeholder="Erkläre den Begriff ..."
                ></textarea>

                <label for="author">Autor</label>
                <input
                    id="author"
                    name="author"
                    maxlength="100"
                    placeholder="Dein Name (optional)"
                >

                <div class="formularaktionen">
                    <button type="submit" id="speichernButton">
                        Begriff speichern
                    </button>
                    <button type="button" id="abbrechenButton">
                        Abbrechen
                    </button>
                </div>
            </form>

            <p id="speicherStatus" role="status" aria-live="polite"></p>
        </div>
    `;

    document.getElementById("abbrechenButton")
        .addEventListener("click", () => zeigeGlossar());

    document.getElementById("begriffFormular")
        .addEventListener("submit", async function(event) {
            event.preventDefault();

            const formular = event.currentTarget;
            const status = document.getElementById("speicherStatus");
            const speichernButton =
                document.getElementById("speichernButton");

            const daten = {
                term: formular.elements.term.value.trim(),
                category: formular.elements.category.value.trim(),
                definition: formular.elements.definition.value.trim(),
                author: formular.elements.author.value.trim()
            };

            if (!daten.term || !daten.definition) {
                status.textContent =
                    "Bitte Begriff und Definition ausfüllen.";
                return;
            }

            speichernButton.disabled = true;
            status.textContent = "Begriff wird gesendet ...";

            try {
                await fetch(API_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8"
                    },
                    body: JSON.stringify(daten)
                });

                status.textContent =
                    "Anfrage gesendet. Prüfe den Eintrag im Glossar ...";

                // Google Sheets braucht eventuell etwas Zeit.
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Glossar neu laden und den neuen Begriff suchen.
                await zeigeGlossar({
                    neuerTerm: daten.term,
                    suche: daten.term
                });
            } catch (fehler) {
                status.textContent =
                    "Fehler beim Senden: " + fehler.message;
                speichernButton.disabled = false;
            }
        });
}

// ------------------------------
// NOTIZEN
// ------------------------------

function zeigeNotizen() {
    document.getElementById("app").innerHTML = `
        <div class="seitenkopf">
            <div>
                <p class="seitenlabel">TEAM & ZUSAMMENARBEIT</p>
                <h2>📝 Notizen</h2>
                <p class="untertitel">
                    Ideen und wichtige Informationen sammeln.
                </p>
            </div>
            <button id="neueNotizButton">+ Neue Notiz</button>
        </div>

        <div class="leerzustand">
            <h3>Euer Notizbereich</h3>
            <p>
                Die gemeinsame Notizfunktion ist noch nicht eingerichtet.
                Eure Notizen werden hier noch nicht gespeichert.
            </p>
        </div>
    `;

    document.getElementById("neueNotizButton")
        .addEventListener("click", neueNotiz);
}

function neueNotiz() {
    alert(
        "Die Notizfunktion ist noch nicht eingerichtet. " +
        "Wir können sie als nächsten Schritt ergänzen."
    );
}

// Beim Öffnen der Webseite zunächst die Startseite anzeigen.
// Die vorhandenen Navigationsbuttons rufen zeigeGlossar()
// und zeigeNotizen() weiterhin direkt auf.
