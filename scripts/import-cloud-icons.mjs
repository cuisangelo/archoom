#!/usr/bin/env node
// Imports the official AWS / Azure / GCP architecture icon packs:
// downloads each provider's zip, normalizes file names into archoom slugs
// (aws-*, azure-*, gcp-*), copies the SVGs into public/icons/<provider>/
// and writes the lib/cloud-icons.json manifest used by the icon resolver.
//
// Provider packs are released periodically (AWS quarterly, Azure ~quarterly):
// update the URLs below when refreshing. Zips are cached in .icons-cache/.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const CACHE = path.join(ROOT, '.icons-cache');
const OUT = path.join(ROOT, 'public', 'icons');
const MANIFEST = path.join(ROOT, 'lib', 'cloud-icons.json');

const PACKS = {
  aws: 'https://d1.awsstatic.com/onedam/marketing-channels/website/aws/en_US/architecture/approved/architecture-icons/Icon-package_04302026.4705b90f5aa45b019271a2699e9ce9b97b941ee1.zip',
  azure: 'https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V23.zip',
  gcp: 'https://cloud.google.com/static/icons/files/google-cloud-icons.zip',
};

// Friendly shorthand -> canonical slug. Applied only when the target exists.
const ALIASES = {
  aws: 'aws-cloud',
  'aws-vpc': 'aws-virtual-private-cloud-vpc',
  'aws-s3': 'aws-simple-storage-service',
  'aws-sqs': 'aws-simple-queue-service',
  'aws-sns': 'aws-simple-notification-service',
  'aws-ses': 'aws-simple-email-service',
  'aws-alb': 'aws-elastic-load-balancing',
  'aws-elb': 'aws-elastic-load-balancing',
  'aws-nlb': 'aws-elastic-load-balancing',
  'aws-eks': 'aws-elastic-kubernetes-service',
  'aws-ecs': 'aws-elastic-container-service',
  'aws-ecr': 'aws-elastic-container-registry',
  azure: 'azure-azure-a',
  'azure-aks': 'azure-kubernetes-services',
  gcp: 'gcp-google-cloud-platform',
  'gcp-gke': 'gcp-google-kubernetes-engine',
  'gcp-gcs': 'gcp-cloud-storage',
};

const kebab = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.name === '__MACOSX') continue;
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

function fetchPack(provider, url) {
  const zip = path.join(CACHE, `${provider}.zip`);
  const dir = path.join(CACHE, provider);
  if (!fs.existsSync(zip)) {
    console.log(`downloading ${provider}…`);
    execSync(`curl -sL -o "${zip}" "${url}"`, { stdio: 'inherit' });
  }
  if (!fs.existsSync(dir)) {
    execSync(`unzip -q -o "${zip}" -d "${dir}"`);
  }
  return dir;
}

function collect(provider, dir) {
  const icons = new Map();
  const add = (slug, file) => {
    if (!slug || slug === `${provider}-`) return;
    if (!icons.has(slug)) icons.set(slug, file);
  };

  for (const file of walk(dir)) {
    const name = path.basename(file);
    if (!name.endsWith('.svg')) continue;

    if (provider === 'aws') {
      if (file.includes('Architecture-Service-Icons')) {
        const m = /^Arch_(.+)_48\.svg$/.exec(name);
        if (m) add(`aws-${kebab(m[1].replace(/^(Amazon|AWS)-/, ''))}`, file);
      } else if (file.includes('Architecture-Group-Icons')) {
        const m = /^(.+)_32\.svg$/.exec(name);
        if (m && !m[1].endsWith('_Dark')) add(`aws-${kebab(m[1].replace(/^AWS-/, ''))}`, file);
      }
    } else if (provider === 'azure') {
      const m = /-icon-service-(.+)\.svg$/.exec(name);
      if (m) add(`azure-${kebab(m[1])}`, file);
    } else if (provider === 'gcp') {
      add(`gcp-${kebab(path.basename(name, '.svg'))}`, file);
    }
  }
  return icons;
}

fs.mkdirSync(CACHE, { recursive: true });
fs.rmSync(OUT, { recursive: true, force: true });

const allSlugs = [];
for (const [provider, url] of Object.entries(PACKS)) {
  const dir = fetchPack(provider, url);
  const icons = collect(provider, dir);
  const outDir = path.join(OUT, provider);
  fs.mkdirSync(outDir, { recursive: true });
  for (const [slug, file] of icons) {
    fs.copyFileSync(file, path.join(outDir, `${slug}.svg`));
    allSlugs.push(slug);
  }
  console.log(`${provider}: ${icons.size} icons`);
}

const slugSet = new Set(allSlugs);
const aliases = Object.fromEntries(Object.entries(ALIASES).filter(([, target]) => slugSet.has(target)));
const dropped = Object.keys(ALIASES).filter((k) => !(k in aliases));
if (dropped.length) console.warn(`aliases dropped (target missing): ${dropped.join(', ')}`);

fs.writeFileSync(MANIFEST, JSON.stringify({ icons: allSlugs.sort(), aliases }, null, 2) + '\n');
console.log(`manifest: ${allSlugs.length} icons, ${Object.keys(aliases).length} aliases -> lib/cloud-icons.json`);
