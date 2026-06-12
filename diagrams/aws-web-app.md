---
title: AWS — Web application
description: Reference AWS architecture — CloudFront edge, VPC with public/private subnets, Aurora, SQS workers and CloudWatch.
---

# AWS web application

Classic three-tier web app on AWS. Icon names follow the `aws-*`
convention and resolve to the closest glyph automatically.

```archoom
title AWS — Web application
direction right

users [icon: users, color: purple]

AWS Cloud [icon: aws, color: orange] {
  dns [icon: aws-route-53, label: "Route 53"]
  cdn [icon: aws-cloudfront, label: "CloudFront", color: blue]
  waf [icon: aws-waf, label: "WAF", color: red]
  assets [icon: aws-s3, label: "S3 Assets"]
  cognito [icon: aws-cognito, label: "Cognito", color: yellow]

  VPC [icon: aws-vpc, color: blue] {
    Public Subnet {
      alb [icon: aws-alb, label: "App Load Balancer"]
    }

    Private Subnet {
      api [icon: aws-fargate, label: "API (Fargate)"]
      worker [icon: aws-lambda, label: "Workers (Lambda)"]
    }

    Data {
      db [icon: aws-aurora, label: "Aurora Postgres", color: green]
      cache [icon: aws-elasticache, label: "ElastiCache", color: red]
    }
  }

  queue [icon: aws-sqs, label: "SQS", color: orange]
  cw [icon: aws-cloudwatch, label: "CloudWatch", color: teal]
}

// Flows
users > dns: DNS
dns > cdn
waf -- cdn: inspect
cdn > assets: static
cdn > alb: /api
alb > api
api > cognito: auth
api > db: SQL
api > cache
api --> queue: enqueue
queue > worker
worker > db
api --> cw: logs/metrics
worker --> cw

note api: "Fargate service, 2–10 tasks behind the ALB. Blue/green deploys via CodeDeploy."
note db: "Aurora PostgreSQL, one writer + one reader. Backups to S3 with 35-day retention."
```
