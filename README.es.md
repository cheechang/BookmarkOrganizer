# Bookmark Organizer

Inteligente, local y con privacidad como prioridad — organiza automaticamente tus marcadores del navegador.

Una extension de navegador que escanea, categoriza, elimina duplicados y hace copias de seguridad de tus marcadores. Todo el procesamiento ocurre completamente en tu dispositivo; no se sube nada a ningun servidor.

[English](README.md) · [中文](README.zh-CN.md) · **Español** · [日本語](README.ja.md) · [Deutsch](README.de.md)

README actualizado: 2026-04-23 · Version actual: `1.9.6` · Notas de lanzamiento: [CHANGELOG.md](CHANGELOG.md)

---

## Posicionamiento del Proyecto

Bookmark Organizer es una extension de navegador construida con JavaScript nativo y Manifest V3. Su objetivo no es reemplazar tu gestor de marcadores, sino hacer que el que ya tienes vuelva a ser realmente util.

- **Organizacion primero**: Sugiere categorias automaticamente basadas en titulo, URL y palabras clave de dominio. Las reglas personalizadas se pueden agregar mediante la UI o JSON.
- **Limpieza primero**: Detecta duplicados exactos, duplicados normalizados (misma ruta, diferentes parametros) y duplicados similares (mismo dominio, titulos similares).
- **Seguridad primero**: Cada escaneo crea una copia de seguridad automatica. Conserva las ultimas 10 copias localmente, con restauracion de un clic y exportacion/importacion manual JSON/HTML.
- **Privacidad primero**: Todos los datos permanecen en el almacenamiento del navegador. Sin solicitudes de red, sin telemetria, sin cuentas.
- **Personalizacion primero**: 8 skins integradas + generador de skin personalizado (sube cualquier imagen). Soporte completo de modo oscuro e i18n en 5 idiomas.

> **Important**
>
> La configuracion predeterminada de la extension esta disenada para uso general. Despues de la instalacion, visita **Configuracion** para ajustar el umbral de similitud, el comportamiento de copia de seguridad automatica, el skin del tema y las reglas de categoria personalizadas.

---

## Capturas de Pantalla

**Pagina de Analisis de Escaneo**  
![Analisis de Escaneo](docs/screenshots/scan.png)

**Pagina de Sugerencias de Categorias**  
![Sugerencias de Categorias](docs/screenshots/categories.png)

**Deteccion de Duplicados — Filtrado por Pestañas**  
![Deteccion de Duplicados](docs/screenshots/duplicates.png)

**Gestion de Copias de Seguridad**  
![Gestion de Copias de Seguridad](docs/screenshots/backups.png)

---

## Descarga e Instalacion

| Elemento | Detalles |
| --- | --- |
| Ultima version | [GitHub Releases](https://github.com/cheechang/BookmarkOrganizer/releases) |
| Edge Add-ons | [Bookmark Organizer](https://www.crxsoso.com/addon/detail/obmalmnejfkdbbphdmlkimjhfefgfcem) |
| Firefox Add-ons | [BookmarkTidy](https://addons.crxsoso.com/zh-CN/firefox/addon/bookmarktidy/) |
| Navegadores | Chrome / Edge / Firefox / Basados en Chromium |
| Permisos | Bookmarks, Storage, Downloads |

### Metodo 1: Tienda de Extensiones del Navegador

Instala directamente desde los enlaces de la tienda arriba. La extension se actualizara automaticamente.

### Metodo 2: Modo Desarrollador (para pruebas o uso personal)

1. Clona el repositorio:
   ```bash
   git clone https://github.com/cheechang/BookmarkOrganizer.git
   cd BookmarkOrganizer
   ```

2. Asegurate de que el directorio `icons/` contenga archivos PNG en los siguientes tamanos exactos:
   - `icon16.png` — 16x16
   - `icon48.png` — 48x48
   - `icon128.png` — 128x128

   Si solo tienes un SVG, usa cualquier convertidor en linea para generar los PNG.

3. Abre la pagina de administracion de extensiones de tu navegador (p. ej., `edge://extensions/` en Edge) y habilita **Modo de desarrollador** en la esquina superior derecha.

4. Haz clic en **Cargar descomprimida** y selecciona el directorio raiz del proyecto.

5. El icono de la extension aparecera en la barra de herramientas. Haz clic en el para comenzar a usarla.

---

## Capacidades Principales

| Modulo | Capacidad |
| --- | --- |
| Categorizacion Inteligente | Escanea marcadores y sugiere carpetas basadas en palabras clave de titulo/URL/dominio. Puntuacion de confianza (Alta / Media / Baja). Soporte para reglas personalizadas mediante UI o `rules/categories.json`. |
| Deteccion de Duplicados | Tres tipos: exactos (URL identica), normalizados (misma ruta, diferentes parametros) y similares (mismo dominio, titulos comparables). Algoritmo de similitud ponderada (titulo 60%, URL 40%). |
| Seleccion Inteligente | Los grupos de duplicados se preseleccionan inteligentemente: preserva las copias en la barra de marcadores, el resto se marca automaticamente para limpieza con un clic. |
| Copias de Seguridad y Reversion | Copia de seguridad automatica antes del escaneo. Conserva las ultimas 10 copias con limpieza automatica. Restauracion de un clic. Soporte para exportar JSON o Netscape HTML estandar. |
| Comprobacion de Enlaces Rotos | Detecta marcadores inaccesibles mediante HTTP HEAD/GET con tiempo de espera. Identifica 404, 5xx, tiempos de espera y fallos de red. Eliminacion por lotes con integracion de copias de seguridad. |
| Importacion/Exportacion Multinavegador | Importa HTML Netscape Bookmark estandar de Chrome, Firefox, Edge, Safari. Exporta como HTML o JSON. Modo Fusionar o Reemplazar. |
| Sistema de Skins | 8 skins integradas (Predeterminado, Nativo del Navegador, Negocio Minimalista, Nostalgia Clasica, Monocromo de Alto Contraste, Cristal Esmerilado, Naturaleza Baja Saturacion, mas 4 temas de degradado). Generador de skin personalizado desde cualquier imagen subida. |
| i18n Completo | Traduccion completa de la UI en 5 idiomas: Ingles, Chino Simplificado, Espanol, Japones, Aleman. Cambio en tiempo real con renderizado instantaneo. |
| Modo Oscuro | Cambia entre temas claro y oscuro con un clic. La preferencia se persiste en el almacenamiento del navegador. Todos los skins incluyen paletas oscuras dedicadas. |

---

## Diseno de Experiencia

La interfaz de Bookmark Organizer esta construida en torno a la "claridad, eficiencia y comodidad visual".

- **Interfaz Dual**: Pagina independiente completa (`options.html`) con navegacion por barra lateral, mas un popup compacto (`popup.html`) para acceso rapido. Haz clic en el icono de la barra de herramientas para abrir la pagina completa directamente.
- **Navegacion por Barra Lateral Izquierda**: Escanear, Categorias, Duplicados, Enlaces Rotos, Copias de Seguridad, Configuracion — cada uno con iconos SVG personalizados e indicadores de estado activo.
- **Skins Adaptativas**: Cada elemento de la UI — barra lateral, tarjetas, listas, formularios, barras de progreso, etiquetas de filtro — responde dinamicamente al skin seleccionado y al modo claro/oscuro mediante propiedades personalizadas de CSS.
- **Adaptacion Automatica de DPI**: Las consultas de medios de CSS manejan escalado de pantalla del 100%, 125%, 150% y 200%+ para prevenir rupturas de diseno en pantallas de alta DPI.
- **Acciones en Linea**: Seleccion por lotes, eliminacion individual, expandir/contraer, columnas ordenables y botones flotantes de asistencia de desplazamiento mantienen las interacciones al alcance.

---

## Sistema de Skins

| Skin | Descripcion |
| --- | --- |
| Predeterminado | Limpio degradado purpura-azul en la barra lateral con area de contenido clara neutra. |
| Nativo del Navegador | Coincide con el tono de UI nativo del navegador host para integracion perfecta. |
| Negocio Minimalista | Paleta azul-gris profesional y fresca para un entorno de trabajo enfocado. |
| Nostalgia Clasica | Estetica calida retro de papel y tinta con tonos sepia. |
| Monocromo de Alto Contraste | Blanco y negro puro para maxima accesibilidad y legibilidad. |
| Cristal Esmerilado | Aspecto moderno con efecto de desenfoque translucido y fondo dinamico. |
| Naturaleza Baja Saturacion | Tonos verde-beige suaves y amigables con la vista para reducir la fatiga visual. |
| Oceano Profundo | Tema de degradado azul profundo inspirado en el oceano. |
| Resplandor del Atardecer | Tema de degradado calido naranja-rojo inspirado en la puesta de sol. |
| Noche Estrellada | Tema de degradado purpura-azul profundo con atmosfera celestial. |
| Flor de Cerezo | Tema de degradado rosa suave con tonos romanticos de sakura. |
| **Skin Personalizado** | Sube cualquier imagen; la extension extrae los colores dominantes y genera un tema personalizado con cumplimiento automatico de contraste. |

> **Nota**
>
> Los skins personalizados se almacenan localmente en el almacenamiento del navegador. Persisten entre sesiones y estan disponibles tanto en el popup como en la interfaz de pagina completa.

---

## Stack Tecnologico

| Categoria | Eleccion |
| --- | --- |
| Lenguaje | JavaScript nativo (ES2020+) |
| Arquitectura | ES Modules — importaciones modulares sin empaquetador |
| Manifiesto | Manifest V3 (Chromium) / Manifest V3 con `background.scripts` (Firefox) |
| UI | HTML + CSS escritos a mano, sin framework |
| Estilos | Propiedades personalizadas de CSS (`--bo-*`) para el sistema de skins, `color-mix()` para tonos adaptativos |
| Almacenamiento | `chrome.storage.local` para configuraciones, copias de seguridad, logs y reglas personalizadas |
| API de Marcadores | `chrome.bookmarks` para lectura, creacion, movimiento, eliminacion y recorrido de arboles |
| Similitud | Distancia de Levenshtein (distancia de edicion) con promedio ponderado titulo/URL |
| i18n | `_locales/` con marcadores de posicion `__MSG_*__` y motor `_t()` en tiempo de ejecucion |
| Iconos | Iconos SVG de estilo lineal personalizados con `currentColor` para adaptacion tematica |
| CI/CD | GitHub Actions — construccion matricial multiplataforma para Chromium + Firefox |

---

## Estructura del Proyecto

````bash
BookmarkOrganizer/
├── manifest.json              # Configuracion de extension Chromium (MV3)
├── manifest-firefox.json      # Configuracion de extension Firefox (MV3)
├── background.js              # Service Worker: eventos de instalacion, manejador de clics en icono
├── options.html/css/js        # Interfaz independiente de pagina completa
├── popup.html/css/js          # Interfaz de popup compacto
├── i18n.js                    # Motor de traduccion en tiempo de ejecucion
├── theme-system.css           # Sistema de skins: 8+ skins x variables claro/oscuro
│
├── shared.js                  # Funciones puras de utilidad (escapeHtml, etc.)
├── bookmark-scanner.js        # Escaneo de marcadores, analisis, deteccion de enlaces rotos
├── category-manager.js        # Categorizacion inteligente y operaciones de movimiento por lotes
├── duplicate-detector.js      # Deteccion de duplicados: exactos, normalizados, similares
├── backup-manager.js          # Copias de seguridad/restauracion, importacion/exportacion HTML/JSON
├── logger.js                  # Framework de logging de depuracion del lado del cliente
├── utils.js                   # Utilidades compartidas heredadas (compatibilidad hacia atras)
│
├── rules/
│   └── categories.json        # Reglas de palabras clave de categorizacion predeterminadas
├── _locales/                  # Mensajes i18n: en, zh_CN, es, ja, de
├── icons/                     # Iconos de extension (16px, 48px, 128px)
├── docs/
│   ├── screenshots/           # Capturas de pantalla de UI para README
│   ├── DEVELOPMENT_LOG.md     # Historial de desarrollo
│   └── STORE_LISTING.md       # Copia para tienda
├── .github/
│   └── workflows/
│       └── release.yml        # Pipeline de construccion y lanzamiento automatizado
├── CHANGELOG.md               # Historial de versiones
├── PRIVACY_POLICY.md          # Politica de privacidad (requerida para envio a tienda)
└── LICENSE                    # Licencia MIT
````

---

## Construccion

No se requiere paso de construccion. Esta es una extension nativa escrita a mano con dependencias cero en tiempo de ejecucion.

```bash
git clone https://github.com/cheechang/BookmarkOrganizer.git
cd BookmarkOrganizer
```

Carga el directorio raiz del proyecto directamente en el modo desarrollador de tu navegador (ver [Descarga e Instalacion](#descarga-e-instalacion)).

Empaquetado para CI (usado por GitHub Actions):

```bash
# Paquete Chromium
zip -r BookmarkOrganizer-v1.9.6.zip manifest.json *.js *.css *.html rules/ _locales/ icons/ -x "*.map" "node_modules/*"

# Paquete Firefox
# (manifest-firefox.json se renombra a manifest.json antes del empaquetado)
```

---

## Documentacion

| Contenido | Enlace |
| --- | --- |
| Registro de cambios | [CHANGELOG.md](CHANGELOG.md) |
| Politica de privacidad | [PRIVACY_POLICY.md](PRIVACY_POLICY.md) |
| Registro de desarrollo | [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md) |
| Copia para tienda | [docs/STORE_LISTING.md](docs/STORE_LISTING.md) |

---

## Actualizaciones Recientes

Version actual: **1.9.6**. Las notas de lanzamiento completas estan en [CHANGELOG.md](CHANGELOG.md). Puntos destacados de v1.9.6:

- 4 nuevos skins de degradado: Oceano Profundo, Resplandor del Atardecer, Noche Estrellada, Flor de Cerezo.
- Nueva funcion de Skin Personalizado: sube cualquier imagen para generar un tema personalizado con extraccion automatica de colores y cumplimiento de contraste.
- Correccion de adaptacion tematica de la barra lateral en todos los skins y modos; reemplazo de colores codificados por variables CSS.
- Mejora del contraste de color de los skins en modo oscuro para mejor legibilidad.
- Correccion de la expresion regular de extraccion de changelog en el workflow de lanzamiento.

---

## Hoja de Ruta

| Estado | Direccion |
| --- | --- |
| Completado | Categorizacion inteligente, deteccion de duplicados (3 tipos), copias de seguridad/reversion, deteccion de enlaces rotos, importacion/exportacion multinavegador, reglas de categoria personalizadas, i18n completo (5 idiomas), modo oscuro, 8+ skins, generador de skin personalizado, comprobacion de actualizaciones automatica, arquitectura modular ES Module, sistema de logging de depuracion |
| En progreso | Documentacion Wiki, benchmarks de rendimiento para grandes conjuntos de marcadores (5000+), skins adicionales |
| Planificado | Sincronizacion en la nube de copias de seguridad, estadisticas de uso de marcadores, organizacion basada en etiquetas, busqueda dentro de marcadores, atajos de teclado |

---

## Contribuir

Los Issues y Pull Requests son bienvenidos.

1. Haz fork de este repositorio.
2. Crea una rama feature o fix desde `main`.
3. Manten los cambios enfocados e incluye pasos de prueba relevantes en la descripcion de tu PR.
4. Envia el PR con una explicacion clara del proposito del cambio, alcance de impacto y resultados de verificacion.

Se da prioridad a problemas reproducibles, adiciones de funciones claras, retroalimentacion de dispositivos reales y correcciones con registros de verificacion.

---

## Agradecimientos

Bookmark Organizer esta construido sobre APIs estandar de la plataforma web y no incluye bibliotecas de terceros en tiempo de ejecucion. Las siguientes herramientas y recursos se utilizaron durante el desarrollo:

| Proyecto / Recurso | Uso |
| --- | --- |
| Chrome Extensions API | Bookmarks, Storage, Downloads, Action, i18n |
| Distancia de Levenshtein | Puntuacion de similitud para deteccion de duplicados |
| Propiedades personalizadas de CSS | Sistema de skins tematicos con cascada de variables dinamicas |
| GitHub Actions | Pipeline de construccion y lanzamiento multiplataforma automatizado |
| sharp (Node.js) | Generacion por lotes de iconos durante el desarrollo |

---

## Descargo de Responsabilidad

> **Caution**
>
> 1. Esta extension modifica tus marcadores del navegador. Aunque se crean copias de seguridad automaticas antes de cada escaneo, se recomienda encarecidamente exportar una copia de seguridad manual antes del primer uso.
> 2. Todo el procesamiento de datos ocurre localmente en tu navegador. No se suben datos de marcadores a ningun servidor.
> 3. El comprobador de enlaces rotos envia solicitudes HTTP a las URLs de tus marcadores. Asegurate de que esto cumpla con tu entorno de red y regulaciones locales.
> 4. Si encuentras perdida de datos o comportamiento inesperado, restaura inmediatamente desde la pagina de Gestion de Copias de Seguridad.

---

## Licencia

[Licencia MIT](LICENSE)

Eres libre de usar, modificar y distribuir este codigo, incluso para proyectos comerciales. El unico requisito es conservar la licencia original y el aviso de copyright al redistribuir.

---

## Star History

[![Grafico de Historial de Stars](https://api.star-history.com/svg?repos=cheechang/BookmarkOrganizer&type=Date)](https://star-history.com/#cheechang/BookmarkOrganizer&Date)

---

Hecho por [cheechang](https://github.com/cheechang)
