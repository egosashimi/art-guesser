export type SourceId = 'met' | 'aic' | 'cma';

export type Category = 'painting' | 'sculpture' | 'textile' | 'ceramic' | 'metal' | 'paper' | 'other';

export const CATEGORY_NAMES: Record<Category, string> = {
  painting: 'Paintings',
  sculpture: 'Sculpture',
  textile: 'Textiles & dress',
  ceramic: 'Ceramics & glass',
  metal: 'Metalwork, jewelry & arms',
  paper: 'Works on paper & books',
  other: 'Other objects',
};

export const SOURCE_NAMES: Record<SourceId, string> = {
  met: 'The Metropolitan Museum of Art',
  aic: 'Art Institute of Chicago',
  cma: 'Cleveland Museum of Art',
};

/** One playable object in public/data/pool.json. Field names are short to keep the file small. */
export interface ArtObject {
  /** Globally unique id, e.g. "met:45734". */
  id: string;
  src: SourceId;
  title: string;
  artist?: string;
  culture?: string;
  /** Human-readable place of origin as recorded by the museum (plus modern country). */
  place: string;
  /** Display date as recorded by the museum, e.g. "ca. 1340–1320 B.C." */
  date: string;
  /** Earliest / latest year (negative = BCE). */
  y0: number;
  y1: number;
  lat: number;
  lon: number;
  /** Location uncertainty radius in km — guesses inside it get full credit. */
  r: number;
  /** Natural Earth country name containing the point. */
  country: string;
  cat: Category;
  medium?: string;
  /** Object type/classification as recorded by the museum ("Bowl", "Hanging scroll"). */
  kind?: string;
  img: string;
  imgFull?: string;
  url: string;
  credit?: string;
  /** Museum flagged as a highlight / boosted / masterpiece. */
  hl?: 1;
  /** Date (YYYY-MM-DD) the object entered the pool. A Daily only uses objects added before its date. */
  added?: string;
  /** Diversity bucket (normalised culture / place), so a game doesn't serve three Attic vases. */
  bucket: string;
}

export interface Pool {
  version: number;
  built: string;
  objects: ArtObject[];
}
