# Playtest plan (week 1)

**Goal:** find out whether the core loop is fun, whether the modes feel distinct, and whether the
regional mix feels fair and unpredictable. Also catch bad data (wrong places, wrong dates, bad
images).

## Setup for testers

1. Send them the GitHub Pages URL.
2. Ask them **not** to read the How to Play page until after their first game. We want to see if
   the UI is self-explanatory. The page opens automatically on first visit, so they can skip it.
3. Whenever an object looks wrong, unfair or great, tap **⚑ Report** on the reveal screen.
4. At the end of each day: paste the **share text** into the group chat, and send the output of
   **Settings → Copy flagged objects** (or the results screen) when asked.
5. Optional: set `FEEDBACK_URL` in `src/config.ts` to a Google Form that holds the questions
   below. The link then appears on the home page and the results screen.

## Daily schedule

| Day | Play | Focus |
|---|---|---|
| 1 | Daily (Classic) only, cold, no instructions | First impressions, learnability |
| 2 | Daily Classic + Daily Continents | Difficulty curve, map scales |
| 3 | Daily Regions + Daily Countries | Are the region boundaries intuitive? |
| 4 | Endless, 20+ objects, any mode | Infinite mode, repetition, pacing |
| 5 | Gallery (paintings) + Close Look | Painting balance, the zoom mechanic |
| 6 | Mixed Scale + one Survival + one Blitz | Do formats feel distinct? |
| 7 | Whatever they want | Which mode they choose freely, plus the wrap-up survey |

## Questions by day

### Day 1: first impressions
1. Without reading instructions, what did you think you had to do? Where did you get stuck?
2. How long did the 10 objects take? Did it feel too short, about right, or too long?
3. Rate the difficulty from 1 (trivial) to 5 (impossible). Which object felt hardest, and why?
4. Was the score reveal satisfying? Did you understand why you got the points you did?
5. Did you click any links through to the museum pages? Why or why not?

### Day 2: map scales
1. Continent vs. Pinpoint: which was more fun? Which felt fairer?
2. Did Continent mode feel too easy to bother with, or a good warm-up?
3. Did you use any hints? Were the costs (−15%, half the date points, half the place points) worth it?
4. Was the timeline easy to use? Did the stretched scale (more room for recent centuries) make sense?

### Day 3: regions and countries
1. Were the 22 regions intuitive? Name any boundary that felt wrong (e.g. Egypt in "North Africa" rather than the Near East).
2. Did partial credit for a neighbouring region feel fair?
3. Did Country mode feel unfair for ancient objects (Mesopotamia → Iraq)? Would historical region names be better?
4. Did the region labels on the map help, or clutter it?

### Day 4: Endless
1. How many objects did you play before stopping? What made you stop?
2. Did you see any repeats? Did anything feel repetitive (same culture, same kind of object)?
3. Would you play Endless again tomorrow, or is the Daily enough?
4. Should Endless show a running "accuracy %" or a streak counter instead of total points?

### Day 5: paintings and Close Look
1. Did Gallery feel like a different game from the artifact modes? Better or worse?
2. In Gallery, were you surprised by any non-European paintings? Too few of them?
3. Close Look: fun, frustrating, or a gimmick? Was the starting zoom too tight or too loose?

### Day 6: formats
1. Mixed Scale: did the changing scale add interest or just confusion? Did you notice the banner?
2. Survival: was a 50% threshold per life too harsh, too soft, or fine?
3. Blitz: was 30 seconds right? Did the timer change how you played?

### Day 7: wrap-up survey
1. Which mode would you play every day? Which would you never play again?
2. **Balance:** across the week, did the mix of cultures feel varied? Did you ever feel you could predict what kind of object was coming next?
3. Did the game ever feel Euro-centric, or the opposite, tokenistic? Describe a moment.
4. Did you learn something you remember? What?
5. Would you share your score? What would make you more likely to?
6. Which single feature would make you come back daily: leaderboards, streaks, friends, a "learn more" blurb?
7. NPS: how likely are you to recommend it to a friend (0–10)?
8. Anything that broke, looked wrong, or was confusing on your device? (Please name your device and browser.)

## What to watch for (observer notes)

- Where people tap first on the game screen (image, map, or timeline?).
- Whether people zoom the map in Pinpoint mode, or always guess zoomed out.
- How long they look at the reveal before pressing Next. A long look means it's interesting.
- Whether they open the full-size image (⤢).
- On mobile: the amount of scrolling between image, map and timeline.

## Data to collect

- Share texts (per-round squares), to see which object types are consistently missed.
- Flag lists from Settings. Each flag carries the object id, so bad records can be added to `data/blocklist.txt`.
- Optional: stats screenshots, to see blind-spot regions across testers.
