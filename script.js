
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

function neueNotiz() {
    alert("Die Funktion zum Erstellen einer Notiz kommt als Nächstes.");
}

function neuerBegriff() {
    alert("Die Speicherfunktion bauen wir als Nächstes ein.");
}
