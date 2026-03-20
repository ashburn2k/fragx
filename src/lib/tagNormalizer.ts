export interface NormalizedTag {
  label: string;
  color: 'cyan' | 'teal' | 'amber' | 'rose' | 'slate' | 'emerald' | 'sky' | 'orange';
}

const WYSIWYG_PATTERNS = [
  /^wysiwyg/i,
  /wysiwyg$/i,
  /wsiwyg/i,
  /wizzi.wig/i,
];

const TAG_RULES: Array<{ match: RegExp | RegExp[] | string[]; label: string; color: NormalizedTag['color'] }> = [
  { match: WYSIWYG_PATTERNS, label: 'WYSIWYG', color: 'amber' },
  { match: [/^aquacultured/i, /aquacultured coral/i, /^aqc$/i, /^aqua$/i], label: 'Aquacultured', color: 'emerald' },
  { match: [/^wild$/i, /^wild.caught$/i, /^wild collected$/i], label: 'Wild Caught', color: 'orange' },
  { match: [/^colony$/i, /^colonies$/i, /colony$/i, /^coral colony$/i], label: 'Colony', color: 'rose' },
  { match: [/^frag$/i, /^frags$/i, /^si frag$/i, /^single frag/i, /just frags/i, /^15frag$/i, /^25frag$/i, /^35frag$/i, /^45frag$/i], label: 'Frag', color: 'sky' },
  { match: [/^frag.?pack/i, /^coral.pack$/i, /^pack$/i, /^fragpack$/i], label: 'Frag Pack', color: 'sky' },
  { match: [/^on.?sale$/i, /^sale$/i, /clearance/i, /deal$/i, /doorbuster/i, /flashsale/i, /blue.light.special/i], label: 'Sale', color: 'rose' },
  { match: [/^new$/i, /^new.arrivals?$/i, /^latest.arrivals?$/i, /^fresh/i], label: 'New Arrival', color: 'cyan' },
  { match: [/^beginner/i, /^easy$/i, /^easy.in.sps.tank$/i], label: 'Beginner Friendly', color: 'emerald' },
  { match: [/^lps$/i, /^lps corals?$/i, /^lps.frags?$/i, /^lps.coral.frags?$/i], label: 'LPS', color: 'teal' },
  { match: [/^sps$/i, /^sps.corals?$/i, /^sps.frags?$/i, /^sps.coral$/i], label: 'SPS', color: 'sky' },
  { match: [/^soft.?coral/i, /^softy$/i, /^softies$/i, /^soft$/i], label: 'Soft Coral', color: 'teal' },
  { match: [/^zoanthids?$/i, /^zoa$/i, /^zoas$/i, /^palys?$/i, /^palythoa$/i, /^polyps? [&] zoanthids?$/i, /^zoas? [&] palys?$/i, /^zoas & palys$/i, /^paly\/zoa$/i, /^zoanthus/i], label: 'Zoanthids', color: 'cyan' },
  { match: [/^mushroom/i, /^ricordea/i, /^discosoma/i, /^actinodiscus/i, /^rhodactis/i], label: 'Mushrooms', color: 'teal' },
  { match: [/^acropora/i, /^acro$/i, /^acros?$/i, /^acropora.frags?$/i], label: 'Acropora', color: 'sky' },
  { match: [/^montipora/i, /^monti$/i], label: 'Montipora', color: 'sky' },
  { match: [/^euphyllia/i, /^hammer$/i, /^torch$/i, /^frogspawn$/i, /^elegance$/i], label: 'Euphyllia', color: 'teal' },
  { match: [/^chalice/i, /^echinophyllia/i, /^mycedium/i, /^pectinia/i, /^oxypora/i, /^lithophyllon/i], label: 'Chalice', color: 'teal' },
  { match: [/^goniopora/i, /^goniopora.sp$/i], label: 'Goniopora', color: 'teal' },
  { match: [/^favia$/i, /^favia.sp$/i, /^favites/i], label: 'Favia', color: 'teal' },
  { match: [/^blastomussa/i], label: 'Blastomussa', color: 'teal' },
  { match: [/^acanthastrea/i, /^acan$/i, /^lord$/i, /^micromussa/i], label: 'Acanthastrea', color: 'teal' },
  { match: [/^scolymia/i, /^cynarina/i, /^acanthophyllia/i], label: 'Scolymia', color: 'teal' },
  { match: [/^trachyphyllia/i, /^wellsophyllia/i, /^lobophyllia/i], label: 'Brain Coral', color: 'teal' },
  { match: [/^cyphastrea/i], label: 'Cyphastrea', color: 'teal' },
  { match: [/^pavona/i, /^leptastrea/i, /^leptoseris/i, /^psammacora/i, /^psammocora/i], label: 'Encrusting SPS', color: 'sky' },
  { match: [/^pocillopora/i, /^stylophora/i, /^birdsnest/i, /^bird.?s.?nest/i], label: 'Birdsnest / Pocillopora', color: 'sky' },
  { match: [/^fungia/i, /^plate.coral/i, /^fungia$/i], label: 'Plate Coral', color: 'teal' },
  { match: [/^anemone/i, /^entacmaea/i, /^bubble.tip/i], label: 'Anemone', color: 'rose' },
  { match: [
    /^invert/i, /^clean.up.crew/i, /^cuc$/i,
    /^shrimp/i, /^crab/i, /^snail/i, /^clam/i,
    /^starfish/i, /^sea.star/i, /^cucumber/i, /^sea.cucumber/i,
    /^urchin/i, /^sea.urchin/i, /^hermit/i, /^hermit.crab/i,
    /^nassarius/i, /^cerith/i, /^astrea/i, /^trochus/i, /^turbo/i,
    /^nerite/i, /^conch/i, /^chiton/i, /^cowrie/i, /^nudibranch/i,
    /^feather.duster/i, /^bristle.?worm/i, /^serpent.star/i,
    /^brittle.star/i, /^sand.sifter/i, /^copepod/i, /^amphipod/i,
    /^pistol.shrimp/i, /^cleaner.shrimp/i, /^peppermint.shrimp/i,
    /^fire.shrimp/i, /^coral.banded.shrimp/i, /^mantis.shrimp/i,
    /^emerald.crab/i, /^arrow.crab/i, /^sally.lightfoot/i,
    /^lobster/i, /^octopus/i, /^squid/i, /^nudibranch/i,
    /^sea.apple/i, /^tridacna/i, /^maxima/i, /^crocea/i, /^derasa/i,
    /^gorgonian/i, /^sea.fan/i, /^tunicate/i, /^sponge/i,
    /^worm.rock/i, /^worm$/i,
  ], label: 'Invert / CUC', color: 'slate' },
  { match: [/^fish$/i, /^livestock$/i, /^live.stock$/i, /^fish.direct$/i], label: 'Fish', color: 'slate' },
  { match: [/^moderate/i, /^low.to.moderate/i], label: 'Moderate Light', color: 'amber' },
  { match: [/^high.light/i, /^moderate.to.high/i, /^high.par/i], label: 'High Light', color: 'amber' },
  { match: [/^low.light/i, /^low.par/i], label: 'Low Light', color: 'emerald' },
  { match: [/^featured/i, /^signature/i, /^ultra/i, /^premium/i, /^gem$/i, /^vics.picks$/i, /^vivid.?s.vault$/i, /^uc.signature$/i, /^joes?.gems?$/i], label: 'Featured / Ultra', color: 'amber' },
  { match: [/^limited/i, /^rare$/i, /^unique$/i, /^most.popular$/i], label: 'Rare / Limited', color: 'rose' },
];

const NOISE_TAGS = new Set([
  'goods', 'stock', 'stock items', 'catalog', 'maintenance', 'shipping',
  'live sale', 'livesale', 'coral', 'live', 'reef', 'saltwater', 'ccg',
  '#n/a', 'battlecorals', 'panta rhei', 'dalua', 'dastapo', 'dastaco',
  'illumagic', 'polyplab', 'corechem', 'pax bellum', 'arid', 'marco rocks',
  'marcoRocks', 'triton', 'core7', 'magsleeve', 'bf2023', 'vday24', 'vday25',
  'blo23-inv', 'stamina', 'summer frenzy', 'usa', 'texas',
  'eastern asia', 'south asia', 'central pacific', 'west americas',
  'melanesia', 'australia / coral sea', 'symbiotic-relationships',
  'reef-compatible', 'carnivore', 'herbivore', 'omnivore',
  'gear', 'dry goods', 'sticker', 'aquascape', 'lighting', 'filtration',
  'filter media', 'skimmer', 'pump', 'flow', 'filter', 'foods',
  'sand cleaner', 'algae muncher', 'algae eater',
  'reef shrimp', 'saltwater shrimp', 'pistol shrimp', 'coral banded shrimp',
  'pairs', 'juveniles',
  '25-50', '50-75', '75-100', '100-150', '150-300', '300-500', '500-750', '750-1000',
  '10-25', 'over-50', 'over-100', 'over-1000', 'under-25',
]);

const SIZE_PATTERN = /^\d+-\d+$|^(under|over)-\d+$/i;
const FRAG_SIZE_PATTERN = /^\d+frag$/i;
const GENUS_PATTERN = /^[a-z]+-[a-z]+$/i;

const cache = new Map<string, NormalizedTag | null>();

export function normalizeTag(raw: string): NormalizedTag | null {
  if (cache.has(raw)) return cache.get(raw)!;

  const lower = raw.toLowerCase().trim();

  if (
    NOISE_TAGS.has(lower) ||
    SIZE_PATTERN.test(lower) ||
    FRAG_SIZE_PATTERN.test(lower) ||
    (GENUS_PATTERN.test(lower) && lower.length < 30)
  ) {
    cache.set(raw, null);
    return null;
  }

  for (const rule of TAG_RULES) {
    const patterns = Array.isArray(rule.match) ? rule.match : [rule.match];
    for (const pattern of patterns) {
      if (pattern instanceof RegExp) {
        if (pattern.test(lower)) {
          const result = { label: rule.label, color: rule.color };
          cache.set(raw, result);
          return result;
        }
      } else if (typeof pattern === 'string' && lower === pattern.toLowerCase()) {
        const result = { label: rule.label, color: rule.color };
        cache.set(raw, result);
        return result;
      }
    }
  }

  cache.set(raw, null);
  return null;
}

export function getProductNormalizedTags(rawTags: string[]): NormalizedTag[] {
  const seen = new Set<string>();
  const result: NormalizedTag[] = [];
  for (const raw of rawTags) {
    const normalized = normalizeTag(raw);
    if (normalized && !seen.has(normalized.label)) {
      seen.add(normalized.label);
      result.push(normalized);
    }
  }
  return result;
}

const OTHER_LABEL = 'Other';

export function buildTagFilterOptions(
  products: Array<{ tags: string[] }>
): Array<{ label: string; color: NormalizedTag['color']; count: number }> {
  const counts = new Map<string, { color: NormalizedTag['color']; count: number }>();
  for (const p of products) {
    const seen = new Set<string>();
    for (const raw of p.tags) {
      const n = normalizeTag(raw);
      if (!n || seen.has(n.label)) continue;
      seen.add(n.label);
      const existing = counts.get(n.label);
      if (existing) {
        existing.count++;
      } else {
        counts.set(n.label, { color: n.color, count: 1 });
      }
    }
  }

  const all = Array.from(counts.entries())
    .filter(([label]) => !GENUS_CATEGORY_TAGS.has(label))
    .map(([label, { color, count }]) => ({ label, color, count }))
    .sort((a, b) => b.count - a.count);

  const total = all.reduce((sum, t) => sum + t.count, 0);
  const threshold = Math.max(3, Math.ceil(total * 0.02));
  const main = all.filter(t => t.count >= threshold);
  const small = all.filter(t => t.count < threshold);

  if (small.length === 0) return main;

  const otherCount = small.reduce((sum, t) => sum + t.count, 0);
  return [...main, { label: OTHER_LABEL, color: 'slate' as NormalizedTag['color'], count: otherCount }];
}

export const OTHER_TAG_LABELS = new Set<string>();

const GENUS_CATEGORY_TAGS = new Set([
  'LPS', 'SPS', 'Soft Coral', 'Zoanthids', 'Mushrooms',
  'Acropora', 'Montipora', 'Euphyllia', 'Chalice', 'Goniopora',
  'Favia', 'Blastomussa', 'Acanthastrea', 'Scolymia', 'Brain Coral',
  'Cyphastrea', 'Encrusting SPS', 'Birdsnest / Pocillopora', 'Plate Coral',
  'Anemone', 'Invert / CUC', 'Fish',
]);

export function getSmallTagLabels(
  products: Array<{ tags: string[] }>
): Set<string> {
  const counts = new Map<string, number>();
  for (const p of products) {
    const seen = new Set<string>();
    for (const raw of p.tags) {
      const n = normalizeTag(raw);
      if (!n || seen.has(n.label)) continue;
      seen.add(n.label);
      counts.set(n.label, (counts.get(n.label) ?? 0) + 1);
    }
  }
  const total = Array.from(counts.values()).reduce((sum, c) => sum + c, 0);
  const threshold = Math.max(3, Math.ceil(total * 0.02));
  const small = new Set<string>();
  for (const [label, count] of counts.entries()) {
    if (count < threshold) small.add(label);
  }
  return small;
}

export function productMatchesTagFilter(product: { tags: string[] }, tagLabel: string): boolean {
  const seen = new Set<string>();
  for (const raw of product.tags) {
    const n = normalizeTag(raw);
    if (!n || seen.has(n.label)) continue;
    seen.add(n.label);
    if (n.label === tagLabel) return true;
  }
  return false;
}
