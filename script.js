const API_URL = "https://script.google.com/macros/s/AKfycbybsJKxWfUbeysLy2QdTTE4MT45PWjWnwMLx_yQaVslSt7J2Z4NXBw-fNvkXXnCgAog/exec";

let alleBegriffe = [];

async function zeigeGlossar() {
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
            <button id="neuerBegriffButton">
                + Neuer Begriff
            </button>
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

        function renderBegriffe() {
            const suchtext = suche.value
                .trim()
                .toLocaleLowerCase("de");

            const gefiltert = alleBegriffe.filter(begriff => {
                const text = [
                    begriff.term,
                    begriff.definition,
                    begriff.category
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
                liste.appendChild(eintrag);
            });
        }

        suche.addEventListener("input", renderBegriffe);
        renderBegriffe();

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
