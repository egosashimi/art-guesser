# Provenance (working title)

A daily **and endless** art-history guessing game: you see an object from a museum's
open-access collection and guess **where** and **when** it was made. Inspired by
[Anthropeum](https://anthropeum.com), with more modes, more sources, and a different approach to
regional balance.

- **Map scales**: Continent · Region (22 cultural regions) · Country · Pinpoint · Mixed (scale changes every round) · No map
- **Formats**: Daily (same 10 objects for everyone, in *every* mode) · Endless · Survival (3 lives) · Blitz (30 s)
- **Collections**: Everything · Artifacts (no paintings) · Paintings · Sculpture · Textiles · Ceramics · Metal & Arms · Works on paper · Antiquity · Beyond Europe · Europe · Masterpieces
- **Extras**: Close Look (start zoomed into a detail), hints with point costs, stats by world region / era / medium, a personal collection of everything you've seen, favourites, in-game "report this object" flags for playtesters

See [`docs/DESIGN.md`](docs/DESIGN.md) for how it works and the open design questions, and
[`docs/PLAYTEST.md`](docs/PLAYTEST.md) for the playtest plan and questions.

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests (scoring, timeline, selection balance)
npm run build        # static site in dist/
```

It's a static site (Vite + Preact + d3-geo), so any static host works. `.github/workflows/deploy.yml`
publishes `main` to GitHub Pages. To turn that on, open **Settings → Pages → Source: GitHub Actions**.

## Data

`public/data/pool.json` is built by `scripts/build-pool.ts` from six open-access museum APIs:

| Source | Country | Image licence | Notes |
|---|---|---|---|
| [The Met](https://metmuseum.github.io/) | US | CC0 | Best non-European holdings. Its bot protection blocks bulk requests from CI, so the Met cache grows a little each day (see below). |
| [Art Institute of Chicago](https://api.artic.edu/docs/) | US | CC0 (public-domain works) | Strong on paintings, Asian and American art |
| [Cleveland Museum of Art](https://openaccess-api.clevelandart.org/) | US | CC0 | Clean dates/cultures; small departments (e.g. Oceania) fetched whole |
| [Victoria and Albert Museum](https://developers.vam.ac.uk/) | UK | © V&A, free for non-commercial use | Searched by place of origin to lean on its Asian, Islamic and Mesoamerican holdings |
| [Rijksmuseum](https://data.rijksmuseum.nl/) | Netherlands | Public domain | Linked Art data with precise production places (Haarlem, Tamil Nadu, Gandhara…) |
| [Te Papa Tongarewa](https://data.tepapa.govt.nz/docs/) | New Zealand | CC BY-NC-ND or no known restrictions (per image) | Pacific Cultures collection only; fills the Oceania gap. Set a `TEPAPA_API_KEY` repo secret for production (free); otherwise a guest token is used. |

Evaluated and **not** used, to keep the data clean:

- Europeana, including the Swedish National Museums of World Culture: the "year" is often the acquisition date, and titles are mixed-language.
- SMK Copenhagen: clean, but almost entirely European prints and drawings.
- Nationalmuseum Sweden: many records have no date or image.
- Louvre: has no search API.
- Museums Victoria, Auckland Museum and Taiwan's National Palace Museum: blocked by Cloudflare from CI.

The V&A and Te Papa licences are **non-commercial**. Fine for a free game, but they'd need revisiting before any monetisation.

Pipeline: fetch → filter (public domain, has image, dated −4000…1950, date span not too vague) →
**geocode** the free-text culture/place fields with an art-historical gazetteer
(`scripts/gazetteer.ts`: ~730 places, peoples and historical polities under ~2,900 spellings → point + uncertainty radius) →
assign a Natural Earth country → cap over-represented cultures → write the pool.
`data/report.md` shows the composition plus the most common place strings the gazetteer
couldn't match. Add those to the gazetteer and run `npm run build-pool -- --from-cache` to re-geocode
offline.

```bash
npm run build-pool                         # fetch everything (merges into data/raw/*.json.gz)
npm run build-pool -- --only-fetch met     # just top up the Met (works best from a home connection)
npm run build-pool -- --from-cache         # re-geocode without any network
node scripts/pool-report.ts everything 2000  # simulate 2000 dailies: how balanced / predictable?
```

The **Build art pool** workflow runs on every change to `scripts/`, monthly for a full refresh,
and daily for a small Met top-up. Scheduled runs only happen once the workflow is on `main`.

Each object records the date it was `added`; a Daily only uses objects added *before* that day,
so pool updates never change a puzzle in the middle of a day.

## Code map

```
src/geo/regions.ts      continents, 22 regions, balance groups, point → region rules
src/geo/world.ts        Natural Earth geometry, region/continent shapes, point → country
src/game/selection.ts   the balanced, non-quota object picker
src/game/scoring.ts     place/time scoring + hints
src/game/modes.ts       collections, presets, formats
src/config.ts           names and every tunable number
src/ui/                 Preact screens (Home, Game, MapView, Timeline, Results, Pages)
scripts/                data pipeline
```
