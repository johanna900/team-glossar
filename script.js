function zeigeNotizen() {

    document.getElementById("app").innerHTML = `
        <h2>Notizen</h2>

        <button onclick="neueNotiz()">
            + Neue Notiz
        </button>

        <div id="notizen">
            <p>Hier werden später eure Notizen angezeigt.</p>
        </div>
    `;
}


function zeigeGlossar() {

    document.getElementById("app").innerHTML = `
        <h2>Glossar</h2>

        <button onclick="neuerBegriff()">
            + Neuer Begriff
        </button>

        <div id="glossar">
            <p>Hier werden später eure Begriffe angezeigt.</p>
        </div>
    `;
}


function neueNotiz() {

    alert("Hier wird später eine neue Notiz erstellt.");
}


function neuerBegriff() {

    alert("Hier wird später ein neuer Begriff erstellt.");
}
