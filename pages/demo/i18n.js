(function () {
  const STORAGE_KEY = "jsswift-demo-language";
  const DEFAULT_LANGUAGE = "it";
  const SUPPORTED_LANGUAGES = ["it", "en", "fr", "es", "de", "pt"];

  const LANGUAGE_LABELS = {
    it: "Italiano",
    en: "English",
    fr: "Francais",
    es: "Espanol",
    de: "Deutsch",
    pt: "Portugues",
  };

  const DICTIONARY = {
    common: {
      languageLabel: {
        it: "Lingua",
        en: "Language",
        fr: "Langue",
        es: "Idioma",
        de: "Sprache",
        pt: "Idioma",
      },
      navHome: {
        it: "Home",
        en: "Home",
        fr: "Accueil",
        es: "Inicio",
        de: "Start",
        pt: "Inicio",
      },
      navUi: {
        it: "UI",
        en: "UI",
        fr: "UI",
        es: "UI",
        de: "UI",
        pt: "UI",
      },
      navCore: {
        it: "JSswift",
        en: "JSswift",
        fr: "JSswift",
        es: "JSswift",
        de: "JSswift",
        pt: "JSswift",
      },
      navDevelopers: {
        it: "Developer View",
        en: "Developer View",
        fr: "Vue Developpeur",
        es: "Vista Developer",
        de: "Developer View",
        pt: "Visao Developer",
      },
    },
    home: {
      metaTitle: {
        it: "JSswift Demo",
        en: "JSswift Demo",
        fr: "Demo JSswift",
        es: "Demo JSswift",
        de: "JSswift Demo",
        pt: "Demo JSswift",
      },
      heroEyebrow: {
        it: "JSswift Framework",
        en: "JSswift Framework",
        fr: "Framework JSswift",
        es: "Framework JSswift",
        de: "JSswift Framework",
        pt: "Framework JSswift",
      },
      heroTitle: {
        it: "Una demo locale pulita per vedere JSswift e UI senza rumore.",
        en: "A clean local demo to explore JSswift and UI without noise.",
        fr: "Une demo locale claire pour explorer JSswift et UI sans bruit.",
        es: "Una demo local limpia para explorar JSswift y UI sin ruido.",
        de: "Eine klare lokale Demo, um JSswift und UI ohne Ballast zu sehen.",
        pt: "Uma demo local limpa para explorar JSswift e UI sem ruido.",
      },
      heroCopy: {
        it: "Questa pagina resta semplice: entra nella parte UI, entra nella parte JSswift core, oppure apri la pagina pensata come introduzione per developer.",
        en: "This page stays simple: enter the UI section, enter the JSswift core section, or open the page designed as an introduction for developers.",
        fr: "Cette page reste simple : entrez dans la partie UI, dans le core JSswift, ou ouvrez la page pensee comme introduction pour les developpeurs.",
        es: "Esta pagina se mantiene simple: entra en la parte UI, entra en la parte core de JSswift o abre la pagina pensada como introduccion para developers.",
        de: "Diese Seite bleibt einfach: gehe zur UI, zum JSswift-Core oder zur Einfuehrungsseite fuer Entwickler.",
        pt: "Esta pagina continua simples: entre na parte UI, entre no core do JSswift ou abra a pagina pensada como introducao para developers.",
      },
      ctaUi: {
        it: "Apri UI",
        en: "Open UI",
        fr: "Ouvrir UI",
        es: "Abrir UI",
        de: "UI oeffnen",
        pt: "Abrir UI",
      },
      ctaCore: {
        it: "Apri JSswift",
        en: "Open JSswift",
        fr: "Ouvrir JSswift",
        es: "Abrir JSswift",
        de: "JSswift oeffnen",
        pt: "Abrir JSswift",
      },
      ctaDevelopers: {
        it: "Apri Developer View",
        en: "Open Developer View",
        fr: "Ouvrir la vue developpeur",
        es: "Abrir vista developer",
        de: "Developer View oeffnen",
        pt: "Abrir visao developer",
      },
      uiTitle: {
        it: "Componenti pronti",
        en: "Ready components",
        fr: "Composants prets",
        es: "Componentes listos",
        de: "Fertige Komponenten",
        pt: "Componentes prontos",
      },
      uiCopy: {
        it: "Layout, form, feedback e composizione visuale con API coerente.",
        en: "Layout, forms, feedback and visual composition with a consistent API.",
        fr: "Layout, formulaires, feedback et composition visuelle avec une API coherente.",
        es: "Layout, formularios, feedback y composicion visual con una API coherente.",
        de: "Layout, Formulare, Feedback und visuelle Komposition mit konsistenter API.",
        pt: "Layout, formularios, feedback e composicao visual com uma API coerente.",
      },
      uiPoint1: {
        it: "Componenti riusabili",
        en: "Reusable components",
        fr: "Composants reutilisables",
        es: "Componentes reutilizables",
        de: "Wiederverwendbare Komponenten",
        pt: "Componentes reutilizaveis",
      },
      uiPoint2: {
        it: "Styling gia integrato",
        en: "Styling already included",
        fr: "Styling deja integre",
        es: "Estilo ya integrado",
        de: "Styling bereits integriert",
        pt: "Estilo ja integrado",
      },
      uiPoint3: {
        it: "Esempi piccoli ma reali",
        en: "Small but real examples",
        fr: "Petits exemples mais reels",
        es: "Ejemplos pequenos pero reales",
        de: "Kleine, aber reale Beispiele",
        pt: "Exemplos pequenos mas reais",
      },
      uiLink: {
        it: "Vai alla pagina UI",
        en: "Go to the UI page",
        fr: "Aller a la page UI",
        es: "Ir a la pagina UI",
        de: "Zur UI-Seite",
        pt: "Ir para a pagina UI",
      },
      coreTitle: {
        it: "Renderer e reattivita",
        en: "Renderer and reactivity",
        fr: "Renderer et reactivite",
        es: "Renderer y reactividad",
        de: "Renderer und Reaktivitaet",
        pt: "Renderer e reatividade",
      },
      coreCopy: {
        it: "Helper HTML, signal, computed, effect e component model senza stack pesante.",
        en: "HTML helpers, signal, computed, effect and component model without a heavy stack.",
        fr: "Helpers HTML, signal, computed, effect et component model sans stack lourd.",
        es: "Helpers HTML, signal, computed, effect y component model sin una pila pesada.",
        de: "HTML-Helper, signal, computed, effect und Komponentenmodell ohne schweren Stack.",
        pt: "Helpers HTML, signal, computed, effect e component model sem uma stack pesada.",
      },
      corePoint1: {
        it: "HTML helpers coerenti",
        en: "Consistent HTML helpers",
        fr: "Helpers HTML coherents",
        es: "Helpers HTML coherentes",
        de: "Konsistente HTML-Helper",
        pt: "Helpers HTML coerentes",
      },
      corePoint2: {
        it: "Reactive primitives semplici",
        en: "Simple reactive primitives",
        fr: "Primitives reactives simples",
        es: "Primitivas reactivas simples",
        de: "Einfache reaktive Primitiven",
        pt: "Primitivas reativas simples",
      },
      corePoint3: {
        it: "Binding diretto con `rod`",
        en: "Direct binding with `rod`",
        fr: "Binding direct avec `rod`",
        es: "Binding directo con `rod`",
        de: "Direktes Binding mit `rod`",
        pt: "Binding direto com `rod`",
      },
      coreLink: {
        it: "Vai alla pagina JSswift",
        en: "Go to the JSswift page",
        fr: "Aller a la page JSswift",
        es: "Ir a la pagina JSswift",
        de: "Zur JSswift-Seite",
        pt: "Ir para a pagina JSswift",
      },
      developerTitle: {
        it: "Visione prodotto",
        en: "Product view",
        fr: "Vision produit",
        es: "Vision de producto",
        de: "Produktsicht",
        pt: "Visao de produto",
      },
      developerCopy: {
        it: "Una pagina fatta per capire dove il framework puo portare un team o un solo developer.",
        en: "A page built to show where the framework can take a team or a solo developer.",
        fr: "Une page faite pour montrer ou le framework peut mener une equipe ou un developpeur seul.",
        es: "Una pagina hecha para mostrar a donde puede llevar el framework a un equipo o a un developer solo.",
        de: "Eine Seite, die zeigt, wohin das Framework ein Team oder einen einzelnen Entwickler bringen kann.",
        pt: "Uma pagina feita para mostrar onde o framework pode levar uma equipe ou um developer sozinho.",
      },
      developerPoint1: {
        it: "Package structure chiara",
        en: "Clear package structure",
        fr: "Structure de packages claire",
        es: "Estructura de paquetes clara",
        de: "Klare Paketstruktur",
        pt: "Estrutura de pacotes clara",
      },
      developerPoint2: {
        it: "Publish npm e CDN",
        en: "npm and CDN publishing",
        fr: "Publication npm et CDN",
        es: "Publicacion npm y CDN",
        de: "npm- und CDN-Publishing",
        pt: "Publicacao npm e CDN",
      },
      developerPoint3: {
        it: "Adozione progressiva",
        en: "Progressive adoption",
        fr: "Adoption progressive",
        es: "Adopcion progresiva",
        de: "Schrittweise Einfuehrung",
        pt: "Adocao progressiva",
      },
      developerLink: {
        it: "Apri la pagina developer",
        en: "Open the developer page",
        fr: "Ouvrir la page developpeur",
        es: "Abrir la pagina developer",
        de: "Developer-Seite oeffnen",
        pt: "Abrir a pagina developer",
      },
      whyTitle: {
        it: "Perche questa demo esiste",
        en: "Why this demo exists",
        fr: "Pourquoi cette demo existe",
        es: "Por que existe esta demo",
        de: "Warum diese Demo existiert",
        pt: "Por que esta demo existe",
      },
      whyCopy: {
        it: "`pages/` non e piu un tutorial enorme. Qui resta una shell locale corta, facile da capire e utile per mostrare il framework in modo diretto.",
        en: "`pages/` is no longer a huge tutorial. It stays a short local shell, easy to understand and useful for showing the framework directly.",
        fr: "`pages/` n'est plus un gros tutoriel. Il reste une base locale courte, facile a comprendre et utile pour montrer le framework directement.",
        es: "`pages/` ya no es un tutorial enorme. Ahora es una base local corta, facil de entender y util para mostrar el framework de forma directa.",
        de: "`pages/` ist kein riesiges Tutorial mehr. Es bleibt eine kurze lokale Shell, leicht zu verstehen und nuetzlich, um das Framework direkt zu zeigen.",
        pt: "`pages/` nao e mais um tutorial enorme. Agora fica como uma base local curta, facil de entender e util para mostrar o framework de forma direta.",
      },
      whereTitle: {
        it: "Dove sta il framework",
        en: "Where the framework lives",
        fr: "Ou vit le framework",
        es: "Donde vive el framework",
        de: "Wo das Framework liegt",
        pt: "Onde o framework fica",
      },
      whereCopy: {
        it: "Le sorgenti vere restano in <code>packages/core/src</code> e <code>packages/ui/src</code>. Questa area serve solo per demo e smoke visuale.",
        en: "The real sources stay in <code>packages/core/src</code> and <code>packages/ui/src</code>. This area is only for demo and visual smoke testing.",
        fr: "Les vraies sources restent dans <code>packages/core/src</code> et <code>packages/ui/src</code>. Cette zone sert uniquement a la demo et au smoke visuel.",
        es: "Las fuentes reales siguen en <code>packages/core/src</code> y <code>packages/ui/src</code>. Esta zona solo sirve para demo y smoke visual.",
        de: "Die echten Quellen bleiben in <code>packages/core/src</code> und <code>packages/ui/src</code>. Dieser Bereich dient nur fuer Demo und visuellen Smoke-Test.",
        pt: "As fontes reais ficam em <code>packages/core/src</code> e <code>packages/ui/src</code>. Esta area serve apenas para demo e smoke visual.",
      },
    },
    ui: {
      metaTitle: {
        it: "JSswift UI",
        en: "JSswift UI",
        fr: "JSswift UI",
        es: "JSswift UI",
        de: "JSswift UI",
        pt: "JSswift UI",
      },
      eyebrow: {
        it: "UI Layer",
        en: "UI Layer",
        fr: "Couche UI",
        es: "Capa UI",
        de: "UI Layer",
        pt: "Camada UI",
      },
      heroTitle: {
        it: "JSswift UI ti da componenti veri, non solo markup stilizzato.",
        en: "JSswift UI gives you real components, not just styled markup.",
        fr: "JSswift UI vous donne de vrais composants, pas seulement du markup stylise.",
        es: "JSswift UI te da componentes reales, no solo markup estilizado.",
        de: "JSswift UI gibt dir echte Komponenten, nicht nur gestyltes Markup.",
        pt: "JSswift UI entrega componentes reais, nao apenas markup estilizado.",
      },
      heroCopy: {
        it: "La parte UI e potente perche lavora sopra il core reattivo, ma resta leggibile: stessi pattern, stesso modo di comporre, meno boilerplate.",
        en: "The UI layer is powerful because it runs on top of the reactive core while staying readable: same patterns, same composition style, less boilerplate.",
        fr: "La couche UI est puissante car elle repose sur le core reactif tout en restant lisible : memes patterns, meme composition, moins de boilerplate.",
        es: "La capa UI es potente porque trabaja sobre el core reactivo y sigue siendo legible: mismos patrones, misma composicion, menos boilerplate.",
        de: "Die UI-Schicht ist stark, weil sie auf dem reaktiven Core aufbaut und lesbar bleibt: gleiche Muster, gleiche Komposition, weniger Boilerplate.",
        pt: "A camada UI e forte porque trabalha sobre o core reativo e continua legivel: mesmos padroes, mesma composicao, menos boilerplate.",
      },
      strongTitle: {
        it: "Perche e forte",
        en: "Why it is strong",
        fr: "Pourquoi c'est fort",
        es: "Por que es fuerte",
        de: "Warum es stark ist",
        pt: "Por que e forte",
      },
      strong1: {
        it: "Stessa ergonomia per layout, form e feedback",
        en: "Same ergonomics for layout, forms and feedback",
        fr: "Meme ergonomie pour layout, formulaires et feedback",
        es: "La misma ergonomia para layout, formularios y feedback",
        de: "Gleiche Ergonomie fuer Layout, Formulare und Feedback",
        pt: "A mesma ergonomia para layout, formularios e feedback",
      },
      strong2: {
        it: "Binding semplice con `rod` o signal",
        en: "Simple binding with `rod` or signals",
        fr: "Binding simple avec `rod` ou signaux",
        es: "Binding simple con `rod` o signals",
        de: "Einfaches Binding mit `rod` oder Signals",
        pt: "Binding simples com `rod` ou signals",
      },
      strong3: {
        it: "Composizione naturale tra componenti e HTML helper",
        en: "Natural composition between components and HTML helpers",
        fr: "Composition naturelle entre composants et helpers HTML",
        es: "Composicion natural entre componentes y helpers HTML",
        de: "Natuerliche Komposition zwischen Komponenten und HTML-Helpern",
        pt: "Composicao natural entre componentes e helpers HTML",
      },
      pageTitle: {
        it: "Cosa mostra questa pagina",
        en: "What this page shows",
        fr: "Ce que montre cette page",
        es: "Que muestra esta pagina",
        de: "Was diese Seite zeigt",
        pt: "O que esta pagina mostra",
      },
      page1: {
        it: "Input e Select collegati a stato reale",
        en: "Input and Select connected to real state",
        fr: "Input et Select relies a un etat reel",
        es: "Input y Select conectados a estado real",
        de: "Input und Select an echten State gebunden",
        pt: "Input e Select ligados a estado real",
      },
      page2: {
        it: "Button, Badge, Chip e Card nello stesso flusso",
        en: "Button, Badge, Chip and Card in the same flow",
        fr: "Button, Badge, Chip et Card dans le meme flux",
        es: "Button, Badge, Chip y Card en el mismo flujo",
        de: "Button, Badge, Chip und Card im selben Fluss",
        pt: "Button, Badge, Chip e Card no mesmo fluxo",
      },
      page3: {
        it: "Un esempio piccolo ma abbastanza reale da leggere",
        en: "A small example that is still real enough to read",
        fr: "Un petit exemple mais assez reel pour etre utile",
        es: "Un ejemplo pequeno pero suficientemente real para leer",
        de: "Ein kleines, aber reales Beispiel",
        pt: "Um exemplo pequeno, mas real o suficiente para ler",
      },
      approachTitle: {
        it: "Approccio",
        en: "Approach",
        fr: "Approche",
        es: "Enfoque",
        de: "Ansatz",
        pt: "Abordagem",
      },
      approachCopy: {
        it: "UI non prova a nascondere il framework: prova a renderlo piu veloce da usare.",
        en: "UI does not try to hide the framework: it tries to make it faster to use.",
        fr: "UI ne cherche pas a cacher le framework : elle cherche a le rendre plus rapide a utiliser.",
        es: "UI no intenta esconder el framework: intenta hacerlo mas rapido de usar.",
        de: "UI versucht nicht, das Framework zu verstecken: sie macht es schneller nutzbar.",
        pt: "UI nao tenta esconder o framework: tenta torna-lo mais rapido de usar.",
      },
      exampleTitle: {
        it: "Esempio",
        en: "Example",
        fr: "Exemple",
        es: "Ejemplo",
        de: "Beispiel",
        pt: "Exemplo",
      },
      playgroundTitle: {
        it: "Live playground",
        en: "Live playground",
        fr: "Playground live",
        es: "Playground en vivo",
        de: "Live Playground",
        pt: "Playground ao vivo",
      },
    },
    core: {
      metaTitle: {
        it: "JSswift Core",
        en: "JSswift Core",
        fr: "JSswift Core",
        es: "JSswift Core",
        de: "JSswift Core",
        pt: "JSswift Core",
      },
      eyebrow: {
        it: "Core",
        en: "Core",
        fr: "Core",
        es: "Core",
        de: "Core",
        pt: "Core",
      },
      heroTitle: {
        it: "JSswift e forte quando vuoi scrivere poco, ma restare vicino al DOM.",
        en: "JSswift is strong when you want to write less while staying close to the DOM.",
        fr: "JSswift est fort quand vous voulez ecrire moins tout en restant proche du DOM.",
        es: "JSswift es fuerte cuando quieres escribir menos y seguir cerca del DOM.",
        de: "JSswift ist stark, wenn du weniger schreiben und nah am DOM bleiben willst.",
        pt: "JSswift e forte quando voce quer escrever menos e continuar perto do DOM.",
      },
      heroCopy: {
        it: "Renderer dichiarativo, reactive core e component model stanno nella stessa linea: pochi concetti, composizione diretta, meno astrazione inutile.",
        en: "Declarative renderer, reactive core and component model stay on the same line: few concepts, direct composition, less unnecessary abstraction.",
        fr: "Renderer declaratif, core reactif et component model restent sur la meme ligne : peu de concepts, composition directe, moins d'abstraction inutile.",
        es: "Renderer declarativo, core reactivo y component model siguen la misma linea: pocos conceptos, composicion directa y menos abstraccion inutil.",
        de: "Deklarativer Renderer, reaktiver Core und Komponentenmodell bleiben auf einer Linie: wenige Konzepte, direkte Komposition, weniger unnoetige Abstraktion.",
        pt: "Renderer declarativo, core reativo e component model ficam na mesma linha: poucos conceitos, composicao direta e menos abstracao inutil.",
      },
      strengthsTitle: {
        it: "Punti forti",
        en: "Strengths",
        fr: "Points forts",
        es: "Puntos fuertes",
        de: "Staerken",
        pt: "Pontos fortes",
      },
      strengths1: {
        it: "Helper HTML leggibili",
        en: "Readable HTML helpers",
        fr: "Helpers HTML lisibles",
        es: "Helpers HTML legibles",
        de: "Lesbare HTML-Helper",
        pt: "Helpers HTML legiveis",
      },
      strengths2: {
        it: "`signal`, `computed`, `effect`, `batch`",
        en: "`signal`, `computed`, `effect`, `batch`",
        fr: "`signal`, `computed`, `effect`, `batch`",
        es: "`signal`, `computed`, `effect`, `batch`",
        de: "`signal`, `computed`, `effect`, `batch`",
        pt: "`signal`, `computed`, `effect`, `batch`",
      },
      strengths3: {
        it: "Mount e component model senza overhead grosso",
        en: "Mount and component model without heavy overhead",
        fr: "Mount et component model sans gros overhead",
        es: "Mount y component model sin overhead pesado",
        de: "Mount und Komponentenmodell ohne grossen Overhead",
        pt: "Mount e component model sem overhead pesado",
      },
      whereTitle: {
        it: "Dove aiuta davvero",
        en: "Where it really helps",
        fr: "Ou il aide vraiment",
        es: "Donde ayuda de verdad",
        de: "Wo es wirklich hilft",
        pt: "Onde ajuda de verdade",
      },
      where1: {
        it: "Pagine backoffice",
        en: "Backoffice pages",
        fr: "Pages backoffice",
        es: "Paginas de backoffice",
        de: "Backoffice-Seiten",
        pt: "Paginas de backoffice",
      },
      where2: {
        it: "Dashboard reattive",
        en: "Reactive dashboards",
        fr: "Dashboards reactifs",
        es: "Dashboards reactivos",
        de: "Reaktive Dashboards",
        pt: "Dashboards reativos",
      },
      where3: {
        it: "UI custom dove vuoi controllo pieno",
        en: "Custom UI where you want full control",
        fr: "UI custom quand vous voulez un controle total",
        es: "UI custom cuando quieres control total",
        de: "Custom UI, wenn du volle Kontrolle willst",
        pt: "UI custom quando voce quer controle total",
      },
      exampleTitle: {
        it: "Esempio",
        en: "Example",
        fr: "Exemple",
        es: "Ejemplo",
        de: "Beispiel",
        pt: "Exemplo",
      },
      playgroundTitle: {
        it: "Live playground",
        en: "Live playground",
        fr: "Playground live",
        es: "Playground en vivo",
        de: "Live Playground",
        pt: "Playground ao vivo",
      },
      notUiTitle: {
        it: "Perche non e solo una libreria UI",
        en: "Why it is not just a UI library",
        fr: "Pourquoi ce n'est pas seulement une librairie UI",
        es: "Por que no es solo una libreria UI",
        de: "Warum es nicht nur eine UI-Bibliothek ist",
        pt: "Por que nao e apenas uma biblioteca UI",
      },
      notUiCopy: {
        it: "Anche senza il layer UI puoi costruire una pagina intera con helper HTML, stato reattivo e lifecycle coerente.",
        en: "Even without the UI layer you can build a full page with HTML helpers, reactive state and a coherent lifecycle.",
        fr: "Meme sans la couche UI, vous pouvez construire une page complete avec des helpers HTML, un etat reactif et un lifecycle coherent.",
        es: "Incluso sin la capa UI puedes construir una pagina completa con helpers HTML, estado reactivo y un lifecycle coherente.",
        de: "Auch ohne UI-Schicht kannst du eine komplette Seite mit HTML-Helpern, reaktivem State und konsistentem Lifecycle bauen.",
        pt: "Mesmo sem a camada UI voce pode construir uma pagina completa com helpers HTML, estado reativo e lifecycle coerente.",
      },
    },
    developers: {
      metaTitle: {
        it: "JSswift For Developers",
        en: "JSswift For Developers",
        fr: "JSswift Pour Developpeurs",
        es: "JSswift Para Developers",
        de: "JSswift Fuer Entwickler",
        pt: "JSswift Para Developers",
      },
      eyebrow: {
        it: "Developer View",
        en: "Developer View",
        fr: "Vue Developpeur",
        es: "Vista Developer",
        de: "Developer View",
        pt: "Visao Developer",
      },
      heroTitle: {
        it: "Questa e la pagina che un developer deve leggere per capire se JSswift entra nel suo progetto.",
        en: "This is the page a developer should read to understand whether JSswift fits the project.",
        fr: "Voici la page qu'un developpeur doit lire pour comprendre si JSswift entre dans son projet.",
        es: "Esta es la pagina que un developer debe leer para entender si JSswift encaja en su proyecto.",
        de: "Dies ist die Seite, die ein Entwickler lesen sollte, um zu verstehen, ob JSswift ins Projekt passt.",
        pt: "Esta e a pagina que um developer deve ler para entender se JSswift entra no projeto.",
      },
      heroCopy: {
        it: "JSswift punta su un vantaggio concreto: meno astrazione inutile, piu controllo su DOM, stato reattivo e componenti, con una struttura abbastanza chiara da essere adottata senza riscrivere tutto il progetto.",
        en: "JSswift focuses on a concrete advantage: less unnecessary abstraction, more control over DOM, reactive state and components, with a structure clear enough to adopt without rewriting the whole project.",
        fr: "JSswift mise sur un avantage concret : moins d'abstraction inutile, plus de controle sur le DOM, l'etat reactif et les composants, avec une structure assez claire pour etre adoptee sans tout reecrire.",
        es: "JSswift se centra en una ventaja concreta: menos abstraccion inutil, mas control sobre DOM, estado reactivo y componentes, con una estructura suficientemente clara para adoptarse sin reescribir todo el proyecto.",
        de: "JSswift setzt auf einen konkreten Vorteil: weniger unnoetige Abstraktion, mehr Kontrolle ueber DOM, reaktiven State und Komponenten, mit einer Struktur, die sich ohne Komplett-Neuschreibung einfuehren laesst.",
        pt: "JSswift aposta em uma vantagem concreta: menos abstracao inutil, mais controle sobre DOM, estado reativo e componentes, com uma estrutura clara o suficiente para adocao sem reescrever todo o projeto.",
      },
      understandTitle: {
        it: "Cosa deve capire subito",
        en: "What should be clear immediately",
        fr: "Ce qu'il faut comprendre tout de suite",
        es: "Lo que debe quedar claro enseguida",
        de: "Was sofort klar werden muss",
        pt: "O que deve ficar claro logo de inicio",
      },
      understand1: {
        it: "Core piccolo e comprensibile",
        en: "A small and understandable core",
        fr: "Un core petit et comprehensible",
        es: "Un core pequeno y comprensible",
        de: "Ein kleiner, verstaendlicher Core",
        pt: "Um core pequeno e compreensivel",
      },
      understand2: {
        it: "UI layer sopra il core, non separato mentalmente",
        en: "A UI layer on top of the core, not mentally disconnected from it",
        fr: "Une couche UI au-dessus du core, sans separation mentale",
        es: "Una capa UI sobre el core, no separada mentalmente",
        de: "Eine UI-Schicht ueber dem Core, nicht mental davon getrennt",
        pt: "Uma camada UI sobre o core, sem separacao mental",
      },
      understand3: {
        it: "Struttura `packages/*` pronta per npm e CDN",
        en: "A `packages/*` structure ready for npm and CDN",
        fr: "Une structure `packages/*` prete pour npm et CDN",
        es: "Una estructura `packages/*` preparada para npm y CDN",
        de: "Eine `packages/*`-Struktur fuer npm und CDN",
        pt: "Uma estrutura `packages/*` pronta para npm e CDN",
      },
      understand4: {
        it: "Adozione possibile anche in modo graduale",
        en: "Adoption is possible in a gradual way",
        fr: "Une adoption progressive est possible",
        es: "La adopcion gradual tambien es posible",
        de: "Auch eine schrittweise Einfuehrung ist moeglich",
        pt: "A adocao gradual tambem e possivel",
      },
      fitTitle: {
        it: "Quando ha senso usarlo",
        en: "When it makes sense to use it",
        fr: "Quand il a du sens de l'utiliser",
        es: "Cuando tiene sentido usarlo",
        de: "Wann es sinnvoll ist",
        pt: "Quando faz sentido usa-lo",
      },
      fit1: {
        it: "Admin panel e applicazioni interne",
        en: "Admin panels and internal applications",
        fr: "Admin panels et applications internes",
        es: "Admin panels y aplicaciones internas",
        de: "Admin-Panels und interne Anwendungen",
        pt: "Admin panels e aplicacoes internas",
      },
      fit2: {
        it: "Progetti dove vuoi meno dipendenze",
        en: "Projects where you want fewer dependencies",
        fr: "Projets ou vous voulez moins de dependances",
        es: "Proyectos donde quieres menos dependencias",
        de: "Projekte mit moeglichst wenigen Abhaengigkeiten",
        pt: "Projetos onde voce quer menos dependencias",
      },
      fit3: {
        it: "Tooling operativo con UI custom e reattiva",
        en: "Operational tooling with custom reactive UI",
        fr: "Tooling operationnel avec UI custom et reactive",
        es: "Tooling operativo con UI custom y reactiva",
        de: "Operatives Tooling mit reaktiver Custom-UI",
        pt: "Tooling operacional com UI custom e reativa",
      },
      fit4: {
        it: "Prodotti dove il team vuole capire davvero il runtime",
        en: "Products where the team wants to really understand the runtime",
        fr: "Produits ou l'equipe veut vraiment comprendre le runtime",
        es: "Productos donde el equipo quiere entender de verdad el runtime",
        de: "Produkte, in denen das Team die Runtime wirklich verstehen will",
        pt: "Produtos onde a equipe quer realmente entender o runtime",
      },
      npmTitle: {
        it: "Packaging chiaro",
        en: "Clear packaging",
        fr: "Packaging clair",
        es: "Packaging claro",
        de: "Klares Packaging",
        pt: "Packaging claro",
      },
      npmCopy: {
        it: "`@jsswift/core`, `@jsswift/ui` e `jsswift` sono una linea pulita per il publish.",
        en: "`@jsswift/core`, `@jsswift/ui` and `jsswift` provide a clean publishing line.",
        fr: "`@jsswift/core`, `@jsswift/ui` et `jsswift` offrent une ligne de publication claire.",
        es: "`@jsswift/core`, `@jsswift/ui` y `jsswift` ofrecen una linea limpia para publicar.",
        de: "`@jsswift/core`, `@jsswift/ui` und `jsswift` bilden eine klare Publishing-Linie.",
        pt: "`@jsswift/core`, `@jsswift/ui` e `jsswift` formam uma linha limpa para publicacao.",
      },
      cdnTitle: {
        it: "Bundle leggibili",
        en: "Readable bundles",
        fr: "Bundles lisibles",
        es: "Bundles legibles",
        de: "Lesbare Bundles",
        pt: "Bundles legiveis",
      },
      cdnCopy: {
        it: "JS e CSS hanno output chiari, quindi e facile avere una story semplice anche lato CDN.",
        en: "JS and CSS have clear outputs, so it is easy to keep the CDN story simple too.",
        fr: "JS et CSS ont des sorties claires, donc il est facile de garder une histoire simple cote CDN.",
        es: "JS y CSS tienen salidas claras, asi que tambien es facil mantener simple la historia del CDN.",
        de: "JS und CSS haben klare Outputs, deshalb bleibt auch die CDN-Story einfach.",
        pt: "JS e CSS tem saidas claras, entao tambem e facil manter simples os bundles para CDN.",
      },
      adoptionTitle: {
        it: "Adozione progressiva",
        en: "Progressive adoption",
        fr: "Adoption progressive",
        es: "Adopcion progresiva",
        de: "Schrittweise Einfuehrung",
        pt: "Adocao progressiva",
      },
      adoptionCopy: {
        it: "Puoi usare solo il core, solo UI sopra il core, oppure il bundle umbrella completo.",
        en: "You can use only the core, only UI on top of the core, or the complete umbrella bundle.",
        fr: "Vous pouvez utiliser seulement le core, seulement l'UI au-dessus du core, ou le bundle complet.",
        es: "Puedes usar solo el core, solo UI sobre el core o el bundle umbrella completo.",
        de: "Du kannst nur den Core, nur die UI auf dem Core oder das komplette Umbrella-Bundle nutzen.",
        pt: "Voce pode usar apenas o core, apenas a UI sobre o core, ou o bundle umbrella completo.",
      },
      finalTitle: {
        it: "Cosa deve restare chiaro",
        en: "What must remain clear",
        fr: "Ce qui doit rester clair",
        es: "Lo que debe quedar claro",
        de: "Was klar bleiben muss",
        pt: "O que deve continuar claro",
      },
      finalCopy1: {
        it: "JSswift da a un developer una base concreta: core reattivo, helper HTML, component model e layer UI nello stesso ecosistema, senza imporre una struttura pesante o una catena lunga di dipendenze.",
        en: "JSswift gives a developer a concrete base: reactive core, HTML helpers, component model and UI layer in the same ecosystem, without imposing a heavy structure or a long dependency chain.",
        fr: "JSswift donne au developpeur une base concrete : core reactif, helpers HTML, component model et couche UI dans le meme ecosysteme, sans imposer une structure lourde ni une longue chaine de dependances.",
        es: "JSswift da al developer una base concreta: core reactivo, helpers HTML, component model y capa UI en el mismo ecosistema, sin imponer una estructura pesada ni una larga cadena de dependencias.",
        de: "JSswift gibt Entwicklern eine konkrete Basis: reaktiver Core, HTML-Helper, Komponentenmodell und UI-Layer im selben Oekosystem, ohne schwere Struktur oder lange Abhaengigkeitskette.",
        pt: "JSswift entrega ao developer uma base concreta: core reativo, helpers HTML, component model e camada UI no mesmo ecossistema, sem impor uma estrutura pesada nem uma longa cadeia de dependencias.",
      },
      finalCopy2: {
        it: "Il punto centrale e semplice: puo entrare in un progetto in modo graduale, puo coprire sia casi minimali sia interfacce piu ricche, e mantiene una linea chiara tra runtime, UI e distribuzione via npm o CDN.",
        en: "The central point is simple: it can enter a project gradually, cover both minimal cases and richer interfaces, and keep a clear line between runtime, UI and distribution through npm or CDN.",
        fr: "Le point central est simple : il peut entrer dans un projet de facon progressive, couvrir aussi bien les cas minimaux que les interfaces plus riches, et garder une ligne claire entre runtime, UI et distribution via npm ou CDN.",
        es: "El punto central es simple: puede entrar gradualmente en un proyecto, cubrir tanto casos minimos como interfaces mas ricas y mantener una linea clara entre runtime, UI y distribucion por npm o CDN.",
        de: "Der zentrale Punkt ist einfach: Es kann schrittweise in ein Projekt eingefuehrt werden, sowohl minimale Faelle als auch reichere Oberflaechen abdecken und eine klare Linie zwischen Runtime, UI und Distribution ueber npm oder CDN halten.",
        pt: "O ponto central e simples: ele pode entrar em um projeto de forma gradual, cobrir tanto casos minimos quanto interfaces mais ricas e manter uma linha clara entre runtime, UI e distribuicao por npm ou CDN.",
      },
    },
    playground: {
      ui: {
        nameLabel: {
          it: "Nome",
          en: "Name",
          fr: "Nom",
          es: "Nombre",
          de: "Name",
          pt: "Nome",
        },
        roleLabel: {
          it: "Ruolo",
          en: "Role",
          fr: "Role",
          es: "Rol",
          de: "Rolle",
          pt: "Papel",
        },
        updatesLabel: {
          it: "Ricevi aggiornamenti prodotto",
          en: "Receive product updates",
          fr: "Recevoir les mises a jour produit",
          es: "Recibir actualizaciones del producto",
          de: "Produkt-Updates erhalten",
          pt: "Receber atualizacoes do produto",
        },
        actionButton: {
          it: "Test azione",
          en: "Test action",
          fr: "Tester l'action",
          es: "Probar accion",
          de: "Aktion testen",
          pt: "Testar acao",
        },
        actionToast: {
          it: "Evento UI collegato correttamente",
          en: "UI event wired correctly",
          fr: "Evenement UI connecte correctement",
          es: "Evento UI conectado correctamente",
          de: "UI-Ereignis korrekt verbunden",
          pt: "Evento UI conectado corretamente",
        },
        roleChip: {
          it: "ruolo: {value}",
          en: "role: {value}",
          fr: "role : {value}",
          es: "rol: {value}",
          de: "rolle: {value}",
          pt: "papel: {value}",
        },
        updatesOn: {
          it: "aggiornamenti attivi",
          en: "updates on",
          fr: "mises a jour actives",
          es: "actualizaciones activas",
          de: "updates aktiv",
          pt: "atualizacoes ativas",
        },
        updatesOff: {
          it: "aggiornamenti spenti",
          en: "updates off",
          fr: "mises a jour coupees",
          es: "actualizaciones desactivadas",
          de: "updates aus",
          pt: "atualizacoes desativadas",
        },
        liveState: {
          it: "Stato live",
          en: "Live state",
          fr: "Etat live",
          es: "Estado en vivo",
          de: "Live-Status",
          pt: "Estado ao vivo",
        },
        liveName: {
          it: "Nome: {value}",
          en: "Name: {value}",
          fr: "Nom : {value}",
          es: "Nombre: {value}",
          de: "Name: {value}",
          pt: "Nome: {value}",
        },
        liveRole: {
          it: "Ruolo: {value}",
          en: "Role: {value}",
          fr: "Role : {value}",
          es: "Rol: {value}",
          de: "Rolle: {value}",
          pt: "Papel: {value}",
        },
        liveUpdatesOn: {
          it: "Aggiornamenti: attivi",
          en: "Updates: enabled",
          fr: "Mises a jour : actives",
          es: "Actualizaciones: activas",
          de: "Updates: aktiv",
          pt: "Atualizacoes: ativas",
        },
        liveUpdatesOff: {
          it: "Aggiornamenti: disattivi",
          en: "Updates: disabled",
          fr: "Mises a jour : desactivees",
          es: "Actualizaciones: desactivadas",
          de: "Updates: deaktiviert",
          pt: "Atualizacoes: desativadas",
        },
      },
      core: {
        cardTitle: {
          it: "Reactive core",
          en: "Reactive core",
          fr: "Core reactif",
          es: "Core reactivo",
          de: "Reaktiver Core",
          pt: "Core reativo",
        },
        cardCopy: {
          it: "Un esempio minimale con signal, computed e batch.",
          en: "A minimal example with signal, computed and batch.",
          fr: "Un exemple minimal avec signal, computed et batch.",
          es: "Un ejemplo minimo con signal, computed y batch.",
          de: "Ein minimales Beispiel mit signal, computed und batch.",
          pt: "Um exemplo minimo com signal, computed e batch.",
        },
        countButton: {
          it: "count +1",
          en: "count +1",
          fr: "count +1",
          es: "count +1",
          de: "count +1",
          pt: "count +1",
        },
        stepButton: {
          it: "step +1",
          en: "step +1",
          fr: "step +1",
          es: "step +1",
          de: "step +1",
          pt: "step +1",
        },
        batchButton: {
          it: "batch update",
          en: "batch update",
          fr: "batch update",
          es: "batch update",
          de: "batch update",
          pt: "batch update",
        },
        countLine: {
          it: "count: {value}",
          en: "count: {value}",
          fr: "count : {value}",
          es: "count: {value}",
          de: "count: {value}",
          pt: "count: {value}",
        },
        stepLine: {
          it: "step: {value}",
          en: "step: {value}",
          fr: "step : {value}",
          es: "step: {value}",
          de: "step: {value}",
          pt: "step: {value}",
        },
        totalLine: {
          it: "totale computed: {value}",
          en: "computed total: {value}",
          fr: "total computed : {value}",
          es: "total computed: {value}",
          de: "computed total: {value}",
          pt: "total computed: {value}",
        },
        lifecycleTitle: {
          it: "Component lifecycle",
          en: "Component lifecycle",
          fr: "Lifecycle composant",
          es: "Lifecycle de componente",
          de: "Component Lifecycle",
          pt: "Lifecycle de componente",
        },
        lifecycleCopy: {
          it: "Questo box usa `_.component` e cleanup automatico.",
          en: "This box uses `_.component` and automatic cleanup.",
          fr: "Cette box utilise `_.component` et le cleanup automatique.",
          es: "Esta caja usa `_.component` y cleanup automatico.",
          de: "Diese Box nutzt `_.component` und automatisches Cleanup.",
          pt: "Esta caixa usa `_.component` e cleanup automatico.",
        },
        ticksLine: {
          it: "ticks: {value}",
          en: "ticks: {value}",
          fr: "ticks : {value}",
          es: "ticks: {value}",
          de: "ticks: {value}",
          pt: "ticks: {value}",
        },
      },
    },
  };

  function getByPath(source, path) {
    return path.split(".").reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), source);
  }

  function detectLanguage() {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(saved)) return saved;

    const browser = (navigator.language || DEFAULT_LANGUAGE).slice(0, 2).toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(browser)) return browser;

    return DEFAULT_LANGUAGE;
  }

  function getLanguage() {
    return detectLanguage();
  }

  function setLanguage(language) {
    const next = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
    window.localStorage.setItem(STORAGE_KEY, next);
    return next;
  }

  function translate(path, replacements = {}, language = getLanguage()) {
    const entry = getByPath(DICTIONARY, path);
    if (!entry || typeof entry !== "object") return path;

    const base =
      entry[language] ??
      entry[DEFAULT_LANGUAGE] ??
      entry.en ??
      Object.values(entry)[0];

    if (typeof base !== "string") return path;

    return Object.keys(replacements).reduce(
      (output, key) => output.replaceAll(`{${key}}`, String(replacements[key])),
      base,
    );
  }

  function renderLanguageSwitcher(language) {
    const label = translate("common.languageLabel", {}, language);
    return `
      <label class="language-switcher">
        <span>${label}</span>
        <select data-language-select>
          ${SUPPORTED_LANGUAGES.map((code) => `
            <option value="${code}" ${code === language ? "selected" : ""}>${LANGUAGE_LABELS[code]}</option>
          `).join("")}
        </select>
      </label>
    `;
  }

  function applyTranslations() {
    const language = getLanguage();
    const body = document.body;
    if (!body) return;

    document.documentElement.lang = language;

    const titleKey = body.dataset.i18nTitle;
    if (titleKey) document.title = translate(titleKey, {}, language);

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.dataset.i18n;
      node.textContent = translate(key, {}, language);
    });

    document.querySelectorAll("[data-i18n-html]").forEach((node) => {
      const key = node.dataset.i18nHtml;
      node.innerHTML = translate(key, {}, language);
    });

    document.querySelectorAll("[data-language-switcher]").forEach((node) => {
      node.innerHTML = renderLanguageSwitcher(language);
    });

    document.querySelectorAll("[data-language-select]").forEach((select) => {
      select.addEventListener("change", (event) => {
        setLanguage(event.target.value);
        window.location.reload();
      });
    });
  }

  window.JSswiftDemoI18n = {
    getLanguage,
    setLanguage,
    translate,
    t: translate,
    supportedLanguages: SUPPORTED_LANGUAGES.slice(),
    applyTranslations,
  };

  document.addEventListener("DOMContentLoaded", applyTranslations);
})();
