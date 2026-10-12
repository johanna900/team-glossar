
const API_URL = "https://script.google.com/macros/s/AKfycbybsJKxWfUbeysLy2QdTTE4MT45PWjWnwMLx_yQaVslSt7J2Z4NXBw-fNvkXXnCgAog/exec";

let alleBegriffe = [];
let suchbegriffAktuell = "";

    const app = document.getElementById("app");
setzeAktivenBereich("glossar");
    app.classList.remove("bereich-glossar", "bereich-notizen");
    app.classList.add(
        bereich === "notizen" ? "bereich-notizen" : "bereich-glossar"
    );

    document.querySelectorAll("header nav button").forEach(button => {
        button.classList.remove("aktiv-glossar", "aktiv-notizen");
        button.removeAttribute("aria-current");
    });

    const buttons = document.querySelectorAll("header nav button");
    const index = bereich === "notizen" ? 1 : 0;
    const aktiv = buttons[index];

    if (aktiv) {
        aktiv.classList.add(
            bereich === "notizen" ? "aktiv-notizen" : "aktiv-glossar"
        );
        aktiv.setAttribute("aria-current", "page");
    }
}

async function apiAnfrage(daten) {
    await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(daten)
    });
}

async function zeigeGlossar(optionen = {}) {
    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="seitenkopf">
            <div>
                <p class="seitenlabel">WISSEN & LEXIKON</p>
                <h2> TeamGlossar</h2>
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
            <p id="trefferInfo" class="hinweis">Glossar wird geladen ...</p>
        </div>

        <p id="glossarStatus" class="hinweis" role="status" aria-live="polite"></p>

        <div class="liste" id="glossarListe" aria-live="polite">
            <p>Begriffe werden geladen ...</p>
        </div>
    `;

    document.getElementById("neuerBegriffButton")
        .addEventListener("click", neuerBegriff);

    const suche = document.getElementById("glossarSuche");
    const liste = document.getElementById("glossarListe");
    const trefferInfo = document.getElementById("trefferInfo");
    const status = document.getElementById("glossarStatus");

    suche.value = optionen.suche ?? suchbegriffAktuell;

    function renderBegriffe() {
        const suchtext = suche.value.trim().toLocaleLowerCase("de");
        suchbegriffAktuell = suche.value;

        const gefiltert = alleBegriffe.filter(begriff => {
            const text = [
                begriff.term,
                begriff.definition,
                begriff.category,
                begriff.author
            ].filter(Boolean).join(" ").toLocaleLowerCase("de");

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
            const karte = document.createElement("article");
            karte.className = "begriffkarte";

            const titel = document.createElement("h3");
            titel.textContent = begriff.term || "Ohne Titel";
            karte.appendChild(titel);

            if (begriff.category) {
                const kategorie = document.createElement("span");
                kategorie.className = "kategorietag";
                kategorie.textContent = begriff.category;
                karte.appendChild(kategorie);
            }

            const definition = document.createElement("p");
            definition.className = "begriffdefinition";
            definition.textContent =
                begriff.definition || "Keine Definition vorhanden.";
            karte.appendChild(definition);

            if (begriff.author) {
                const autor = document.createElement("p");
                autor.className = "hinweis";
                autor.textContent = "Eingetragen von: " + begriff.author;
                karte.appendChild(autor);
            }

            const aktionen = document.createElement("div");
            aktionen.className = "begriff-aktionen";

            const bearbeiten = document.createElement("button");
            bearbeiten.type = "button";
            bearbeiten.className = "bearbeiten-button";
            bearbeiten.textContent = "✏️ Bearbeiten";
            bearbeiten.addEventListener("click", () => bearbeitenBegriff(begriff));

            const loeschen = document.createElement("button");
            loeschen.type = "button";
            loeschen.className = "loeschen-button";
            loeschen.textContent = "🗑️ Löschen";
            loeschen.addEventListener("click", () => loeschenBegriff(begriff));

            aktionen.append(bearbeiten, loeschen);
            karte.appendChild(aktionen);
            liste.appendChild(karte);
        });
    }

    try {
        const antwort = await fetch(API_URL);

        if (!antwort.ok) {
            throw new Error("HTTP " + antwort.status);
        }

        const daten = await antwort.json();

        if (!Array.isArray(daten)) {
            throw new Error("Die API hat keine Begriffsliste geliefert.");
        }

        alleBegriffe = daten;
        renderBegriffe();

        if (optionen.status) {
            status.textContent = optionen.status;
        }

        if (optionen.neuerTerm) {
            const vorhanden = alleBegriffe.some(begriff =>
                String(begriff.term || "").trim().toLocaleLowerCase("de") ===
                optionen.neuerTerm.trim().toLocaleLowerCase("de")
            );

            status.textContent = vorhanden
                ? `„${optionen.neuerTerm}“ ist im Glossar sichtbar.`
                : `„${optionen.neuerTerm}“ ist noch nicht sichtbar. Bitte prüfe den Eintrag in Google Sheets.`;
        }
    } catch (fehler) {
        liste.replaceChildren();

        const meldung = document.createElement("p");
        meldung.className = "fehlermeldung";
        meldung.textContent =
            "Glossar konnte nicht geladen werden. Bitte versuche es erneut.";

        liste.appendChild(meldung);
        trefferInfo.textContent = fehler.message;
    }
}

// Formular zum Anlegen oder Bearbeiten öffnen
function begriffFormularAnzeigen(begriff = null) {
    const liste = document.getElementById("glossarListe");
    const istBearbeitung = Boolean(begriff);

    liste.innerHTML = `
        <div class="formularbereich">
            <h3>${istBearbeitung ? "Begriff bearbeiten" : "Neuen Begriff hinzufügen"}</h3>
            <p class="untertitel">Teile dein Wissen mit dem Team.</p>

            <form id="begriffFormular">
                <label for="term">Begriff *</label>
                <input id="term" name="term" required maxlength="200"
                    placeholder="z. B. Onboarding">

                <label for="category">Kategorie</label>
                <input id="category" name="category" maxlength="100"
                    placeholder="z. B. Personal">

                <label for="definition">Definition *</label>
                <textarea id="definition" name="definition" required
                    maxlength="5000" rows="5"
                    placeholder="Erkläre den Begriff ..."></textarea>

                <label for="author">Autor</label>
                <input id="author" name="author" maxlength="100"
                    placeholder="Dein Name (optional)">

                <div class="formularaktionen">
                    <button type="submit" id="speichernButton">Änderungen speichern</button>
                    <button type="button" id="abbrechenButton">Abbrechen</button>
                </div>
            </form>

            <p id="speicherStatus" role="status" aria-live="polite"></p>
        </div>
    `;

    const formular = document.getElementById("begriffFormular");

    if (begriff) {
        formular.elements.term.value = begriff.term || "";
        formular.elements.category.value = begriff.category || "";
        formular.elements.definition.value = begriff.definition || "";
        formular.elements.author.value = begriff.author || "";
    } else {
        formular.elements.author.value = "";
    }

    document.getElementById("abbrechenButton")
        .addEventListener("click", () => zeigeGlossar());

    formular.addEventListener("submit", async event => {
        event.preventDefault();

        const status = document.getElementById("speicherStatus");
        const button = document.getElementById("speichernButton");

        const daten = {
            action: istBearbeitung ? "update" : "create",
            term: formular.elements.term.value.trim(),
            category: formular.elements.category.value.trim(),
            definition: formular.elements.definition.value.trim(),
            author: formular.elements.author.value.trim()
        };

        if (istBearbeitung) {
            daten.id = begriff.id;
        }

        if (!daten.term || !daten.definition) {
            status.textContent = "Bitte Begriff und Definition ausfüllen.";
            return;
        }

        button.disabled = true;
        status.textContent = "Speichervorgang wird ausgeführt ...";

        try {
            await apiAnfrage(daten);

            await new Promise(resolve => setTimeout(resolve, 1200));

            await zeigeGlossar({
                suche: daten.term,
                status: "Speicheranfrage gesendet. Bitte prüfe, ob der Eintrag aktualisiert wurde.",
                neuerTerm: istBearbeitung ? null : daten.term
            });
        } catch (fehler) {
            status.textContent =
                "Fehler beim Senden: " + fehler.message;
            button.disabled = false;
        }
    });
}

function neuerBegriff() {
    begriffFormularAnzeigen();
}

function bearbeitenBegriff(begriff) {
    if (!begriff.id) {
        alert("Dieser Eintrag hat keine ID und kann nicht bearbeitet werden.");
        return;
    }

    begriffFormularAnzeigen(begriff);
}

async function loeschenBegriff(begriff) {
    if (!begriff.id) {
        alert("Dieser Eintrag hat keine ID und kann nicht gelöscht werden.");
        return;
    }

    const bestaetigt = confirm(
        `Möchtest du den Begriff „${begriff.term}“ wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`
    );

    if (!bestaetigt) return;

    const status = document.getElementById("glossarStatus");
    status.textContent = "Löschanfrage wird gesendet ...";

    try {
        await apiAnfrage({
            action: "delete",
            id: begriff.id
        });

        await new Promise(resolve => setTimeout(resolve, 1200));

        await zeigeGlossar({
            suche: suchbegriffAktuell,
            status: `Löschanfrage für „${begriff.term}“ gesendet. Bitte prüfe, ob der Eintrag verschwunden ist.`
        });
    } catch (fehler) {
        status.textContent = "Fehler beim Löschen: " + fehler.message;
    }
}

// Notizen – noch ohne Speicherung
function zeigeNotizen() {setzeAktivenBereich("notizen");

    document.getElementById("app").innerHTML = `
        <div class="seitenkopf">
            <div>
                <p class="seitenlabel">TEAM & ZUSAMMENARBEIT</p>
                <h2> Notizen</h2>
                <p class="untertitel">Ideen und wichtige Informationen sammeln.</p>
            </div>
            <button id="neueNotizButton">+ Neue Notiz</button>
        </div>

        <div class="leerzustand">
            <h3>Euer Notizbereich</h3>
            <p>Die gemeinsame Notizfunktion ist noch nicht eingerichtet. Eure Notizen werden hier noch nicht gespeichert.</p>
        </div>
    `;

    document.getElementById("neueNotizButton")
        .addEventListener("click", neueNotiz);
}

function neueNotiz() {
    alert("Die Notizfunktion ist noch nicht eingerichtet.");
}
