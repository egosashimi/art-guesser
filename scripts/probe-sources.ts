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
const show = (label: string, v: unknown, n = 2500) => console.log(`\n=== ${label}\n${String(JSON.stringify(v) ?? 'undefined').slice(0, n)}`);

// V&A deep paging limit + Rijks timespan
{
  for (const page of [10, 50, 101]) {
    const d = await get(`https://api.vam.ac.uk/v2/objects/search?q=*&images_exist=1&page_size=100&page=${page}`);
    show(`vam page ${page} -> ${d.status}`, d.json?.info ?? d.text.slice(0, 300), 400);
  }
  const s = await get('https://data.rijksmuseum.nl/search/collection?imageAvailable=true&type=beeld');
  const id = s.json?.orderedItems?.[5]?.id;
  const o = await get(id, { Accept: 'application/ld+json' });
  const txt = JSON.stringify(o.json);
  const i = txt.indexOf('timespan');
  show('rijks timespan', txt.slice(Math.max(0, i - 50), i + 900), 1000);
  const r = await get('https://data.rijksmuseum.nl/search/collection?imageAvailable=true&type=beeld&creationDate=1650');
  show(`rijks creationDate filter ${r.status}`, r.json?.partOf?.totalItems ?? r.text.slice(0, 300));
}

// SMK: one public-domain painting with all fields
{
  const f = await get('https://api.smk.dk/api/v1/art/search/?keys=maleri&filters=%5Bhas_image:true%5D,%5Bpublic_domain:true%5D&offset=0&rows=1&lang=en');
  show(`smk keyword ${f.status}`, f.json?.items?.[0], 5000);
  const s = await get('https://api.smk.dk/api/v1/art/search/?keys=*&filters=%5Bhas_image:true%5D,%5Bpublic_domain:true%5D,%5Bobject_names:Maleri%5D&offset=10&rows=1&lang=en');
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
