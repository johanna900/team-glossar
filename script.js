
const API_URL = https://script.google.com/macros/s/AKfycbybsJKxWfUbeysLy2QdTTE4MT45PWjWnwMLx_yQaVslSt7J2Z4NXBw-fNvkXXnCgAog/exec;

async function zeigeGlossar() {
    const app = document.getElementById("app");

    app.innerHTML = `
        <h2>📖 Glossar</h2>
        <button id="neuerBegriffButton">+ Neuer Begriff</button>
        <div class="liste" id="glossarListe">
            <p>Glossar wird geladen ...</p>
        </div>
    `;

    document.getElementById("neuerBegriffButton")
        .addEventListener("click", neuerBegriff);

    const liste = document.getElementById("glossarListe");

    try {
        const antwort = await fetch(API_URL);
        if (!antwort.ok) {
            throw new Error("HTTP " + antwort.status);
        }

        const begriffe = await antwort.json();

        if (!Array.isArray(begriffe)) {
            throw new Error("Die API hat keine Liste geliefert.");
        }

        liste.replaceChildren();

        if (begriffe.length === 0) {
            liste.textContent = "Noch keine Begriffe vorhanden.";
            return;
        }

        begriffe.forEach(begriff => {
            const eintrag = document.createElement("article");
            const titel = document.createElement("h3");
            const definition = document.createElement("p");

            titel.textContent = begriff.term || "";
            definition.textContent = begriff.definition || "";

            eintrag.append(titel, definition);
            liste.appendChild(eintrag);
        });
    } catch (fehler) {
        liste.textContent =
            "Glossar konnte nicht geladen werden: " + fehler.message;
    }
}

function zeigeNotizen() {
    document.getElementById("app").innerHTML = `
        <h2>📝 Notizen</h2>
        <button id="neueNotizButton">+ Neue Notiz</button>
        <div class="liste">
            <p>Hier werden später eure gemeinsamen Notizen angezeigt.</p>
        </div>
    `;

    document.getElementById("neueNotizButton")
        .addEventListener("click", neueNotiz);
}


function neuerBegriff() {
    const liste = document.getElementById("glossarListe");

    liste.innerHTML = `
        <h3>Neuen Begriff hinzufügen</h3>

        <form id="begriffFormular">
            <label for="term">Begriff</label>
            <input id="term" name="term" required>

            <label for="category">Kategorie</label>
            <input id="category" name="category">

            <label for="definition">Definition</label>
            <textarea id="definition" name="definition" required></textarea>

            <label for="author">Autor</label>
            <input id="author" name="author">

            <button type="submit">Begriff speichern</button>
            <button type="button" id="abbrechenButton">Abbrechen</button>
        </form>

        <p id="speicherStatus"></p>
    `;

    document.getElementById("abbrechenButton")
        .addEventListener("click", zeigeGlossar);

    document.getElementById("begriffFormular")
        .addEventListener("submit", async function(event) {
            event.preventDefault();

            document.getElementById("speicherStatus").textContent =
                "Die Verbindung zum Speichern richten wir als Nächstes ein.";
        });
}

}

function neuerBegriff() {
    alert("Die Speicherfunktion bauen wir als Nächstes ein.");
}
