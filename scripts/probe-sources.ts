// One-off: check which candidate museum APIs answer from CI and what their records look like.
const PROBES: [string, string, Record<string, string>?][] = [
  ['rijks-search', 'https://data.rijksmuseum.nl/search/collection?imageAvailable=true&type=mask'],
  ['smk', 'https://api.smk.dk/api/v1/art/search/?keys=*&filters=%5Bhas_image:true%5D,%5Bpublic_domain:true%5D&offset=0&rows=1'],
  ['vam', 'https://api.vam.ac.uk/v2/objects/search?q=mask&images_exist=1&page_size=1'],
  ['europeana', 'https://api.europeana.eu/record/v2/search.json?wskey=api2demo&query=mask&reusability=open&media=true&qf=TYPE:IMAGE&rows=1&profile=rich'],
  ['finna', 'https://api.finna.fi/v1/search?lookfor=mask&filter%5B%5D=online_boolean:%221%22&limit=1'],
  ['museums-victoria', 'https://collections.museumsvictoria.com.au/api/search?query=mask&hasimages=yes&perpage=1'],
  ['auckland', 'https://api.aucklandmuseum.com/search/collectionsonline/_search?q=mask&size=1'],
  ['tepapa', 'https://data.tepapa.govt.nz/collection/search?q=mask'],
  ['dimu', 'https://api.dimu.org/api/solr/select?q=maske&wt=json&rows=1&api.key=demo'],
  ['natmus-dk', 'https://api.natmus.dk/search/public/simple?query=maske&size=1'],
  ['nationalmuseum-se', 'https://api.nationalmuseum.se/api/objects?limit=1'],
  ['louvre', 'https://collections.louvre.fr/ark:/53355/cl010062370.json'],
  ['smithsonian-s3', 'https://smithsonian-open-access.s3-us-west-2.amazonaws.com/metadata/edan/nmafa/index.txt'],
  ['paris-musees', 'https://apicollections.parismusees.paris.fr/graphql'],
  ['colbase', 'https://colbase.nich.go.jp/api/v1/collection_items?limit=1'],
  ['npm-tw', 'https://theme.npm.edu.tw/opendata/DigiArchiveAPI.aspx?format=json&limit=1'],
];

for (const [name, url, headers] of PROBES) {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'art-guesser-probe', ...headers } });
    const body = await res.text();
    console.log(`\n=== ${name} ${res.status} ${res.headers.get('content-type')}`);
    console.log(body.slice(0, 1500).replace(/\s+/g, ' '));
    if (name === 'rijks-search' && res.ok) {
      const id = JSON.parse(body).orderedItems?.[0]?.id;
      if (id) {
        const r2 = await fetch(id, { headers: { Accept: 'application/ld+json' } });
        console.log(`\n=== rijks-object ${r2.status} ${id}`);
        console.log((await r2.text()).slice(0, 4000).replace(/\s+/g, ' '));
      }
    }
  } catch (e) {
    console.log(`\n=== ${name} ERROR ${(e as Error).message}`);
  }
}
