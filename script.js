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

// Sendet eine Anfrage an das Backend und liest die Antwort.
// Ist jemand angemeldet, wird der Token automatisch mitgeschickt.
async function apiAnfrage(daten) {
    const sitzung = ladeSitzung();

    if (sitzung) {
        daten.token = sitzung.token;
    }

    const antwort = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(daten)
    });

    const ergebnis = await antwort.json();

    if (!ergebnis.success) {
        if (ergebnis.login) {
            loescheSitzung();
            aktualisiereKonto();
            throw new Error("Bitte melde dich erneut an.");
        }

        throw new Error(ergebnis.error || "Unbekannter Fehler");
    }

    return ergebnis;
}

/* ---------- Glossar ---------- */

async function zeigeGlossar(optionen = {}) {
    setzeAktivenBereich("glossar");

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="seitenkopf">
            <div>
                <p class="seitenlabel">WISSEN & LEXIKON</p>
                <h2>Glossar</h2>
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

                <p class="hinweis">Der Autor wird automatisch aus deinem Konto eingetragen.</p>

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
            definition: formular.elements.definition.value.trim()
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
    if (!benoetigtLogin(() => zeigeGlossar().then(() => begriffFormularAnzeigen()))) return;

    begriffFormularAnzeigen();
}

function bearbeitenBegriff(begriff) {
    if (!benoetigtLogin(() => zeigeGlossar())) return;

    if (!begriff.id) {
        alert("Dieser Eintrag hat keine ID und kann nicht bearbeitet werden.");
        return;
    }

    begriffFormularAnzeigen(begriff);
}

async function loeschenBegriff(begriff) {
    if (!benoetigtLogin(() => zeigeGlossar())) return;

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

let suchbegriffNotizen = "";

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

        <div class="suchbereich">
            <label for="notizSuche">Notizen durchsuchen</label>
            <input
                id="notizSuche"
                type="search"
                placeholder="Titel, Text oder Autor suchen ..."
                autocomplete="off"
            >
            <p id="notizTrefferInfo" class="hinweis">Notizen werden geladen ...</p>
        </div>

        <p id="notizStatus" class="hinweis" role="status" aria-live="polite"></p>

        <div class="liste" id="notizListe" aria-live="polite">
            <p>Notizen werden geladen ...</p>
        </div>
    `;

    document.getElementById("neueNotizButton")
        .addEventListener("click", neueNotiz);

    const suche = document.getElementById("notizSuche");
    const liste = document.getElementById("notizListe");
    const trefferInfo = document.getElementById("notizTrefferInfo");
    const status = document.getElementById("notizStatus");

    suche.value = optionen.suche ?? suchbegriffNotizen;

    function renderNotizen() {
        const suchtext = suche.value.trim().toLocaleLowerCase("de");
        suchbegriffNotizen = suche.value;

        const gefiltert = alleNotizen.filter(notiz =>
            [notiz.title, notiz.text, notiz.author]
                .filter(Boolean).join(" ").toLocaleLowerCase("de")
                .includes(suchtext)
        );

        liste.replaceChildren();
        trefferInfo.textContent =
            `${gefiltert.length} von ${alleNotizen.length} Notizen`;

        if (gefiltert.length === 0) {
            const leer = document.createElement("div");
            leer.className = "leerzustand";
            const titel = document.createElement("h3");
            titel.textContent = suchtext
                ? "Keine Treffer gefunden"
                : "Noch keine Notizen vorhanden";
            const text = document.createElement("p");
            text.textContent = suchtext
                ? "Versuche einen anderen Suchbegriff."
                : "Lege die erste Notiz für euer Team an.";
            leer.append(titel, text);
            liste.appendChild(leer);
            return;
        }

        gefiltert.forEach(notiz => {
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
            bearbeiten.addEventListener("click", () => bearbeitenNotiz(notiz));

            const loeschen = document.createElement("button");
            loeschen.type = "button";
            loeschen.className = "loeschen-button";
            loeschen.textContent = "🗑️ Löschen";
            loeschen.addEventListener("click", () => loeschenNotiz(notiz));

            aktionen.append(bearbeiten, loeschen);
            karte.appendChild(aktionen);
            liste.appendChild(karte);
        });
    }

    suche.addEventListener("input", renderNotizen);

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
        renderNotizen();

        if (optionen.status) {
            status.textContent = optionen.status;
        }
    } catch (fehler) {
        liste.replaceChildren();
        const meldung = document.createElement("p");
        meldung.className = "fehlermeldung";
        meldung.textContent =
            "Notizen konnten nicht geladen werden: " + fehler.message;
        liste.appendChild(meldung);
        trefferInfo.textContent = fehler.message;
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

                <p class="hinweis">Der Autor wird automatisch aus deinem Konto eingetragen.</p>

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
            text: formular.elements.text.value.trim()
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
    if (!benoetigtLogin(() => zeigeNotizen().then(() => notizFormularAnzeigen()))) return;

    notizFormularAnzeigen();
}

function bearbeitenNotiz(notiz) {
    if (!benoetigtLogin(() => zeigeNotizen())) return;

    notizFormularAnzeigen(notiz);
}

async function loeschenNotiz(notiz) {
    if (!benoetigtLogin(() => zeigeNotizen())) return;

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

/* ---------- Hell/Dunkel-Modus ---------- */

function setzeTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    const button = document.getElementById("themeButton");

    if (button) {
        const dunkel = theme === "dark";
        button.textContent = dunkel ? "☀️ Hell" : "🌙 Dunkel";
        button.setAttribute(
            "aria-label",
            dunkel ? "Zum hellen Modus wechseln" : "Zum dunklen Modus wechseln"
        );
    }
}

function initialisiereTheme() {
    const button = document.createElement("button");
    button.id = "themeButton";
    button.type = "button";
    button.className = "theme-button";
    document.body.appendChild(button);

    button.addEventListener("click", () => {
        const aktuell = document.documentElement.getAttribute("data-theme");
        setzeTheme(aktuell === "dark" ? "light" : "dark");
    });

    // Gespeicherte Wahl nutzen, sonst die Einstellung des Geräts
    const gespeichert = localStorage.getItem("theme");
    const systemDunkel = window.matchMedia("(prefers-color-scheme: dark)").matches;

    setzeTheme(gespeichert || (systemDunkel ? "dark" : "light"));
}

initialisiereTheme();

/* ---------- Konten: Anmeldung und Registrierung ---------- */

function ladeSitzung() {
    try {
        const s = JSON.parse(localStorage.getItem("glossar-sitzung") || "null");
        return s && s.name && s.token ? s : null;
    } catch (fehler) {
        return null;
    }
}

function speichereSitzung(sitzung) {
    localStorage.setItem("glossar-sitzung", JSON.stringify(sitzung));
}

function loescheSitzung() {
    localStorage.removeItem("glossar-sitzung");
}

// Gibt true zurück, wenn jemand angemeldet ist. Sonst öffnet sich das
// Anmeldeformular, und danach wird "weiter" ausgeführt.
function benoetigtLogin(weiter) {
    if (ladeSitzung()) return true;
    zeigeLogin(weiter);
    return false;
}

async function abmelden() {
    try {
        await apiAnfrage({ bereich: "konto", action: "logout" });
    } catch (fehler) {
        // Lokal abmelden funktioniert auch ohne Antwort vom Server
    }
    loescheSitzung();
    aktualisiereKonto();
    zeigeGlossar();
}

function aktualisiereKonto() {
    let leiste = document.getElementById("kontoLeiste");

    if (!leiste) {
        leiste = document.createElement("div");
        leiste.id = "kontoLeiste";
        leiste.className = "konto-leiste";
        (document.querySelector("header") || document.body).appendChild(leiste);
    }

    leiste.replaceChildren();

    const sitzung = ladeSitzung();
    const info = document.createElement("span");

    if (sitzung) {
        info.textContent = "Angemeldet als " + sitzung.name;

        const knopf = document.createElement("button");
        knopf.type = "button";
        knopf.textContent = "Abmelden";
        knopf.addEventListener("click", abmelden);

        leiste.append(info, knopf);
    } else {
        info.textContent = "Nicht angemeldet";

        const anmelden = document.createElement("button");
        anmelden.type = "button";
        anmelden.textContent = "Anmelden";
        anmelden.addEventListener("click", () => zeigeLogin(() => zeigeGlossar(), "login"));

        const registrieren = document.createElement("button");
        registrieren.type = "button";
        registrieren.textContent = "Registrieren";
        registrieren.addEventListener("click", () => zeigeLogin(() => zeigeGlossar(), "register"));

        leiste.append(info, anmelden, registrieren);
    }
}

function zeigeLogin(weiter, modus = "login") {
    const istLogin = modus === "login";

    document.getElementById("app").innerHTML = `
        <div class="formularbereich">
            <h3>${istLogin ? "Anmelden" : "Konto erstellen"}</h3>
            <p class="untertitel">
                ${istLogin
                    ? "Melde dich an, um Einträge zu erstellen oder zu ändern."
                    : "Wähle einen Benutzernamen und ein Passwort."}
            </p>

            <form id="loginFormular">
                <label for="loginName">Benutzername</label>
                <input id="loginName" name="name" required minlength="3"
                    maxlength="30" autocomplete="username">

                <label for="loginPasswort">Passwort</label>
                <input id="loginPasswort" name="passwort" type="password"
                    required minlength="6" maxlength="100"
                    autocomplete="${istLogin ? "current-password" : "new-password"}">

                <div class="formularaktionen">
                    <button type="submit" id="loginSenden">
                        ${istLogin ? "Anmelden" : "Konto erstellen"}
                    </button>
                    <button type="button" id="loginWechsel" class="sekundaer-button">
                        ${istLogin ? "Noch kein Konto? Registrieren" : "Schon ein Konto? Anmelden"}
                    </button>
                </div>
            </form>

            <p id="loginStatus" role="status" aria-live="polite"></p>
            <p class="hinweis">Dies ist ein Uni-Projekt. Nutze bitte kein Passwort, das du auch woanders verwendest.</p>
        </div>
    `;

    const formular = document.getElementById("loginFormular");
    const status = document.getElementById("loginStatus");
    const senden = document.getElementById("loginSenden");

    document.getElementById("loginWechsel").addEventListener("click", () =>
        zeigeLogin(weiter, istLogin ? "register" : "login")
    );

    formular.addEventListener("submit", async event => {
        event.preventDefault();

        senden.disabled = true;
        status.textContent = istLogin ? "Anmeldung läuft ..." : "Konto wird erstellt ...";

        try {
            const antwort = await apiAnfrage({
                bereich: "konto",
                action: istLogin ? "login" : "register",
                name: formular.elements.name.value.trim(),
                passwort: formular.elements.passwort.value
            });

            speichereSitzung({ name: antwort.name, token: antwort.token });
            aktualisiereKonto();
            (weiter || zeigeGlossar)();
        } catch (fehler) {
            status.textContent = fehler.message;
            senden.disabled = false;
        }
    });

    document.getElementById("loginName").focus();
}

aktualisiereKonto();

/* ---------- Start ---------- */

zeigeGlossar();
