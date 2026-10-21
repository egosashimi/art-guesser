// One-off: inspect record structure of candidate sources from CI.
const get = async (url: string, headers: Record<string, string> = {}) => {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'art-guesser-probe', ...headers } });
  const text = await res.text();
  try {
    return { status: res.status, json: JSON.parse(text) as any, text };
  } catch {
    return { status: res.status, json: null as any, text };
  }
};
const show = (label: string, v: unknown, n = 2500) => console.log(`\n=== ${label}\n${JSON.stringify(v).slice(0, n)}`);

// V&A: search with date filter, then one full object
{
  const s = await get('https://api.vam.ac.uk/v2/objects/search?q_object_type=bowl&images_exist=1&year_made_from=1500&year_made_to=1700&page_size=3&page=2');
  show(`vam search ${s.status}`, { info: s.json?.info, records: s.json?.records?.map((r: any) => ({ ...r, _images: undefined, _currentLocation: undefined })) });
  const deep = await get('https://api.vam.ac.uk/v2/objects/search?q=*&images_exist=1&page_size=100&page=150');
  show(`vam deep page ${deep.status}`, deep.json?.info ?? deep.text.slice(0, 300), 600);
  const id = s.json?.records?.[0]?.systemNumber;
  if (id) {
    const o = await get(`https://api.vam.ac.uk/v2/object/${id}`);
    const r = o.json?.record ?? {};
    show(`vam object ${o.status} keys`, Object.keys(r));
    show('vam object fields', {
      objectType: r.objectType, titles: r.titles, productionDates: r.productionDates, placesOfOrigin: r.placesOfOrigin,
      artistMakerPerson: r.artistMakerPerson, materialsAndTechniques: r.materialsAndTechniques, categories: r.categories,
      creditLine: r.creditLine, images: r.images, meta: o.json?.meta,
    }, 4000);
  }
}

// Rijksmuseum: search pagination + object structure + place
{
  const s = await get('https://data.rijksmuseum.nl/search/collection?imageAvailable=true&type=vaas');
  show(`rijks search ${s.status}`, { total: s.json?.partOf?.totalItems, next: s.json?.next, n: s.json?.orderedItems?.length });
  const id = s.json?.orderedItems?.[3]?.id;
  if (id) {
    const o = await get(id, { Accept: 'application/ld+json' });
    const j = o.json ?? {};
    show('rijks keys', Object.keys(j));
    show('rijks identified_by', j.identified_by, 2500);
    show('rijks produced_by', j.produced_by, 4000);
    show('rijks classified_as', j.classified_as, 1500);
    show('rijks shows', j.shows, 800);
    show('rijks made_of', j.made_of, 800);
    show('rijks subject_of', j.subject_of?.slice?.(0, 2), 800);
    const placeId = j.produced_by?.took_place_at?.[0]?.id ?? j.produced_by?.part?.[0]?.took_place_at?.[0]?.id;
    if (placeId) show('rijks place', (await get(placeId, { Accept: 'application/ld+json' })).json, 2500);
    const visId = j.shows?.[0]?.id;
    if (visId) show('rijks visual', (await get(visId, { Accept: 'application/ld+json' })).json, 2500);
  }
}

// SMK: one public-domain non-print object with all fields
{
  const s = await get('https://api.smk.dk/api/v1/art/search/?keys=*&filters=%5Bhas_image:true%5D,%5Bpublic_domain:true%5D,%5Bobject_names:maleri%5D&offset=10&rows=1&lang=en');
  show(`smk ${s.status}`, s.json?.items?.[0], 5000);
}

// Europeana: which open-licence providers have coordinates + years
{
  const f = await get('https://api.europeana.eu/record/v2/search.json?wskey=api2demo&query=pl_wgs84_pos_lat:*&qf=TYPE:IMAGE&reusability=open&rows=0&profile=facets&facet=DATA_PROVIDER&f.DATA_PROVIDER.facet.limit=40');
  show(`europeana providers with coordinates ${f.status}`, f.json?.facets, 4000);
  const g = await get('https://api.europeana.eu/record/v2/search.json?wskey=api2demo&query=*&qf=TYPE:IMAGE&reusability=open&rows=0&profile=facets&facet=DATA_PROVIDER&f.DATA_PROVIDER.facet.limit=60&qf=DATA_PROVIDER:*museum*');
  show(`europeana museum providers ${g.status}`, g.json?.facets ?? g.text.slice(0, 500), 4000);
  const one = await get('https://api.europeana.eu/record/v2/search.json?wskey=api2demo&query=pl_wgs84_pos_lat:*&qf=TYPE:IMAGE&reusability=open&rows=2&profile=rich&qf=DATA_PROVIDER:%22Museum%20of%20Ethnography%22');
  show(`europeana sample ${one.status}`, one.json?.items, 5000);
}

// Te Papa guest token
{
  const t = await get('https://data.tepapa.govt.nz/collection/search?q=tiki');
  const token = t.json?.guestToken;
  if (token) {
    const r = await get('https://data.tepapa.govt.nz/collection/search?q=tapa&size=1', { Authorization: `Bearer ${token}`, 'x-api-key': token });
    show(`tepapa ${r.status}`, r.json ?? r.text.slice(0, 500), 4000);
  }
}
