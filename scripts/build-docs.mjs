// Builds the multilingual guide on the website from the app.
// The chapters come from renderer/guide.js (the in-app vademecum).
// The complete shortcut table is the list behind the ? button
// (renderer/index.html), with the action names in the same words
// the guide already uses in each language.
//
// node scripts/build-docs.mjs

import fs from "fs";
import path from "path";
import vm from "vm";

const website = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const app = path.resolve(process.env.DOWNSTAGE_APP || path.join(website, "..", "downstage"));
const guideFile = path.join(app, "renderer", "guide.js");
const guideDir = path.join(app, "renderer", "guide");
const outDir = path.join(website, "site", "docs");

const LANGS = ["en", "it", "fr", "de", "es", "pt"];
const T = (en, it, fr, de, es, pt) => ({ en, it, fr, de, es, pt });

function pick(value, lang) {
  if (typeof value === "string") return value;
  const text = value[lang];
  if (!text) throw new Error("Missing " + lang + " translation");
  return text;
}

const UI = {
  lede: T(
    "The same guide as in the app (F1), and the full shortcut list from the ? button.",
    "La stessa guida dell'app (F1) e l'elenco completo delle scorciatoie del pulsante ?.",
    "Le même guide que dans l'app (F1), et la liste complète des raccourcis du bouton ?.",
    "Dieselbe Anleitung wie in der App (F1) und die vollständige Liste der Tastaturbefehle hinter ?.",
    "La misma guía de la app (F1) y la lista completa de atajos del botón ?.",
    "O mesmo guia do app (F1) e a lista completa de atalhos do botão ?."
  ),
  description: T(
    "The Downstage guide: recording, editing, the console, the rack and every shortcut, in the same words as the app.",
    "La guida di Downstage: registrazione, editing, console, rack e tutte le scorciatoie, con le stesse parole dell'app.",
    "Le guide Downstage : enregistrement, édition, console, rack et tous les raccourcis, dans les mêmes mots que l'app.",
    "Die Downstage-Anleitung: Aufnahme, Bearbeitung, Konsole, Rack und alle Tastaturbefehle, im Wortlaut der App.",
    "La guía de Downstage: grabación, edición, consola, rack y todos los atajos, con las mismas palabras de la app.",
    "O guia do Downstage: gravação, edição, console, rack e todos os atalhos, com as mesmas palavras do app."
  ),
  full: T("Complete list", "Elenco completo", "Liste complète", "Vollständige Liste", "Lista completa", "Lista completa"),
  fullLead: T(
    "The same list as the ? button in the app.",
    "Lo stesso elenco del pulsante ? nell'app.",
    "La même liste que le bouton ? dans l'app.",
    "Dieselbe Liste wie hinter der Taste ? in der App.",
    "La misma lista que el botón ? de la app.",
    "A mesma lista do botão ? no app."
  ),
  legend: T(
    "⌘ command · ⌥ option · ⌃ control · ⇧ shift. On a laptop, fn Return is the keypad Enter.",
    "⌘ comando · ⌥ opzione · ⌃ ctrl · ⇧ maiuscolo. Su un portatile, fn Invio è l'Invio del tastierino.",
    "⌘ commande · ⌥ option · ⌃ contrôle · ⇧ majuscule. Sur un portable, fn Retour est l'Entrée du pavé.",
    "⌘ Befehl · ⌥ Option · ⌃ ctrl · ⇧ Umschalt. Auf einem Laptop ist fn Return das Enter des Ziffernblocks.",
    "⌘ comando · ⌥ opción · ⌃ control · ⇧ mayúsculas. En un portátil, fn Intro es el Intro del teclado numérico.",
    "⌘ comando · ⌥ opção · ⌃ controle · ⇧ shift. Num portátil, fn Return é o Enter do teclado numérico."
  ),
  contents: T("Contents", "Indice", "Sommaire", "Inhalt", "Contenido", "Índice"),
  languages: T("Language", "Lingua", "Langue", "Sprache", "Idioma", "Idioma"),
  home: T("Home", "Home", "Accueil", "Start", "Inicio", "Início"),
  download: T("Download", "Scarica", "Télécharger", "Laden", "Descargar", "Baixar"),
  shortcutsNav: T("Shortcuts", "Scorciatoie", "Raccourcis", "Tasten", "Atajos", "Atalhos"),
  created: T("Created by", "Creato da", "Créé par", "Erstellt von", "Creado por", "Criado por"),
  license: T("License Agreement", "Licenza", "Licence", "Lizenz", "Licencia", "Licença"),
  privacy: T("Privacy Notice", "Privacy", "Confidentialité", "Datenschutz", "Privacidad", "Privacidade"),
  nav: T("Main", "Principale", "Principal", "Navigation", "Principal", "Principal"),
};

const optClick = T("⌥ click", "⌥ clic", "⌥ clic", "⌥-Klick", "⌥ clic", "⌥ clique");
const optDrag = T("⌥ drag", "⌥ trascina", "⌥ glisser", "⌥-Ziehen", "⌥ arrastrar", "⌥ arrastar");
const cmdDrag = T("⌘ drag", "⌘ trascina", "⌘ glisser", "⌘-Ziehen", "⌘ arrastrar", "⌘ arrastar");
const shiftDrag = T("⌥⇧ drag", "⌥⇧ trascina", "⌥⇧ glisser", "⌥⇧-Ziehen", "⌥⇧ arrastrar", "⌥⇧ arrastar");
const spacePlay = T("Space · 0", "Spazio · 0", "Espace · 0", "Leertaste · 0", "Espacio · 0", "Espaço · 0");
const spaceRec = T("⌘Space · F12 · 3", "⌘Spazio · F12 · 3", "⌘Espace · F12 · 3", "⌘Leertaste · F12 · 3", "⌘Espacio · F12 · 3", "⌘Espaço · F12 · 3");
const spacePunch = T("⌘Space · F12", "⌘Spazio · F12", "⌘Espace · F12", "⌘Leertaste · F12", "⌘Espacio · F12", "⌘Espaço · F12");
const toStart = T("Return · ⌥Return", "Invio · ⌥Invio", "Retour · ⌥Retour", "Return · ⌥Return", "Intro · ⌥Intro", "Return · ⌥Return");
const markerKey = T("Enter (keypad) · M", "Invio (tastierino) · M", "Entrée (pavé) · M", "Enter (Ziffernblock) · M", "Intro (teclado numérico) · M", "Enter (teclado numérico) · M");
const renameKey = T("double-click · ⌥ click", "doppio clic · ⌥ clic", "double-clic · ⌥ clic", "Doppelklick · ⌥-Klick", "doble clic · ⌥ clic", "clique duplo · ⌥ clique");

const SHORTCUTS = [
  {
    title: T("Windows", "Finestre", "Fenêtres", "Fenster", "Ventanas", "Janelas"),
    rows: [
      [T("Edit / Mix toggle", "Passa da Edit a Mix", "Bascule Edit / Mix", "Edit/Mix umschalten", "Alternar Edit / Mix", "Alternar Edit / Mix"), "⌘="],
      ["Edit · Mix · FX · Rack", "⌘1 · ⌘2 · ⌘3 · ⌘4"],
      [T("Overview: racks and console on one screen", "Overview: rack e console in una schermata", "Overview : racks et console sur un seul écran", "Overview: Racks und Konsole auf einem Bildschirm", "Overview: racks y consola en una pantalla", "Overview: racks e console numa tela"), "⌘6"],
      [T("Narrow Mix, FX or Rack", "Narrow in Mix, FX o Rack", "Narrow dans Mix, FX ou Rack", "Narrow in Mix, FX oder Rack", "Narrow en Mix, FX o Rack", "Narrow em Mix, FX ou Rack"), "⌥N"],
      [T("Shortcuts · Guide", "Scorciatoie · Guida", "Raccourcis · Guide", "Tastaturbefehle · Anleitung", "Atajos · Guía", "Atalhos · Guia"), "? · F1"],
    ],
  },
  {
    title: T("Transport", "Trasporto", "Transport", "Transport", "Transporte", "Transporte"),
    rows: [
      [T("Play / stop", "Play / stop", "Lecture / stop", "Wiedergabe / Stopp", "Reproducir / parar", "Play / stop"), spacePlay],
      [T("Record", "Rec", "Enregistrement", "Aufnahme", "Grabar", "Gravar"), spaceRec],
      [T("Return to start / go to end", "All'inizio / alla fine", "Retour au début / aller à la fin", "Zum Anfang / zum Ende", "Al inicio / al final", "Ao início / ao fim"), toStart],
      [T("Loop", "Loop", "Boucle", "Loop", "Bucle", "Loop"), "L · 4"],
      [T("Back / forward one bar (keypad)", "Indietro / avanti di una battuta (tastierino)", "Une mesure en arrière / en avant (pavé)", "Einen Takt zurück / vor (Ziffernblock)", "Un compás atrás / adelante (teclado numérico)", "Um compasso atrás / à frente (teclado numérico)"), "1 · 2"],
      [T("Click on / off", "Click acceso / spento", "Clic marche / arrêt", "Klick an / aus", "Clic activado / desactivado", "Clique ligado / desligado"), "C · 7"],
    ],
  },
  {
    title: T(
      "Markers and export range (as in Pro Tools)",
      "Marker e intervallo di export (come in Pro Tools)",
      "Marqueurs et plage d'export (comme dans Pro Tools)",
      "Marker und Exportbereich (wie in Pro Tools)",
      "Marcadores y rango de exportación (como en Pro Tools)",
      "Marcadores e intervalo de exportação (como no Pro Tools)"
    ),
    rows: [
      [T("Add a marker at the cursor", "Aggiunge un marker al cursore", "Ajoute un marqueur au curseur", "Marker am Cursor setzen", "Añade un marcador en el cursor", "Adiciona um marcador no cursor"), markerKey],
      [T("Go to marker 3", "Vai al marker 3", "Aller au marqueur 3", "Zu Marker 3", "Ir al marcador 3", "Ir ao marcador 3"), ". 3 ."],
      ["Memory Locations", "⌘5"],
      [T("Export start / end while playing", "Inizio / fine export durante il play", "Début / fin d'export en lecture", "Exportanfang / -ende bei der Wiedergabe", "Inicio / fin de exportación al reproducir", "Início / fim da exportação tocando"), "↓ · ↑"],
      [T("Rename · delete a marker", "Rinomina · cancella un marker", "Renommer · supprimer un marqueur", "Marker umbenennen · löschen", "Renombrar · borrar un marcador", "Renomear · apagar um marcador"), renameKey],
    ],
  },
  {
    title: T("Mute, solo, record arm", "Mute, solo, armare la registrazione", "Mute, solo, armement", "Mute, Solo, Aufnahmebereitschaft", "Mute, solo, armar grabación", "Mute, solo, armar gravação"),
    rows: [
      [T("Every channel", "Tutti i canali", "Toutes les voies", "Alle Kanäle", "Todos los canales", "Todos os canais"), "⌥M · ⌥S · ⌥R"],
      [T("Selected channels", "Canali selezionati", "Voies sélectionnées", "Ausgewählte Kanäle", "Canales seleccionados", "Canais selecionados"), "⌥⇧M · ⌥⇧S · ⌥⇧R"],
      [T("Click with ⌥ / ⌥⇧", "Clic con ⌥ / ⌥⇧", "Clic avec ⌥ / ⌥⇧", "Klick mit ⌥ / ⌥⇧", "Clic con ⌥ / ⌥⇧", "Clique com ⌥ / ⌥⇧"), T("all / selected", "tutti / selezionati", "toutes / sélectionnées", "alle / ausgewählte", "todos / seleccionados", "todos / selecionados")],
      [T("Exclusive solo", "Solo esclusivo", "Solo exclusif", "Exklusives Solo", "Solo exclusivo", "Solo exclusivo"), T("⌘ click S", "⌘ clic su S", "⌘ clic sur S", "⌘-Klick auf S", "⌘ clic en S", "⌘ clique em S")],
      ["Solo safe", T("right click S", "clic destro su S", "clic droit sur S", "Rechtsklick auf S", "clic derecho en S", "clique direito em S")],
      [T("Set several at once", "Imposta più canali insieme", "Régler plusieurs d'un coup", "Mehrere auf einmal setzen", "Ajustar varios a la vez", "Ajustar vários de uma vez"), T("drag across M · S · R", "trascina su M · S · R", "glisser sur M · S · R", "über M · S · R ziehen", "arrastrar sobre M · S · R", "arrastar sobre M · S · R")],
      [T("Reset a fader or knob", "Azzera un fader o una manopola", "Remettre un fader ou un bouton à zéro", "Fader oder Regler zurücksetzen", "Reiniciar un fader o un control", "Zerar um fader ou um knob"), optClick],
      [T("Move selected faders together", "Muove insieme i fader selezionati", "Déplacer ensemble les faders sélectionnés", "Ausgewählte Fader gemeinsam bewegen", "Mover juntos los faders seleccionados", "Mover juntos os faders selecionados"), shiftDrag],
      [T("Fine adjust", "Regolazione fine", "Réglage fin", "Feineinstellung", "Ajuste fino", "Ajuste fino"), cmdDrag],
      [T("Copy / paste channel settings", "Copia / incolla le impostazioni del canale", "Copier / coller les réglages de voie", "Kanaleinstellungen kopieren / einfügen", "Copiar / pegar ajustes de canal", "Copiar / colar ajustes do canal"), "⌘⌥C · ⌘⌥V"],
      [T("Bypass an insert", "Bypass di un insert", "Bypass d'un insert", "Insert auf Bypass", "Bypass de un insert", "Bypass de um insert"), optClick],
      [T("Clear a peak hold", "Azzera un peak hold", "Effacer un peak hold", "Peak Hold löschen", "Borrar un peak hold", "Limpar um peak hold"), T("click the peak", "clic sul picco", "clic sur le pic", "Klick auf den Peak", "clic en el pico", "clique no pico")],
    ],
  },
  {
    title: T("Recording and takes", "Registrazione e take", "Enregistrement et prises", "Aufnahme und Takes", "Grabación y tomas", "Gravação e takes"),
    rows: [
      [T("Punch in / out while playing", "Punch in / out durante il play", "Punch in / out en lecture", "Punch in / out bei der Wiedergabe", "Punch in / out al reproducir", "Punch in / out tocando"), spacePunch],
      [T("Auto punch on the loop range", "Auto punch sull'intervallo di loop", "Auto punch sur la plage de boucle", "Auto-Punch auf dem Loop-Bereich", "Auto punch en el rango del bucle", "Auto punch no intervalo do loop"), T("Punch button", "pulsante Punch", "bouton Punch", "Punch-Taste", "botón Punch", "botão Punch")],
      [T("Show takes", "Mostra le take", "Afficher les prises", "Takes anzeigen", "Mostrar las tomas", "Mostrar os takes"), T("T on the track", "T sulla traccia", "T sur la piste", "T auf der Spur", "T en la pista", "T na faixa")],
      [T("Use the selected part of a take", "Usa la parte selezionata di una take", "Utiliser la partie sélectionnée d'une prise", "Den ausgewählten Teil eines Takes verwenden", "Usar la parte seleccionada de una toma", "Usar a parte selecionada de um take"), "⌥⇧↑"],
    ],
  },
  {
    title: T("Editing", "Editing", "Édition", "Bearbeiten", "Edición", "Edição"),
    rows: [
      ["Slip / Grid", "F2 · F4"],
      [T("Wider / tighter grid", "Griglia più larga / più stretta", "Grille plus large / plus serrée", "Gröberes / feineres Raster", "Rejilla más ancha / más fina", "Grade mais larga / mais estreita"), "− · ="],
      [T("Zoom out / in", "Zoom indietro / avanti", "Zoom arrière / avant", "Herauszoomen / hereinzoomen", "Alejar / acercar", "Afastar / aproximar"), "R · T · ⌘[ · ⌘]"],
      [T("Split at the cursor", "Taglia al cursore", "Couper au curseur", "Am Cursor teilen", "Cortar en el cursor", "Dividir no cursor"), "⌘E"],
      [T("Split / trim / select tool", "Taglio / trim / selezione", "Couper / trim / sélection", "Teilen / Trim / Auswahl", "Corte / recorte / selección", "Divisão / trim / seleção"), "B · F6 · F8"],
      [T("Trim start / end to cursor", "Trim inizio / fine al cursore", "Trim début / fin au curseur", "Anfang / Ende zum Cursor trimmen", "Recortar inicio / fin al cursor", "Trim início / fim no cursor"), "A · S"],
      [T("Fade in / fade out", "Fade in / fade out", "Fondu d'entrée / de sortie", "Einblende / Ausblende", "Fundido de entrada / de salida", "Fade in / fade out"), "D · G"],
      [T("Crossfade", "Crossfade", "Fondu enchaîné", "Überblendung", "Fundido cruzado", "Crossfade"), "⌘F"],
      [T("Copy a clip while dragging", "Copia una clip trascinando", "Copier un clip en glissant", "Clip beim Ziehen kopieren", "Copiar un clip al arrastrar", "Copiar um clip ao arrastar"), optDrag],
      [T("Move a clip to another track", "Sposta una clip su un'altra traccia", "Déplacer un clip sur une autre piste", "Clip auf eine andere Spur bewegen", "Mover un clip a otra pista", "Mover um clip para outra faixa"), T("drag up or down", "trascina su o giù", "glisser vers le haut ou le bas", "nach oben oder unten ziehen", "arrastrar arriba o abajo", "arrastar para cima ou para baixo")],
      [T("Region edge", "Bordo della region", "Bord de la région", "Region-Kante", "Borde de la región", "Borda da região"), "Tab · ⌥Tab"],
      [T("Nudge clip or cursor", "Sposta a piccoli passi clip o cursore", "Décaler le clip ou le curseur", "Clip oder Cursor in Schritten verschieben", "Desplazar el clip o el cursor", "Deslocar o clip ou o cursor"), "← → · + −"],
      [T("Previous / next track", "Traccia precedente / successiva", "Piste précédente / suivante", "Vorherige / nächste Spur", "Pista anterior / siguiente", "Faixa anterior / seguinte"), "↑ ↓ · P ;"],
      [T("Select all · duplicate", "Seleziona tutto · duplica", "Tout sélectionner · dupliquer", "Alles auswählen · duplizieren", "Seleccionar todo · duplicar", "Selecionar tudo · duplicar"), "⌘A · ⌘D"],
      [T("Clip gain ±1 dB", "Gain clip ±1 dB", "Gain du clip ±1 dB", "Clip-Gain ±1 dB", "Ganancia del clip ±1 dB", "Ganho do clip ±1 dB"), "⌃⇧↑ · ⌃⇧↓"],
      [T("Clip commands: loop, normalize, gain", "Comandi clip: loop, normalizza, gain", "Commandes du clip : boucle, normaliser, gain", "Clip-Befehle: Loop, Normalisieren, Gain", "Comandos del clip: bucle, normalizar, ganancia", "Comandos do clip: loop, normalizar, ganho"), T("right click a clip", "clic destro su una clip", "clic droit sur un clip", "Rechtsklick auf einen Clip", "clic derecho en un clip", "clique direito num clip")],
      [T("Delete clip · delete track", "Cancella clip · cancella traccia", "Supprimer le clip · supprimer la piste", "Clip löschen · Spur löschen", "Borrar clip · borrar pista", "Apagar clip · apagar faixa"), "⌫ · ⌘⌫"],
      [T("New track", "Nuova traccia", "Nouvelle piste", "Neue Spur", "Pista nueva", "Nova faixa"), "⌘⇧N"],
    ],
  },
];

const escape = (text) => String(text)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

function clean(html) {
  return html
    .replaceAll('src="brand/logo-app.svg"', 'src="/assets/img/icon-512.png" width="72" height="72"')
    .replaceAll(" data-external", "")
    .replace(/<a href="(https:[^"]+)"\s*>/g, '<a href="$1" rel="noopener">');
}

function keysHtml(text) {
  return text.split(" · ").map((part) => "<kbd>" + escape(part) + "</kbd>").join('<span class="dot">·</span>');
}

function href(code) {
  return code === "en" ? "/docs/" : "/docs/" + code + "/";
}

function loadGuide() {
  const src = fs.readFileSync(guideFile, "utf8");
  const context = { globalThis: {} };
  vm.createContext(context);
  vm.runInContext(src, context);
  const data = context.globalThis.GuideData;
  if (!data || !data.TEXT || !data.CHAPTERS) throw new Error("Guide data missing in " + guideFile);
  return data;
}

function copyImages() {
  const dest = path.join(outDir, "img");
  fs.mkdirSync(dest, { recursive: true });
  let n = 0;
  for (const file of fs.readdirSync(guideDir)) {
    if (!file.endsWith(".jpg")) continue;
    fs.copyFileSync(path.join(guideDir, file), path.join(dest, file));
    n += 1;
  }
  return n;
}

function page(guide, code) {
  const text = guide.TEXT[code];
  const ui = text.ui;
  const toc = [];
  for (const id of guide.CHAPTERS) {
    toc.push({ id, title: text[id][0] });
    if (id === "keys") toc.push({ id: "shortcuts", title: pick(UI.full, code) });
  }

  const chapters = guide.CHAPTERS.map((id) => {
    const [title, body] = text[id];
    const images = guide.IMAGES[id] || [];
    const shots = images.map((file, index) => {
      const src = "/docs/img/" + file + ".jpg";
      return '<button type="button" class="shot docs-shot" data-zoom="' + src + '" title="' + escape(ui.zoom) + '"><img src="' + src + '" alt="' + escape(title) + '"' + (id === "start" && index === 0 ? "" : ' loading="lazy"') + "></button>";
    }).join("");
    const block = [
      '<section id="' + id + '">',
      "<h2>" + escape(title) + "</h2>",
      clean(body.trim()),
      shots ? '<div class="docs-shots">' + shots + "</div>" : "",
      "</section>",
    ];
    if (id !== "keys") return block.join("\n");
    const rows = SHORTCUTS.map((group) => {
      const head = '<tr><th colspan="2">' + escape(pick(group.title, code)) + "</th></tr>";
      const bodyRows = group.rows.map(([label, keys]) => {
        return "<tr><td>" + escape(pick(label, code)) + "</td><td>" + keysHtml(pick(keys, code)) + "</td></tr>";
      }).join("");
      return head + bodyRows;
    }).join("");
    return block.join("\n") + [
      '<section id="shortcuts" aria-labelledby="shortcuts-title">',
      '<h2 id="shortcuts-title">' + escape(pick(UI.full, code)) + "</h2>",
      "<p>" + escape(pick(UI.fullLead, code)) + "</p>",
      '<p class="legend">' + escape(pick(UI.legend, code)) + "</p>",
      '<table class="shortcut-table"><tbody>' + rows + "</tbody></table>",
      "</section>",
    ].join("\n");
  }).join("\n");

  const langs = guide.LANGUAGES.map(([id, label]) => {
    const current = id === code ? ' aria-current="page"' : "";
    return '<a href="' + href(id) + '" hreflang="' + id + '" lang="' + id + '"' + current + ">" + escape(label) + "</a>";
  }).join("");

  const alternates = guide.LANGUAGES.map(([id]) => {
    return '<link rel="alternate" hreflang="' + id + '" href="https://downstage.it' + href(id) + '">';
  }).join("\n  ") + '\n  <link rel="alternate" hreflang="x-default" href="https://downstage.it/docs/">';

  const tocHtml = toc.map((item) => '<li><a href="#' + item.id + '">' + escape(item.title) + "</a></li>").join("");
  const path = code === "en" ? "/docs/" : "/docs/" + code + "/";
  const canonical = "https://downstage.it" + path;

  return `<!doctype html>
<html lang="${code}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Downstage — ${escape(ui.title)}</title>
  <meta name="description" content="${escape(pick(UI.description, code))}">
  <meta name="theme-color" content="#07060b">
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <link rel="icon" type="image/png" href="/assets/img/favicon.png">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <meta property="og:type" content="article">
  <meta property="og:title" content="Downstage — ${escape(ui.title)}">
  <meta property="og:description" content="${escape(pick(UI.description, code))}">
  <meta property="og:image" content="https://downstage.it/assets/img/og.jpg">
  <meta property="og:url" content="${canonical}">
  <meta property="og:locale" content="${code}">
  <link rel="stylesheet" href="/assets/site.css">
  <script async src="https://stats.misterdev.it/i/89d59e1e-1ab3-4794-89c6-c8b602e311b6.js"></script>
  <noscript><img src="https://stats.misterdev.it/collect/pixel.gif?k=89d59e1e-1ab3-4794-89c6-c8b602e311b6&amp;p=${encodeURIComponent(path)}" width="1" height="1" alt=""></noscript>
</head>
<body>
  <header class="top">
    <div class="wrap">
      <a class="brand" href="/" aria-label="Downstage"><img src="/assets/img/icon-512.png" alt=""><b>DOWNSTAGE</b></a>
      <nav class="nav" aria-label="${escape(pick(UI.nav, code))}">
        <a href="/">${escape(pick(UI.home, code))}</a>
        <a href="#shortcuts">${escape(pick(UI.shortcutsNav, code))}</a>
        <a class="btn small" href="/#download">${escape(pick(UI.download, code))}</a>
      </nav>
    </div>
  </header>
  <main class="docs">
    <div class="wrap docs-layout">
      <nav class="docs-nav" aria-label="${escape(pick(UI.contents, code))}">
        <div class="docs-lang" aria-label="${escape(pick(UI.languages, code))}">${langs}</div>
        <ol class="docs-toc">${tocHtml}</ol>
      </nav>
      <article class="docs-body">
        <header class="docs-hero" id="top">
          <p class="eyebrow">Downstage</p>
          <h1 class="neon-cyan">${escape(ui.title)}</h1>
          <p class="lede">${escape(pick(UI.lede, code))}</p>
        </header>
        ${chapters}
      </article>
    </div>
  </main>
  <dialog id="zoom" class="docs-dialog">
    <form method="dialog"><button class="docs-x" aria-label="${escape(ui.close)}">×</button></form>
    <img alt="">
  </dialog>
  <footer>
    <div class="wrap">
      <p class="credits">${escape(pick(UI.created, code))} <a href="https://web.ap.it" rel="author">Andrea Pollastri</a> · <a href="${path}">${escape(ui.title)}</a> · <a href="/terms.html">${escape(pick(UI.license, code))}</a> · <a href="/privacy.html">${escape(pick(UI.privacy, code))}</a></p>
      <p class="fine">© <span data-year>2026</span> Andrea Pollastri. All rights reserved.</p>
    </div>
  </footer>
  <script src="/assets/site.js" defer></script>
  <script src="/assets/docs.js" defer></script>
</body>
</html>
`;
}

const guide = loadGuide();
for (const code of LANGS) {
  if (!guide.TEXT[code]) throw new Error("Guide has no language " + code);
  for (const id of guide.CHAPTERS) {
    if (!guide.TEXT[code][id]) throw new Error("Missing chapter " + id + " in " + code);
  }
}
const images = copyImages();
for (const code of LANGS) {
  const html = page(guide, code);
  if (html.includes("</script>")) {
    const bad = html.split("</script>").length;
    if (bad > 4) throw new Error("Unexpected script close in " + code);
  }
  const file = code === "en" ? path.join(outDir, "index.html") : path.join(outDir, code, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log(file);
}
console.log(images, "screenshots");
