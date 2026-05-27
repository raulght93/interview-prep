# Interview Prep

App estática (Next.js 14 + static export) para preparar entrevistas técnicas de
arquitectura/backend: **flashcards** (memorización) + **quiz** (test). Sin backend,
funciona offline tras la primera carga y el progreso vive en `localStorage`.

## Stack

- Next.js 14 (App Router, `output: 'export'`)
- TypeScript · Tailwind CSS · lucide-react
- `react-markdown` + `remark-gfm` para renderizar respuestas en Markdown

## Comandos

```bash
npm install
npm run dev      # desarrollo en http://localhost:3000
npm run build    # genera el sitio estático en ./out
```

`npm run build` produce `out/`, desplegable tal cual en cualquier static host
(Vercel, Netlify, GitHub Pages, S3+CloudFront, Cloudflare Pages).

## Estructura

```
src/
  app/
    page.tsx                     # Home: grid de topics + progreso global + búsqueda
    flashcards/[topic]/page.tsx  # Modo flashcard (SSG por topic)
    quiz/[topic]/page.tsx        # Modo quiz (SSG por topic)
    review/page.tsx              # Cards marcadas como "review" (cross-topic)
  components/                    # Flashcard, QuizQuestion, TopicCard, SearchBar, ...
  lib/                           # types, data, storage, srs, hooks (useProgress, useKeyboard)
  data/questions.json            # Dataset (semilla — ampliable)
```

## Atajos de teclado (modo flashcard / review)

| Tecla     | Acción                  |
| --------- | ----------------------- |
| `espacio` | Voltear la tarjeta      |
| `k`       | Marcar "La sabía"       |
| `r`       | Marcar "Repasar"        |
| `→`       | Siguiente               |
| `←`       | Anterior                |

Los atajos se desactivan mientras escribes en un campo de texto.

## Datos

El dataset (`src/data/questions.json`) es **semilla** y se amplía fácilmente:
añade objetos `Question` (`id`, `topicId`, `question`, `answer` en Markdown, `tags`,
`difficulty`) y, si hace falta, nuevos `Topic`. La UI (conteos, %, búsqueda, rutas
estáticas) se actualiza sola en el siguiente `build`.

## Persistencia

- Progreso por card (status `new`/`known`/`review`, contadores, último vistazo) bajo
  la clave `interview-prep-progress-v1`.
- Tema (dark por defecto) bajo `interview-prep-theme-v1`.
- Export/Import del progreso como JSON desde la home.
