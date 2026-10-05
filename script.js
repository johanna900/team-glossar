function zeigeNotizen() {

    document.getElementById("app").innerHTML = `

        <h2>📝 Notizen</h2>

        <button onclick="neueNotiz()">
            + Neue Notiz
        </button>

        <div class="liste">

            <p>
                Hier werden später eure gemeinsamen
                Notizen angezeigt.
            </p>

        </div>

    `;
}


function zeigeGlossar() {

    document.getElementById("app").innerHTML = `

        <h2>📖 Glossar</h2>

        <button onclick="neuerBegriff()">
            + Neuer Begriff
        </button>

        <div class="liste">

            <p>
                Hier werden später eure
                Begriffserklärungen angezeigt.
            </p>

        </div>

    `;
}


function neueNotiz() {

    alert("Die Funktion zum Erstellen einer Notiz kommt als Nächstes.");
}


function neuerBegriff() {

    alert("Die Funktion zum Erstellen eines Begriffs kommt als Nächstes.");
}
