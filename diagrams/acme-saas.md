---
title: Acme — SaaS architecture
description: Example showing groups, connections, colors and notes. Edit this file or use the in-browser editor — changes are written back here.
---

# Acme SaaS

The diagram below is plain text. Everything inside the fenced block is the
archoom DSL — the page at `/d/acme-saas` renders it interactively.

```archoom
title Acme — SaaS architecture
direction right

// External actors
users [icon: users, color: purple]
web [icon: browser, label: "Web App", color: blue]

// Cloud platform
Cloud Platform [icon: cloud, color: blue] {
  lb [icon: load-balancer, label: "Load Balancer"]

  Services {
    api [icon: server, label: "API"]
    auth [icon: lock, label: "Auth", color: yellow]
    worker [icon: worker, label: "Worker"]
  }

  Data Layer [color: green] {
    db [icon: postgres, label: "Postgres"]
    cache [icon: redis, label: "Redis", color: red]
    storage [icon: storage, label: "Object Storage"]
  }

  queue [icon: queue, label: "Job Queue", color: orange]
}

observability [icon: monitoring, label: "Monitoring", color: teal]

// Flows
users > web: HTTPS
web > lb
lb > api
api > auth: verify JWT
api > db: read/write
api > cache
api --> queue: enqueue jobs
queue > worker
worker > db
api > storage
api --> observability: metrics

note api: "Stateless REST API — scales horizontally behind the load balancer. Deployed as containers."
note queue: "At-least-once delivery. Retries with exponential backoff."

```
