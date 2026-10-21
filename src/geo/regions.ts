// Geography tiers used by the game. Shared by the browser app and the data build scripts,
// so keep this file free of DOM / Node-only imports.
//
// Tier 1: continent (6)   — easiest map mode
// Tier 2: region (23)     — cultural-geographic regions, roughly the UN geoscheme adjusted for art history
// Tier 3: country         — modern Natural Earth countries (as named in world-atlas)
// Tier 4: pinpoint        — free pin drop, scored by distance

export type ContinentId = 'africa' | 'europe' | 'asia' | 'oceania' | 'north-america' | 'south-america';

export interface Continent {
  id: ContinentId;
  name: string;
}

export const CONTINENTS: Continent[] = [
  { id: 'africa', name: 'Africa' },
  { id: 'europe', name: 'Europe' },
  { id: 'asia', name: 'Asia' },
  { id: 'oceania', name: 'Oceania' },
  { id: 'north-america', name: 'North & Central America' },
  { id: 'south-america', name: 'South America' },
];

export interface Region {
  id: string;
  name: string;
  continent: ContinentId;
  /** Balance group used by the selection algorithm (see src/game/selection.ts). */
  group: BalanceGroup;
  /** Representative point used for partial-credit distance: [lon, lat]. */
  center: [number, number];
  /** Short map label and where to put it, if different from `center`. */
  short: string;
  label?: [number, number];
  countries: string[];
}

export type BalanceGroup =
  | 'europe'
  | 'africa'
  | 'west-asia'
  | 'south-central-asia'
  | 'east-asia'
  | 'southeast-asia'
  | 'oceania'
  | 'north-america'
  | 'latin-america';

export const BALANCE_GROUP_NAMES: Record<BalanceGroup, string> = {
  europe: 'Europe',
  africa: 'Africa',
  'west-asia': 'Near East & Mediterranean Asia',
  'south-central-asia': 'Iran, Central & South Asia',
  'east-asia': 'East Asia',
  'southeast-asia': 'Southeast Asia',
  oceania: 'Oceania',
  'north-america': 'North America',
  'latin-america': 'Latin America & Caribbean',
};

export const REGIONS: Region[] = [
  // Europe
  {
    id: 'northern-europe', name: 'Britain, Ireland & Scandinavia', continent: 'europe', group: 'europe', center: [5, 59], short: 'Britain & Scandinavia', label: [12, 63],
    countries: ['United Kingdom', 'Ireland', 'Isle of Man', 'Jersey', 'Guernsey', 'Iceland', 'Norway', 'Sweden', 'Finland', 'Åland', 'Denmark', 'Faeroe Is.', 'Estonia', 'Latvia', 'Lithuania'],
  },
  {
    id: 'western-europe', name: 'Western & Central Europe', continent: 'europe', group: 'europe', center: [6, 49], short: 'W. & Central Europe', label: [-2, 48],
    countries: ['France', 'Monaco', 'Belgium', 'Netherlands', 'Luxembourg', 'Germany', 'Switzerland', 'Liechtenstein', 'Austria'],
  },
  {
    id: 'southern-europe', name: 'Mediterranean Europe', continent: 'europe', group: 'europe', center: [14, 41], short: 'Mediterranean Europe', label: [6, 39.5],
    countries: ['Spain', 'Portugal', 'Andorra', 'Italy', 'San Marino', 'Vatican', 'Malta', 'Greece', 'Slovenia', 'Croatia', 'Bosnia and Herz.', 'Serbia', 'Montenegro', 'Kosovo', 'Albania', 'Macedonia'],
  },
  {
    id: 'eastern-europe', name: 'Eastern Europe', continent: 'europe', group: 'europe', center: [27, 50], short: 'Eastern Europe', label: [38, 55],
    countries: ['Poland', 'Czechia', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria', 'Moldova', 'Ukraine', 'Belarus', 'Russia'],
  },
  // Africa
  {
    id: 'north-africa', name: 'North Africa & the Nile', continent: 'africa', group: 'africa', center: [17, 27], short: 'North Africa & Nile', label: [12, 25],
    countries: ['Egypt', 'Libya', 'Tunisia', 'Algeria', 'Morocco', 'W. Sahara', 'Sudan'],
  },
  {
    id: 'west-africa', name: 'West Africa', continent: 'africa', group: 'africa', center: [-3, 11], short: 'West Africa', label: [-6, 13],
    countries: ['Mauritania', 'Senegal', 'Gambia', 'Guinea-Bissau', 'Guinea', 'Sierra Leone', 'Liberia', "Côte d'Ivoire", 'Mali', 'Burkina Faso', 'Ghana', 'Togo', 'Benin', 'Niger', 'Nigeria', 'Cabo Verde', 'Saint Helena'],
  },
  {
    id: 'central-africa', name: 'Central Africa', continent: 'africa', group: 'africa', center: [18, -2], short: 'Central Africa', label: [20, -3],
    countries: ['Cameroon', 'Central African Rep.', 'Chad', 'Gabon', 'Eq. Guinea', 'Congo', 'Dem. Rep. Congo', 'Angola', 'São Tomé and Principe'],
  },
  {
    id: 'east-africa', name: 'East Africa & the Horn', continent: 'africa', group: 'africa', center: [38, 2], short: 'East Africa', label: [40, 4],
    countries: ['Ethiopia', 'Eritrea', 'Djibouti', 'Somalia', 'Somaliland', 'Kenya', 'Uganda', 'Rwanda', 'Burundi', 'Tanzania', 'S. Sudan', 'Madagascar', 'Comoros', 'Seychelles', 'Mauritius'],
  },
  {
    id: 'southern-africa', name: 'Southern Africa', continent: 'africa', group: 'africa', center: [26, -20], short: 'Southern Africa', label: [24, -24],
    countries: ['South Africa', 'Namibia', 'Botswana', 'Lesotho', 'eSwatini', 'Zimbabwe', 'Zambia', 'Malawi', 'Mozambique'],
  },
  // Asia
  {
    id: 'west-asia', name: 'Near East, Anatolia & Arabia', continent: 'asia', group: 'west-asia', center: [40, 32], short: 'Near East & Arabia', label: [45, 22],
    countries: ['Turkey', 'Cyprus', 'N. Cyprus', 'Syria', 'Lebanon', 'Israel', 'Palestine', 'Jordan', 'Iraq', 'Saudi Arabia', 'Yemen', 'Oman', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Bahrain', 'Georgia', 'Armenia', 'Azerbaijan'],
  },
  {
    id: 'central-asia', name: 'Iran, Central Asia & the Steppe', continent: 'asia', group: 'south-central-asia', center: [62, 40], short: 'Iran & Central Asia', label: [66, 45],
    countries: ['Iran', 'Afghanistan', 'Turkmenistan', 'Uzbekistan', 'Tajikistan', 'Kyrgyzstan', 'Kazakhstan', 'Mongolia'],
  },
  {
    id: 'south-asia', name: 'South Asia', continent: 'asia', group: 'south-central-asia', center: [78, 22], short: 'South Asia', label: [79, 20],
    countries: ['India', 'Pakistan', 'Bangladesh', 'Nepal', 'Bhutan', 'Sri Lanka', 'Maldives', 'Siachen Glacier', 'Br. Indian Ocean Ter.'],
  },
  {
    id: 'east-asia', name: 'East Asia', continent: 'asia', group: 'east-asia', center: [115, 35], short: 'East Asia', label: [112, 36],
    countries: ['China', 'Hong Kong', 'Macao', 'Taiwan', 'Japan', 'North Korea', 'South Korea'],
  },
  {
    id: 'southeast-asia', name: 'Southeast Asia', continent: 'asia', group: 'southeast-asia', center: [108, 8], short: 'Southeast Asia', label: [108, 6],
    countries: ['Myanmar', 'Thailand', 'Laos', 'Cambodia', 'Vietnam', 'Malaysia', 'Singapore', 'Indonesia', 'Brunei', 'Philippines', 'Timor-Leste'],
  },
  // Oceania
  {
    id: 'australia', name: 'Australia', continent: 'oceania', group: 'oceania', center: [134, -25], short: 'Australia', label: [134, -25],
    countries: ['Australia', 'Ashmore and Cartier Is.', 'Indian Ocean Ter.', 'Norfolk Island', 'Heard I. and McDonald Is.'],
  },
  {
    id: 'melanesia', name: 'New Guinea & Melanesia', continent: 'oceania', group: 'oceania', center: [152, -7], short: 'Melanesia', label: [152, -9],
    countries: ['Papua New Guinea', 'Solomon Is.', 'Vanuatu', 'New Caledonia', 'Fiji'],
  },
  {
    id: 'polynesia', name: 'Polynesia, Micronesia & Aotearoa', continent: 'oceania', group: 'oceania', center: [-170, -10], short: 'Polynesia', label: [-176, -22],
    countries: ['New Zealand', 'Samoa', 'American Samoa', 'Tonga', 'Fr. Polynesia', 'Cook Is.', 'Niue', 'Wallis and Futuna Is.', 'Pitcairn Is.', 'Kiribati', 'Micronesia', 'Marshall Is.', 'N. Mariana Is.', 'Guam', 'Palau', 'Nauru'],
  },
  // Americas
  {
    id: 'north-america', name: 'North America & the Arctic', continent: 'north-america', group: 'north-america', center: [-98, 45], short: 'North America', label: [-100, 48],
    countries: ['United States of America', 'Canada', 'Greenland', 'St. Pierre and Miquelon', 'Bermuda'],
  },
  {
    id: 'mesoamerica', name: 'Mexico & Central America', continent: 'north-america', group: 'latin-america', center: [-95, 18], short: 'Mexico & Central Am.', label: [-100, 20],
    countries: ['Mexico', 'Guatemala', 'Belize', 'El Salvador', 'Honduras', 'Nicaragua', 'Costa Rica', 'Panama'],
  },
  {
    id: 'caribbean', name: 'Caribbean', continent: 'north-america', group: 'latin-america', center: [-72, 19], short: 'Caribbean', label: [-70, 21],
    countries: ['Cuba', 'Haiti', 'Dominican Rep.', 'Jamaica', 'Puerto Rico', 'Bahamas', 'Trinidad and Tobago', 'Barbados', 'Grenada', 'Saint Lucia', 'St. Vin. and Gren.', 'Dominica', 'Antigua and Barb.', 'St. Kitts and Nevis', 'Cayman Is.', 'Turks and Caicos Is.', 'British Virgin Is.', 'U.S. Virgin Is.', 'Anguilla', 'Montserrat', 'Aruba', 'Curaçao', 'Sint Maarten', 'St-Martin', 'St-Barthélemy'],
  },
  {
    id: 'andes', name: 'Andes & Pacific South America', continent: 'south-america', group: 'latin-america', center: [-74, -10], short: 'Andes', label: [-79, -20],
    countries: ['Colombia', 'Ecuador', 'Peru', 'Bolivia', 'Chile'],
  },
  {
    id: 'eastern-south-america', name: 'Amazonia & Atlantic South America', continent: 'south-america', group: 'latin-america', center: [-55, -15], short: 'Amazonia & Atlantic', label: [-50, -6],
    countries: ['Venezuela', 'Guyana', 'Suriname', 'Brazil', 'Paraguay', 'Uruguay', 'Argentina', 'Falkland Is.', 'S. Geo. and the Is.'],
  },
];

export const REGION_BY_ID = new Map(REGIONS.map((r) => [r.id, r]));
export const CONTINENT_BY_ID = new Map(CONTINENTS.map((c) => [c.id, c]));

const REGION_BY_COUNTRY = new Map<string, Region>();
for (const r of REGIONS) for (const c of r.countries) REGION_BY_COUNTRY.set(c, r);

/** Countries that are excluded from play (no art objects should be placed there). */
export const IGNORED_COUNTRIES = new Set(['Antarctica', 'Fr. S. Antarctic Lands']);

/**
 * Region for a point. Handles overseas territories that Natural Earth folds into a European
 * country's multipolygon (French Guiana, Réunion, Hawai‘i inside the USA, …) by looking at the
 * point itself rather than trusting the country.
 */
export function regionFor(lon: number, lat: number, country: string | null | undefined): Region | undefined {
  // Hawai‘i and the rest of the central Pacific
  if (lon < -140 || lon > 165) {
    if (lat > -50 && lat < 30 && !(country === 'New Zealand')) {
      if (lon > 165 && lon < 180 && lat < -10 && lat > -25 && (country === 'Fiji' || country === 'Vanuatu' || country === 'New Caledonia')) {
        return REGION_BY_ID.get('melanesia');
      }
      if (lon > 155 || lon < -140) return REGION_BY_ID.get('polynesia');
    }
  }
  // Easter Island (Rapa Nui) belongs to Chile but is Polynesian
  if (lon < -100 && lon > -115 && lat < -20 && lat > -35) return REGION_BY_ID.get('polynesia');

  // Western New Guinea is politically Indonesia but culturally Melanesian (Asmat, Sentani…)
  if (country === 'Indonesia' && lon > 130.8 && lat < 0.5) return REGION_BY_ID.get('melanesia');

  const byCountry = country ? REGION_BY_COUNTRY.get(country) : undefined;
  if (byCountry && byCountry.continent === 'europe') {
    // European country but point is outside Europe → overseas territory; use nearest non-European region
    const inEurope = lat > 34 && lat < 82 && lon > -32 && lon < 70;
    if (!inEurope) return nearestRegion(lon, lat, (r) => r.continent !== 'europe');
  }
  if (byCountry) return byCountry;
  return nearestRegion(lon, lat);
}

export function nearestRegion(lon: number, lat: number, filter: (r: Region) => boolean = () => true): Region {
  let best = REGIONS[0];
  let bestD = Infinity;
  for (const r of REGIONS) {
    if (!filter(r)) continue;
    const d = haversineKm(lon, lat, r.center[0], r.center[1]);
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  return best;
}

export function haversineKm(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function regionCountryName(country: string): Region | undefined {
  return REGION_BY_COUNTRY.get(country);
}
