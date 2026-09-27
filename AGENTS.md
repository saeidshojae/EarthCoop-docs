# EarthCoop documentation repository instructions

## Purpose

This repository stores versioned EarthCoop documentation, foundational documents, registered release snapshots, publication metadata, and compatibility configuration for documentation tooling.

The public documentation destination used by the main EarthCoop application is `https://docs.earthcoop.ir`. Do not assume that Mintlify is the production runtime merely because `docs.json` and MDX content remain in this repository; treat Mintlify configuration as a compatibility/authoring surface unless a task explicitly targets it.

## Mandatory governance rules

1. Read `REGISTRY_MODEL.md` before changing versions, statuses, registries, the knowledge manifest, or foundational-document navigation.
2. `document-registry.json` is the public baseline and translation-status registry. Its editorial statuses do not establish legal effect.
3. `docs-manifest.json` is the knowledge-center ingestion manifest. A registered not effective document may be reviewable there without becoming public or legally effective.
4. `releases/foundational/<date>/` contains registered release snapshots. Preserve their historical provenance; do not rewrite an old release merely to make current metadata look cleaner.
5. Do not change foundational article text, numbering, legal meaning, or amendment content unless the task explicitly authorizes a substantive legal edit.
6. Prefer generated consolidation from registered base/amendment sources over hand-editing generated packages.
7. Never infer that `registered`, `current`, `final`, `published`, and `effective` mean the same thing. Preserve the exact status model documented by the repository.

## Licensing

EarthCoop-authored material is governed by the repository `LICENSE` (EarthCoop Public Documentation License). Third-party material remains under its own license; preserve `THIRD_PARTY_NOTICES.md` and any file-specific notices.

Do not reintroduce the inherited Mintlify MIT license as the repository-wide license.

## Editing workflow

- Work on a branch and use a pull request for material changes.
- Inspect the current source, release registry, manifest, and tests before editing.
- For behavior-changing scripts, validators, registry contracts, or consolidation logic, add or update a failing test first and verify the RED state before implementation.
- Run `node --test` and `node scripts/validate-docs-manifest.mjs .` before considering a change complete.
- Keep release/history changes separate from broad formatting churn.
- Do not silently update the public baseline when a newer package is only registered and not effective.

## Foundational source hierarchy

- Public baseline / translation state: `document-registry.json`
- Knowledge-center candidates: `docs-manifest.json`
- Registered release evidence: `releases/foundational/<date>/`
- Generated review packages: `published/foundational/`
- Imported base sources needed for deterministic consolidation: `sources/foundational/`

When these layers differ, determine whether the difference is intentional under `REGISTRY_MODEL.md` before changing anything.

## Persian and locale handling

Persian (`fa`) is the source language for foundational documents. Some legacy Mintlify navigation uses the supported `ar` locale as an RTL compatibility mechanism while the actual content remains Persian under `fa/`. Do not "fix" that identifier without first verifying the target documentation runtime supports the intended locale and RTL behavior.

## Content style

- Preserve stable document IDs and article IDs.
- Preserve Persian terminology used by the authoritative source.
- Keep version, status, authority, provenance, and review dates explicit.
- Do not rewrite legal text for stylistic consistency unless substantive editing is explicitly requested.
- When importing a missing base source, preserve the source text and make its provenance traceable.
