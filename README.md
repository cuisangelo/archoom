# archoom

**Architecture diagrams as code — beautiful, interactive, and stored in plain files.**

![archoom workbench](docs/screenshot.png)

archoom renders architecture diagrams from a small text DSL onto an interactive canvas. Each diagram is a plain `.md` or `.yaml` file in your repo: edit it in your editor or in the built-in code panel, click any component to attach a note, and everything is written straight back to the file. No database, no accounts — diagrams live with your code and review like code. Deploy it as a read-only gallery and share any diagram as an interactive, embeddable link.

## Features

- **Files are the source of truth.** Diagrams are `.md` / `.yaml` files in `diagrams/`. Edits and notes are debounce-saved back into the file itself.
- **Diagram-as-code DSL.** Nodes, nested groups, labeled connections, colors and icons in a few lines of text.
- **Automatic layout.** ELK's layered algorithm handles nested containers; pan, zoom and drag freely on a React Flow canvas.
- **Click-to-annotate.** Select a component and write a note in the panel that opens next to it. Notes are stored as `note` statements in the source, so they travel with the file and show up in diffs.
- **Official cloud icons.** 1,150+ vendored AWS / Azure / GCP architecture icons, plus a general-purpose line-icon set with fuzzy name matching.
- **Shareable view-only links.** Every diagram has a chromeless, interactive `/v/<slug>` viewer you can embed in an `<iframe>`. Editing is gated to local — the deployed site is read-only.

## Getting started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. Every diagram file found in `diagrams/` appears on the index — add a new one by dropping a file there.

## Diagram files

**Markdown** — the first fenced code block is the diagram source; frontmatter feeds the index page. Prose around the block is yours to keep:

````markdown
---
title: My system
description: Shown on the index page.
---

```archoom
title My system
direction right

users [icon: users]
api [icon: server, label: "API", color: blue]
db [icon: postgres, label: "Postgres", color: green]

users > api: HTTPS
api > db: SQL
```
````

**YAML** — the DSL goes under a `source:` block scalar:

```yaml
title: My system
description: Shown on the index page.
source: |
  users [icon: users]
  api [icon: server]
  users > api
```

## DSL reference

### Nodes

```
name [icon: server, label: "Display name", color: blue]
"Name with spaces" [icon: database]
```

All properties are optional. Undeclared names used in connections are created automatically.

### Groups

Groups nest arbitrarily and accept the same properties as nodes:

```
Cloud [icon: aws, color: orange] {
  VPC [icon: aws-vpc, color: blue] {
    api [icon: server]
    db [icon: postgres]
  }
}
```

### Connections

| Syntax | Meaning |
| --- | --- |
| `a > b` | arrow |
| `a < b` | reverse arrow |
| `a <> b` | bidirectional |
| `a - b` | plain line |
| `a -- b` | dotted line |
| `a --> b` | dotted arrow |

Connections take labels, fan out and chain:

```
api > db: read/write
api > db, cache
users > web > api > db
```

### Directives

```
title My architecture
direction right   // right (default), left, down, up
```

### Notes

```
note api: "Stateless — scales horizontally behind the load balancer."
```

Created and updated automatically when you annotate from the UI; safe to write by hand too.

### Colors

`gray`, `blue`, `green`, `red`, `orange`, `yellow`, `purple`, `pink`, `teal`, or any `#rrggbb` hex.

## Icons

- **General:** line-icon names like `server`, `database`, `queue`, `cache`, `users`, `browser`, `lock`, `monitoring`… Unknown names fall back to the closest glyph by fuzzy matching.
- **Cloud:** official provider icons with `aws-*`, `azure-*`, `gcp-*` slugs — e.g. `aws-lambda`, `aws-fargate`, `azure-kubernetes-services`, `gcp-bigquery` — plus shorthands such as `aws-s3`, `aws-sqs`, `aws-alb`, `aws-vpc`, `azure-aks`, `gcp-gke`.
- **Refreshing the packs:** `node scripts/import-cloud-icons.mjs` downloads the providers' current icon packages and regenerates `public/icons/` and the manifest. Update the URLs in the script when a new quarterly package ships.

Cloud provider icons remain under their respective owners' terms — see [public/icons/README.md](public/icons/README.md).

## Sharing & deploying

archoom is meant to be deployed (e.g. to Vercel) as a public, **read-only** gallery and embedded anywhere.

- **View-only links.** Every diagram has a chromeless, interactive viewer at `/v/<slug>`. Open a diagram and hit **Share** to copy the link or a ready-made `<iframe>` embed snippet.
- **Editing is local-only.** The code editor and note-saving write to the diagram files, so they're enabled only where the filesystem is writable — i.e. running locally. On a read-only host like Vercel the diagrams render without an editor, so nobody can edit the deployed site. Override with `ARCHOOM_EDIT=1` (force-enable) or `ARCHOOM_EDIT=0` (force read-only).
- **Embedding.** The `/v/*` routes send `Content-Security-Policy: frame-ancestors *`, so they drop into an `<iframe>` on any site.

```html
<iframe src="https://your-app.vercel.app/v/my-system" width="100%" height="480" style="border:0;border-radius:16px" loading="lazy"></iframe>
```

## Stack

[Next.js](https://nextjs.org) · [React Flow](https://reactflow.dev) · [elkjs](https://github.com/kieler/elkjs) · [CodeMirror 6](https://codemirror.net) · [Tailwind CSS 4](https://tailwindcss.com) · [Lucide](https://lucide.dev)
