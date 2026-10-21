# Design notes

## 1. What Anthropeum does

Gathered from press coverage and guides, since anthropeum.com wasn't reachable from the build environment:

- **Daily only.** 10 artifacts a day from the Met's open-access collection, the same for everyone.
- **Two guesses per object.** Drop a pin on a world map, and pick a 250-year block on a timeline
  running from 3000 BCE to 2000 CE.
- **Scoring.** Up to 5,000 for location plus 5,000 for date, so 100,000 per day. At the end you see
  your score on a distribution of everyone who played that day.
- **Hints.** A date hint (a ~1000-year window) and a place hint (a verbal description of the region).
- **Reveal.** The correct answer, a short description, and a historical basemap for the period.
- **Curation.** Mostly 3-D objects and textiles rather than paintings, with a deliberately
  even split between European and non-European material.
- Made by Matthew Chu, a University of Washington undergraduate. Not affiliated with the Met.

Sources: [Scientific American](https://www.scientificamerican.com/article/wordle-but-for-art-history-anthropeum-turns-the-met-museum-into-an-online-game/),
[Smithsonian](https://www.smithsonianmag.com/smart-news/can-you-guess-the-origins-of-papyrus-fragments-or-painted-ceramics-a-college-student-turned-the-mets-open-access-database-into-an-online-game-180989080/),
[Gigazine](https://gigazine.net/gsc_news/en/20260731-anthropeum/),
[WUSF](https://www.wusf.org/2026-07-31/anthropeum-is-the-new-online-game-for-art-history-lovers),
[anthropeum.games guide](https://www.anthropeum.games/how-to-play).

## 2. What this version changes

| Brief | What was built |
|---|---|
| Infinite mode | **Endless** format for every mode. It remembers what you've seen and doesn't repeat until you've seen most of the pool. **Survival** (3 lives) and **Blitz** (30 s per object) are built on the same engine. |
| Region size as separate modes | Four map scales, each its own mode: **Continent** (6), **Region** (22 cultural regions), **Country**, **Pinpoint**. **Mixed Scale** changes the scale every round and says which on a banner. |
| More modes | 12 presets (Classic, Continents, Regions, Countries, Mixed, Gallery, Artifacts, Time Traveler, Globetrotter, Close Look, Antiquity, Beyond Europe) × 4 formats, plus a custom builder covering every map scale, collection and format. Every combination has its own Daily. |
| Paintings | A **Gallery** preset and a Paintings collection covering oil paintings, Chinese and Japanese scrolls, screens, Persian and Mughal miniatures, icons and thangkas. **Everything** mixes paintings in, and **Artifacts** recreates Anthropeum's no-paintings feel. |
| More sources than the Met | Six museums on three continents: the Met, Art Institute of Chicago and Cleveland (US), the V&A (UK), the Rijksmuseum (NL) and Te Papa (NZ, Pacific collection). Each was probed for data quality first. Europeana, SMK, Nationalmuseum Sweden and others were rejected; the README says why. |
| Balance without predictability | Weighted random draws with no quotas. See §3. |

Additions beyond the brief:

- **Close Look**: the object starts zoomed in on a detail, and you pay to zoom out.
- **Hints with explicit costs**: material/type, an era window (offset so its centre isn't the
  answer), and the next-larger area outlined on the map.
- **Uncertainty-aware scoring**: when a museum only records "Japan" or "Yoruba peoples", any pin
  inside that uncertainty circle gets full points. The circle is drawn on reveal.
- **Stats that teach**: accuracy by part of the world, era and medium, plus your "blind spot" region.
- **Collection**: every object you've played, linked to its museum page, with favourites.
- **Playtest tooling**: a ⚑ Report button on every reveal (wrong location, wrong date, bad image,
  too easy, unfair, loved it). Flags can be copied from Settings.
- **Share text** with emoji rows for place and date, and the day's spotlight noted.

## 3. Balance without predictability

**Problem.** If every daily has exactly one East Asian, one African and one Indigenous American
piece, players learn the slots. By object 9 you can work out what's left.

**Approach.** Objects are grouped into nine *balance groups*: Europe, Africa, Near East,
Iran/Central/South Asia, East Asia, Southeast Asia, Oceania, North America, and Latin
America/Caribbean. Each object is picked like this:

1. Start from long-run **target shares**: Europe 24%, Africa 13%, East Asia 12%, Iran/South Asia 11%,
   Latin America 10%, Near East 10%, Oceania 7%, North America 7%, Southeast Asia 6%. These are
   in `src/game/selection.ts`.
2. Multiply each group by **per-game log-normal noise** (σ = 0.5), so one day leans Andean and
   another leans Japanese.
3. **Diminishing returns** within a game: each pick from a group makes the next one less likely.
   There's a hard cap of 4 per group.
4. **History correction** (Endless and repeat players): groups you've been under-served get
   boosted, and over-served ones damped. The long-run mix converges on the targets without fixed slots.
5. **Scarcity**: a group with few objects is scaled down so its objects repeat no more often than
   about every 60 days.
6. **Spotlight days** (about 1 in 8 dailies): one non-European group gets a 12× weight. It's
   revealed on the results screen, not before.
7. Inside a group, picks spread across region, then culture bucket, then object, with penalties
   for repeating an era or medium in the same game.

Simulation over 2,000 dailies on the current pool (`node scripts/pool-report.ts everything 2000`):

```
group                              pool target served   P(0)  P(1)  P(2) P(3+)
Europe                               39%    24%    23%    7%   20%   29%   44%
Africa                               14%    13%    13%   23%   41%   26%   10%
Near East & Mediterranean Asia        5%    10%    11%   27%   46%   20%    6%
Iran, Central & South Asia           13%    11%    12%   25%   45%   23%    7%
East Asia                             9%    12%    12%   26%   40%   26%    8%
Southeast Asia                        3%     6%     7%   48%   40%   10%    2%
Oceania                               1%     7%     5%   58%   36%    5%    0%
North America                        10%     7%     8%   42%   44%   12%    2%
Latin America & Caribbean             7%    10%    10%   30%   46%   18%    6%
```

Europe is 39% of the pool but 23% of what's served. Every non-European group is missing from a
quarter to a half of games and doubled up in many others, so its presence can't be predicted.
Oceania is under target only because the pool currently holds just 26 Oceanic objects. The Met's
Oceania holdings will fix that as its cache fills.

## 4. Scoring

All the numbers are in `src/config.ts`.

- **Pinpoint**: `5000 · exp(−max(0, distance − radius) / 1500 km)`.
- **Region / Country**: correct = 5000. A wrong answer earns partial credit that decays with the
  distance between the two regions' (or countries') centres, up to 45% / 60%. **Continent** is all or nothing.
- **Date**: 5000 anywhere inside the object's date range. Outside it,
  `exp(−gap / max(80, 0.12 × age))`, so an object's age sets how forgiving the date is.
- **Survival**: a round under 50% costs a life.

## 5. Data caveats

- Museums record "culture" and "place" as free text. The gazetteer maps them to a point. It's
  usually right at the region level and often only approximate at the city level. Everything it
  can't match is listed in `data/report.md`.
- Answers use **modern** countries, even for ancient objects. Mesopotamia shows up as Iraq.
- "Made in" and "found in" are conflated when the museum only records a findspot.
- Pool composition (current build, about 3.5k objects): AIC 50%, CMA 46%, Met 4%. The Met share
  will rise as the daily top-up runs.

## 6. Ideas not yet built

- **Global score distribution and leaderboards** (Anthropeum's end-of-day curve). This needs a
  small backend (Cloudflare Worker + KV, or Supabase). Everything else runs statically.
- **Historical basemaps** on reveal.
- **More sources**: Smithsonian (needs a free api.data.gov key), Harvard Art Museums (key),
  Rijksmuseum, V&A (non-commercial image licence), Wikidata/Commons (also a route to Met images
  without hitting the Met API).
- **Hand curation**: a review page where you approve or veto objects. "Bad image" flags would feed it.
- **Learn mode**: after each reveal, a short "how could you have known?" note (style, material, iconography).
- **Head-to-head**: two players, same objects, simultaneous guesses.

## 7. Open design questions for you

1. **Name.** "Provenance" is a placeholder (`src/config.ts`). Keep it?
2. **Default daily.** The main Daily is pinpoint + date with every category. Should the headline
   daily be Artifacts only (closer to Anthropeum), or Mixed Scale?
3. **Europe's target share.** Currently 24%. Anthropeum feels closer to 30–40%. Where do you want it?
4. **Spotlight days.** Revealed only on the results screen right now. Announce them up front?
   Is 1 in 8 days the right frequency?
5. **Map answers for antiquities.** Modern countries are easier to understand but anachronistic.
   Would you prefer historical regions such as "Mesopotamia" and "Anatolia" in Region mode for
   pre-500 CE objects?
6. **Hints.** Keep all three? Anthropeum allows about 3 per day in total. A daily hint budget is
   an alternative to per-hint point costs.
7. **Endless repeats.** Never repeat (until exhausted), or allow favourites and missed objects to
   come back for spaced-repetition learning?
8. **Leaderboards.** Worth adding a small backend for a daily score distribution or friends leaderboard?
9. **Paintings in Classic.** Paintings are about 25% of "Everything". More, fewer, or zero in the headline daily?
10. **Hosting and domain.** GitHub Pages is wired up. Do you want a custom domain?
