// One-off: inspect Te Papa and Europeana (Swedish world-culture museums) records from CI.
const get = async (url: string, init: RequestInit = {}) => {
  const res = await fetch(url, { ...init, headers: { Accept: 'application/json', 'User-Agent': 'art-guesser-probe', ...(init.headers ?? {}) } });
  const text = await res.text();
  try {
    return { status: res.status, json: JSON.parse(text) as any, text };
  } catch {
    return { status: res.status, json: null as any, text };
  }
};
const show = (label: string, v: unknown, n = 3000) => console.log(`\n=== ${label}\n${String(JSON.stringify(v) ?? 'undefined').slice(0, n)}`);

{
  const t = await get('https://data.tepapa.govt.nz/collection/search?q=x');
  const token = t.json?.guestToken;
  const h = { Authorization: `Bearer ${token}`, 'x-api-key': token, 'Content-Type': 'application/json' };
  const body = {
    query: '*',
    from: 0,
    size: 2,
    filters: [
      { field: 'type', keyword: 'Object' },
      { field: 'collection', keyword: 'PacificCultures' },
      { field: 'hasRepresentation.rights.allowsDownload', keyword: 'true' },
    ],
  };
  const r = await get('https://data.tepapa.govt.nz/collection/search', { method: 'POST', headers: h, body: JSON.stringify(body) });
  show(`tepapa post search ${r.status} total`, r.json?._metadata ?? r.text.slice(0, 400), 800);
  const o = r.json?.results?.[0];
  if (o) {
    show('tepapa keys', Object.keys(o));
    show('tepapa core', { title: o.title, objectType: o.objectType, production: o.production, isMadeOf: o.isMadeOf, collection: o.collection, credit: o.creditLine, href: o.href }, 4000);
    show('tepapa rep', o.hasRepresentation?.[0], 2000);
  }
}

for (const provider of ['Museum of Far Eastern Antiquities', 'Museum of Ethnography', 'Museum of World Culture', 'The Museum of Mediterranean and Near Eastern Antiquities']) {
  const q = `https://api.europeana.eu/record/v2/search.json?wskey=api2demo&query=*&qf=TYPE:IMAGE&reusability=open&rows=3&profile=rich&qf=${encodeURIComponent(`DATA_PROVIDER:"${provider}"`)}&qf=YEAR:%5B-5000%20TO%201950%5D`;
  const r = await get(q);
  show(`europeana ${provider} ${r.status} total=${r.json?.totalResults}`, (r.json?.items ?? []).map((i: any) => ({
    title: i.dcTitleLangAware, year: i.year, timespan: i.edmTimespanLabel, created: i.dctermsCreated, date: i.dcDate,
    creator: i.dcCreator, type: i.dcTypeLangAware, place: i.edmPlaceLabel ?? i.dctermsSpatial, lat: i.edmPlaceLatitude, lon: i.edmPlaceLongitude,
    img: i.edmIsShownBy, rights: i.rights, link: i.edmIsShownAt, desc: (i.dcDescription ?? []).slice(0, 4),
  })), 5000);
  const all = await get(`https://api.europeana.eu/record/v2/search.json?wskey=api2demo&query=*&qf=TYPE:IMAGE&reusability=open&rows=0&qf=${encodeURIComponent(`DATA_PROVIDER:"${provider}"`)}`);
  console.log(`  (without YEAR filter: ${all.json?.totalResults})`);
}
