
const API_URL = https://script.google.com/macros/s/AKfycbxO6Xt4gZnFKA_rr2zRBD5AVHcUWxXZ7GM69UsKKaw7gOmoRZwukcvGUcjr6PNwBnvl/exec;

async function zeigeGlossar() {
    const app = document.getElementById("app");

    app.innerHTML = `
        <h2>📖 Glossar</h2>

        <button onclick="neuerBegriff()">
            + Neuer Begriff
        </button>

        <div class="liste" id="glossarListe">
            <p>Glossar wird geladen ...</p>
        </div>
    `;

    try {
        const antwort = await fetch(API_URL);
        if (!antwort.ok) {
            throw new Error("HTTP " + antwort.status);
        }

        const begriffe = await antwort.json();
        const liste = document.getElementById("glossarListe");

        if (!Array.isArray(begriffe)) {
            throw new Error("Die API liefert keine Liste.");
        }

        if (begriffe.length === 0) {
            liste.innerHTML = "<p>Noch keine Begriffe vorhanden.</p>";
            return;
        }

        liste.replaceChildren();

        begriffe.forEach((begriff) => {
            const eintrag = document.createElement("p");

            if (typeof begriff === "string") {
                eintrag.textContent = begriff;
            } else {
                eintrag.textContent = JSON.stringify(begriff);
            }

            liste.appendChild(eintrag);
        });
    } catch (fehler) {
        document.getElementById("glossarListe").textContent =
            "Glossar konnte nicht geladen werden: " + fehler.message;
    }
}

function zeigeNotizen() {
    document.getElementById("app").innerHTML = `
        <h2>📝 Notizen</h2>

        <button onclick="neueNotiz()">
            + Neue Notiz
        </button>

        <div class="liste">
            <p>Hier werden später eure gemeinsamen Notizen angezeigt.</p>
        </div>
    `;
}

function neueNotiz() {
    alert("Die Funktion zum Erstellen einer Notiz kommt als Nächstes.");
}

function neuerBegriff() {
    alert("Die Funktion zum Erstellen eines Begriffs kommt als Nächstes.");
}
