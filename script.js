const API_URL = "https://script.google.com/macros/s/AKfycbybsJKxWfUbeysLy2QdTTE4MT45PWjWnwMLx_yQaVslSt7J2Z4NXBw-fNvkXXnCgAog/exec";

let alleBegriffe = [];
let suchbegriffAktuell = "";

/* ---------- Navigation: aktiven Bereich markieren ---------- */

function setzeAktivenBereich(bereich) {
    const app = document.getElementById("app");
    app.classList.remove("bereich-glossar", "bereich-notizen");
    app.classList.add(
        bereich === "notizen" ? "bereich-notizen" : "bereich-glossar"
    );

    const buttons = document.querySelectorAll("header nav button");

    buttons.forEach(button => {
        button.classList.remove("aktiv-glossar", "aktiv-notizen");
        button.removeAttribute("aria-current");
    });

    const aktiv = buttons[bereich === "notizen" ? 1 : 0];

    if (aktiv) {
        aktiv.classList.add(
            bereich === "notizen" ? "aktiv-notizen" : "aktiv-glossar"
        );
        aktiv.setAttribute("aria-current", "page");
    }
}

/* ---------- API ---------- */

// Mit no-cors kann die Antwort nicht gelesen werden.
// Deshalb lädt die Seite danach die Liste neu und prüft das Ergebnis.
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

/* ---------- Glossar ---------- */

async function zeigeGlossar(optionen = {}) {
    setzeAktivenBereich("glossar");

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="seitenkopf">
            <div>
                <p class="seitenlabel">WISSEN & LEXIKON</p>
                <h2>TeamGlossar</h2>
                <p class="untertitel">
                    Fachbegriffe einfach finden und verstehen.
                </p>
            </div>
            <button id="neuerBegriffButton" type="button">+ Neuer Begriff</button>
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

        const gefiltert = alleBegriffe
            .filter(begriff => {
                const text = [
                    begriff.term,
                    begriff.definition,
                    begriff.category,
                    begriff.author
                ].filter(Boolean).join(" ").toLocaleLowerCase("de");

                return text.includes(suchtext);
            })
            .sort((a, b) =>
                String(a.term || "").localeCompare(String(b.term || ""), "de")
            );

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

    suche.addEventListener("input", renderBegriffe);

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

/* ---------- Formular: anlegen oder bearbeiten ---------- */

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
                    <button type="submit" id="speichernButton">
                        ${istBearbeitung ? "Änderungen speichern" : "Begriff speichern"}
                    </button>
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
            status.textContent = "Fehler beim Senden: " + fehler.message;
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

/* ---------- Notizen ---------- */

let alleNotizen = [];

async function zeigeNotizen(optionen = {}) {
    setzeAktivenBereich("notizen");

    document.getElementById("app").innerHTML = `
        <div class="seitenkopf">
            <div>
                <p class="seitenlabel">TEAM & ZUSAMMENARBEIT</p>
                <h2>Notizen</h2>
                <p class="untertitel">Ideen und wichtige Informationen sammeln.</p>
            </div>
            <button id="neueNotizButton" type="button">+ Neue Notiz</button>
        </div>

        <p id="notizStatus" class="hinweis" role="status" aria-live="polite"></p>

        <div class="liste" id="notizListe" aria-live="polite">
            <p>Notizen werden geladen ...</p>
        </div>
    `;

    document.getElementById("neueNotizButton")
        .addEventListener("click", neueNotiz);

    const liste = document.getElementById("notizListe");
    const status = document.getElementById("notizStatus");

    try {
        const antwort = await fetch(API_URL + "?bereich=notizen");

        if (!antwort.ok) {
            throw new Error("HTTP " + antwort.status);
        }

        const daten = await antwort.json();

        if (!Array.isArray(daten)) {
            throw new Error("Die API hat keine Notizliste geliefert.");
        }

        alleNotizen = daten;
        liste.replaceChildren();

        if (optionen.status) {
            status.textContent = optionen.status;
        }

        if (alleNotizen.length === 0) {
            const leer = document.createElement("div");
            leer.className = "leerzustand";
            const titel = document.createElement("h3");
            titel.textContent = "Noch keine Notizen vorhanden";
            const text = document.createElement("p");
            text.textContent = "Lege die erste Notiz für euer Team an.";
            leer.append(titel, text);
            liste.appendChild(leer);
            return;
        }

        alleNotizen.forEach(notiz => {
            const karte = document.createElement("article");
            karte.className = "begriffkarte";

            const titel = document.createElement("h3");
            titel.textContent = notiz.title || "Ohne Titel";

            const text = document.createElement("p");
            text.className = "begriffdefinition";
            text.style.whiteSpace = "pre-wrap";
            text.textContent = notiz.text || "";

            karte.append(titel, text);

            if (notiz.author) {
                const autor = document.createElement("p");
                autor.className = "hinweis";
                autor.textContent = "Eingetragen von: " + notiz.author;
                karte.appendChild(autor);
            }

            const aktionen = document.createElement("div");
            aktionen.className = "begriff-aktionen";

            const bearbeiten = document.createElement("button");
            bearbeiten.type = "button";
            bearbeiten.className = "bearbeiten-button";
            bearbeiten.textContent = "✏️ Bearbeiten";
            bearbeiten.addEventListener("click", () => notizFormularAnzeigen(notiz));

            const loeschen = document.createElement("button");
            loeschen.type = "button";
            loeschen.className = "loeschen-button";
            loeschen.textContent = "🗑️ Löschen";
            loeschen.addEventListener("click", () => loeschenNotiz(notiz));

            aktionen.append(bearbeiten, loeschen);
            karte.appendChild(aktionen);
            liste.appendChild(karte);
        });
    } catch (fehler) {
        liste.replaceChildren();
        const meldung = document.createElement("p");
        meldung.className = "fehlermeldung";
        meldung.textContent =
            "Notizen konnten nicht geladen werden: " + fehler.message;
        liste.appendChild(meldung);
    }
}

function notizFormularAnzeigen(notiz = null) {
    const liste = document.getElementById("notizListe");
    const istBearbeitung = Boolean(notiz);

    liste.innerHTML = `
        <div class="formularbereich">
            <h3>${istBearbeitung ? "Notiz bearbeiten" : "Neue Notiz hinzufügen"}</h3>

            <form id="notizFormular">
                <label for="notizTitel">Titel *</label>
                <input id="notizTitel" name="title" required maxlength="200"
                    placeholder="z. B. Ideen für das Projekttreffen">

                <label for="notizText">Notiz *</label>
                <textarea id="notizText" name="text" required
                    maxlength="5000" rows="6"
                    placeholder="Was soll das Team wissen?"></textarea>

                <label for="notizAutor">Autor</label>
                <input id="notizAutor" name="author" maxlength="100"
                    placeholder="Dein Name (optional)">

                <div class="formularaktionen">
                    <button type="submit" id="notizSpeichern">
                        ${istBearbeitung ? "Änderungen speichern" : "Notiz speichern"}
                    </button>
                    <button type="button" id="notizAbbrechen">Abbrechen</button>
                </div>
            </form>

            <p id="notizSpeicherStatus" role="status" aria-live="polite"></p>
        </div>
    `;

    const formular = document.getElementById("notizFormular");

    if (notiz) {
        formular.elements.title.value = notiz.title || "";
        formular.elements.text.value = notiz.text || "";
        formular.elements.author.value = notiz.author || "";
    }

    document.getElementById("notizAbbrechen")
        .addEventListener("click", () => zeigeNotizen());

    formular.addEventListener("submit", async event => {
        event.preventDefault();

        const status = document.getElementById("notizSpeicherStatus");
        const button = document.getElementById("notizSpeichern");

        const daten = {
            bereich: "notizen",
            action: istBearbeitung ? "update" : "create",
            title: formular.elements.title.value.trim(),
            text: formular.elements.text.value.trim(),
            author: formular.elements.author.value.trim()
        };

        if (istBearbeitung) {
            daten.id = notiz.id;
        }

        if (!daten.title || !daten.text) {
            status.textContent = "Bitte Titel und Notiz ausfüllen.";
            return;
        }

        button.disabled = true;
        status.textContent = "Speichervorgang wird ausgeführt ...";

        try {
            await apiAnfrage(daten);
            await new Promise(resolve => setTimeout(resolve, 1200));
            await zeigeNotizen({ status: "Notiz gesendet. Sie sollte jetzt in der Liste stehen." });
        } catch (fehler) {
            status.textContent = "Fehler beim Senden: " + fehler.message;
            button.disabled = false;
        }
    });
}

function neueNotiz() {
    notizFormularAnzeigen();
}

async function loeschenNotiz(notiz) {
    if (!notiz.id) {
        alert("Diese Notiz hat keine ID und kann nicht gelöscht werden.");
        return;
    }

    const bestaetigt = confirm(
        `Möchtest du die Notiz „${notiz.title}“ wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`
    );

    if (!bestaetigt) return;

    const status = document.getElementById("notizStatus");
    status.textContent = "Löschanfrage wird gesendet ...";

    try {
        await apiAnfrage({ bereich: "notizen", action: "delete", id: notiz.id });
        await new Promise(resolve => setTimeout(resolve, 1200));
        await zeigeNotizen({ status: `Notiz „${notiz.title}“ wurde gelöscht.` });
    } catch (fehler) {
        status.textContent = "Fehler beim Löschen: " + fehler.message;
    }
}

/* ---------- Start ---------- */

zeigeGlossar();

