import { describe, expect, it } from 'vitest';
import { parseDateText } from '../scripts/sources/common.ts';

describe('parseDateText', () => {
  const cases: [string, [number, number] | null][] = [
    ['1850', [1850, 1850]],
    ['circa 1850', [1840, 1860]],
    ['1850s', [1850, 1859]],
    ['1800s', [1800, 1899]],
    ['early 1900s', [1900, 1935]],
    ['1850-70', [1850, 1870]],
    ['19th century', [1800, 1899]],
    ['late 19th century', [1860, 1899]],
    ['before 1900', [1850, 1900]],
    ['500 BC', [-500, -500]],
    ['300-200 BC', [-300, -200]],
    ['200 BCE - 100 CE', [-200, 100]],
    ['unknown', null],
  ];
  for (const [s, want] of cases) it(s, () => expect(parseDateText(s)).toEqual(want));
});
