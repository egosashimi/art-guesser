import type { Category } from '../src/data/types.ts';

// Ordered: within one text the first rule that matches wins.
const RULES: [Category, RegExp][] = [
  ['painting', /\b(paintings?|hanging scroll|handscroll|album leaf|folding fan|fan mounted|folding screen|screens?|thangka|tanka|icons?|panel painting|altarpiece|miniatures?|oil on canvas|oil on wood|oil on panel|oil on copper|tempera|fresco|ink and colou?r|ink on paper|ink on silk|watercolou?r|gouache)\b/],
  ['sculpture', /\b(sculptures?|statues?|statuettes?|figures?|figurines?|busts?|stele|stela|steles|sarcophagus|masks?|reliquary|nkisi|nkondi|effigy|idol|netsuke|okimono|buddha|bodhisattva|deity|shiva|vishnu|ganesha|totem pole|terracottas)\b/],
  ['textile', /\b(textiles?|costumes?|dress|garment|robes?|kimono|tunic|mantle|shawl|sash|headdress|hat|cap|shoes?|sandals?|boots?|gloves?|lace|embroider\w*|tapestr\w*|carpets?|rugs?|kilim|quilt|coverlet|cloth|fabric|velvet|brocade|batik|ikat|beadwork|beaded|featherwork|basket|basketry|mat)\b/],
  ['ceramic', /\b(ceramics?|porcelain|stoneware|earthenware|terracotta|terra-cotta|terra cotta|faience|pottery|vases?|vessels?|jars?|bowls?|ewers?|cups?|plates?|dish|dishes|tiles?|glass|krater|kylix|amphora|lekythos|hydria|oinochoe|skyphos|pyxis|lustreware|lusterware|maiolica|majolica|celadon|tea bowl)\b/],
  ['metal', /\b(metal|metalwork|bronzes?|gold|silver|copper|brass|pewter|iron|steel|armor|armour|helmet|sword|dagger|knife|weapons?|shield|spear|arms|jewelry|jewellery|necklace|bracelet|rings?|earrings?|pendant|brooch|fibula|ornaments?|coins?|medals?|enamel|cloisonn[eé])\b/],
  ['paper', /\b(drawings?|prints?|woodblock|woodcut|engraving|etching|lithograph|manuscripts?|codex|codices|folio|calligraphy|books?|papyrus|papyri|illustrated|photographs?)\b/],
  ['sculpture', /\b(relief|head|carvings?|carved|marble|limestone|sandstone|granite|basalt|alabaster|jade|ivory|wood|stone)\b/],
  ['textile', /\b(silk|cotton|wool|linen|feathers?)\b/],
];

/** Pass texts from most to least authoritative (classification, object name, medium). */
export function categorize(...texts: (string | null | undefined)[]): Category {
  for (const raw of texts) {
    if (!raw) continue;
    const t = raw.toLowerCase();
    for (const [cat, re] of RULES) if (re.test(t)) return cat;
  }
  return 'other';
}
