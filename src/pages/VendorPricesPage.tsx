import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Search, RefreshCw,
  X, TrendingDown, Clock, Store, AlertCircle, BarChart2, ShoppingBag, ChevronDown, SlidersHorizontal, Tag, MoreHorizontal, EyeOff, Shield
} from 'lucide-react';
import { supabase, VendorScrapeConfig, VendorProduct, VendorScrapeRun } from '../lib/supabase';
import VendorProductCard from '../components/vendor-prices/VendorProductCard';
import PriceChangesPanel from '../components/vendor-prices/PriceChangesPanel';
import ScrapeProgressBar from '../components/vendor-prices/ScrapeProgressBar';
import ImageCacheProgressBanner from '../components/vendor-prices/ImageCacheProgressBanner';
import DailyUpdatesBanner from '../components/vendor-prices/DailyUpdatesBanner';
import { buildTagFilterOptions, productMatchesTagFilter, getSmallTagLabels, NormalizedTag } from '../lib/tagNormalizer';

const EQUIPMENT_TAGS = new Set([
  'dosing', 'testing', 'ro/di', 'rodi', 'ro di', 'fragging', 'light', 'filtration',
  'pump', 'rock', 'maintenance', 'powerhead', 'heater', 'salt', 'ato', 'merch',
  'bacteria', 'lighting', 'equipment', 'plumbing', 'sand',
  'reef stock', 'subscriptions', 'service', 'box fee', 'shipping', 'shipping fee',
  'shipping upgrade', 'shipping insurance', 'handling fee', 'overnight shipping',
  'flat rate shipping', 'live arrival guarantee', 'lag',
  'replacement blades', 'power supply holder', 'light shade', 'aquarium viewer',
  'bracket', '3d printing', 'flipper accessories', 'aquarium cleaning supplies',
  'scrubber', 'phytoplankton', 'lighting bundle pack', 'hand held scraper',
  'printed reef', 'flipper aquarium products', 'reefbreeders.com',
  'dalua international llc', 'pod your reef', 'nature dimensions',
  'sticker', 'decal', 'additive', 'supplement', 'chemical', 'treatment',
  'food', 'coral food', 'reef food', 'fish food', 'frozen food', 'phytoplankton', 'zooplankton',
  'copepods', 'rotifers', 'mysis', 'brine shrimp', 'flake', 'pellet',
  'medication', 'medicine', 'ich treatment', 'parasite', 'antibiotic', 'probiotic',
  'vitamin', 'ich', 'velvet', 'disease', 'treatment', 'medicated',
  'water change', 'water maintenance', 'algae scraper', 'algae magnet',
  'tank maintenance', 'water conditioner', 'dechlorinator',
]);

const HIDDEN_TITLE_PATTERNS = [
  /sticker/i,
  /decal/i,
  /bumper.?sticker/i,
  /\bshipping\b/i,
  /flat.?rate.?ship/i,
  /overnight.?ship/i,
  /handling.?fee/i,
  /phosphate.?remov/i,
  /phosphat-e/i,
  /\bkalkwasser\b/i,
  /\balkalinity\s+(supplement|solution|part)/i,
  /\bcalcium\s+(part|solution|supplement)/i,
  /\bmagnesium\s+(part|solution|supplement)/i,
  /\btrace\s+elements?\b/i,
  /\bamino\s+acids?\b/i,
  /\bactivated\s+carbon\b/i,
  /\bphos.?(guard|ban|sorb|rx|net)\b/i,
  /\bcarbon\s+dosing\b/i,
  /\bnitrate\s+remov/i,
  /\bskimmer\b/i,
  /\bpump\b/i,
  /\bpowerhead\b/i,
  /\bheater\b/i,
  /\bfilter\b/i,
  /\brefractometer\b/i,
  /\btest\s+kit\b/i,
  /\bsalt\s+mix\b/i,
  /\bwater\s+change/i,
  /\baquarium\s+glass/i,
  /\bmagnetic\s+cleaner/i,
  /\brodi?\s+unit\b/i,
  /\bfrag\s+(plug|rack|disk|disc|tile|cup|stand|holder)\b/i,
  /\bfrag\s+rack\b/i,
  /\bmagnetic\s+frag\b/i,
  /\b3d.?print/i,
  /\bprinted\s+reef\b/i,
  /\bglass\s*(&|and)\s*acrylic\s+clean/i,
  /\bacrylic\s+clean/i,
  /\bglass\s+clean/i,
  /\bcleaner\b.*\b(glass|acrylic|aquarium)\b|\b(glass|acrylic|aquarium)\b.*\bcleaner\b/i,
  /\bglue\b/i,
  /\bsuper\s+glue\b/i,
  /\bgift\s+card\b/i,
  /\bgift\s+certificate\b/i,
  /\bt.?shirt\b/i,
  /\bhat\b.*\breef\b|\breef\b.*\bhat\b/i,
  /\bhoodie\b/i,
  /\bsweatshirt\b/i,
  /\btank\s+top\b/i,
  /\bflake(s|d)?\s+food\b|\bfish\s+flake/i,
  /\bpellet(s)?\s+food\b|\bfish\s+pellet/i,
  /\bfrozen\s+food\b/i,
  /\bcoral\s+food\b/i,
  /\breef\s+food\b/i,
  /\bphyto(plankton)?\b/i,
  /\bzoo?plankton\b/i,
  /\bmysis\s+shrimp\b/i,
  /\bbrine\s+shrimp\b/i,
  /\bcopepod/i,
  /\broti(fer)?/i,
  /\bnori\b/i,
  /\bseaweed\s+(select|sheet|clip)/i,
  /\bfeed(ing)?\s+(block|station|ring)\b/i,
  /\breef.?roid/i,
  /\bpoly.?lab\b/i,
  /\bbenny.?stick/i,
  /\bfrag.?biotic/i,
  /\bshipping\s+(insurance|protection|fee|cost|upgrade|box|label)\b/i,
  /\bovernight\s+(delivery|ship)/i,
  /\blive\s+arrival\s+guarantee\b/i,
  /\bship.?box\b/i,
  /\bhandling\b/i,
  /\bcarrier\s+(bag|fee)\b/i,
  /\bich\b/i,
  /\bvelvet\b/i,
  /\bparasite/i,
  /\bmedication\b/i,
  /\bmedicated\b/i,
  /\bantibiotic/i,
  /\bprobiotic\b/i,
  /\bvitamin\s+(c|b|supplement)/i,
  /\bcopper\s+(treat|safe|power|solution)/i,
  /\bmetronidazole\b/i,
  /\bchloroquine\b/i,
  /\bpraziquantel\b|\bprazi\s*pro\b/i,
  /\bformalin\b/i,
  /\bfuran\b/i,
  /\bkanamycin\b/i,
  /\bhydrogen\s+peroxide\b/i,
  /\bdisease\s+(treat|cure|prevent)/i,
  /\bfish\s+(treat|cure|heal|med)/i,
  /\balgae\s+(wafer|sheet|clip|disc)\b/i,
  /\bbloodworm\b/i,
  /\bkrill\b/i,
  /\bspirulina\b/i,
  /\bgamma\s+(mysis|krill|blood)/i,
  /\bwater\s+conditioner\b/i,
  /\bdechlorinator\b/i,
  /\btank\s+maintenance\b/i,
  /\balgae\s+(scraper|magnet|cleaner|scrubber)\b/i,
  /\baquarium\s+maintenance\b/i,
];

const HIDDEN_COLLECTIONS = new Set([
  'reef-stock', 'heater', 'subscriptions', 'service', 'box-fee', 'shipping',
  'aquarium-services', 'aquarium-water', 'reef-wear', 'dry-goods', 'drygoods', 'dry-good',
  'freshwater-fish', 'freshwater-&-planted', 'freshwater-invert', 'aquatic-plant',
  'frozen-food', 'aquarium', 'neptune-systems', 'aquarium-supplies-and-accessories',
  'aquariums-&-sumps', 'aquarium-furniture', 'aquariums,-tanks-and-bowls',
  'aquarium-water', 'product', 'additives', 'food', 'fish-food', 'fish-&-coral-foods',
  'shopkeep', 'reef-wear', 'water-care-and-testing',
  'supplements-and-internal-health-supplies', 'skimmers,-reactors-&-filtration',
  'salt-&-maintenance', 'cleaning-supplies', 'heaters-&-chillers', 'fragging-supplies',
  'temperature-monitoring-and-control', 'auto-top-off', 'rock-&-sand',
  'feeding-supplies', 'controllers-&-testing', 'panta-rhei',
  'replacement-blades', 'power-supply-holder', 'light-shade', 'aquarium-viewer',
  'bracket', '3d-printing', 'flipper-accessories', 'aquarium-cleaning-supplies',
  'scrubber', 'phytoplankton', 'lighting-bundle-pack', 'hand-held-scraper',
  'animals-&-pet-supplies', 'aquarium-lighting', 'aquarium-pumps', 'filtration-bundle-pack',
  'fish-supplies', 'guard', 'home-&-garden', 'led-light', 'mount', 'protein-skimmer',
  'sea-urchin-hats', 'show', 'zooplankton', 'clothing',
  'equipment', 'aquarium-supplies', 'supplements', 'testing', 'dosing',
  'merch', 'apparel', 'fragging', 'salt', 'ro-di', 'lighting',
  'nugget_giftcard', 'gift-card', 'gift-cards', 'gift-certificates',
  'freshwater', 'pond', 'terrarium', 'reptile',
  'medication', 'medications', 'fish-medication', 'fish-health', 'disease-treatment',
  'treatments', 'ich-treatment', 'parasite-treatment', 'fish-treatments',
  'shipping-upgrade', 'shipping-insurance', 'shipping-protection', 'shipping-fee',
  'overnight-shipping', 'flat-rate-shipping', 'live-arrival',
  'maintenance', 'water-maintenance', 'water-care', 'tank-maintenance',
  'algae-control', 'algae-scrapers', 'cleaning',
  'fish-food', 'coral-food', 'reef-food', 'frozen-foods',
  'live-food', 'dry-food', 'food-and-supplements',
]);

const HIDDEN_PRODUCT_TYPES = new Set([
  'dry goods', 'dry good', 'drygoods', 'equipment', 'aquarium supplies',
  'shopkeep', 'product', 'additives', 'food', 'reef wear',
  'water care and testing', 'freshwater fish', 'freshwater',
  'supplements', 'merch', 'apparel', 'clothing',
  'salt', 'salt mix', 'ro/di', 'lighting', 'pump', 'heater', 'filter',
  'fragging supplies', 'testing', 'dosing', 'skimmer',
  'aquarium', 'aquarium furniture', 'aquarium supplies and accessories',
  'controller', 'powerhead', 'auto top off', 'ato',
  'medication', 'medications', 'fish medication', 'fish health', 'treatment',
  'disease treatment', 'ich treatment', 'parasite treatment',
  'shipping', 'shipping fee', 'shipping upgrade', 'shipping insurance',
  'overnight shipping', 'flat rate shipping', 'live arrival guarantee',
  'handling', 'handling fee',
  'maintenance', 'water maintenance', 'water care', 'tank maintenance',
  'fish food', 'coral food', 'reef food', 'frozen food', 'live food',
  'food and supplements', 'fish food and supplements',
]);

const HIDDEN_TAG_PATTERNS = [
  /^reef.?stock$/i,
  /^heater/i,
  /^subscription/i,
  /^service/i,
  /^box.?fee$/i,
  /^shipping/i,
  /^medication/i,
  /^treatment/i,
  /^parasite/i,
  /^maintenance/i,
  /^handling.?fee/i,
  /^live.?arrival/i,
  /^overnight.?ship/i,
];

const VENDOR_HIDE_RULES: Record<string, { collections?: RegExp[]; titlePatterns?: RegExp[]; tags?: RegExp[] }> = {
  aquasd: {
    collections: [/^locals?-?only$/i],
    titlePatterns: [/\blocals?\s+only\b/i],
    tags: [/^locals?\s*only$/i],
  },
  'living-reef-orlando': {
    collections: [/^all$/i, /^foods?-?(&|-and-)?-?maintenance$/i, /^shipping-?module$/i],
  },
};

function shouldHideProduct(tags: string[], collection: string, title = '', productType = '', vendorSlug = ''): boolean {
  if (HIDDEN_COLLECTIONS.has(collection.toLowerCase().trim())) return true;
  if (productType && HIDDEN_PRODUCT_TYPES.has(productType.toLowerCase().trim())) return true;
  if (tags.some(t => EQUIPMENT_TAGS.has(t.toLowerCase().trim()))) return true;
  if (tags.some(t => HIDDEN_TAG_PATTERNS.some(p => p.test(t.trim())))) return true;
  if (title && HIDDEN_TITLE_PATTERNS.some(p => p.test(title))) return true;
  if (vendorSlug && VENDOR_HIDE_RULES[vendorSlug]) {
    const rules = VENDOR_HIDE_RULES[vendorSlug];
    if (rules.collections?.some(p => p.test(collection.trim()))) return true;
    if (title && rules.titlePatterns?.some(p => p.test(title))) return true;
    if (rules.tags?.some(p => tags.some(t => p.test(t.trim())))) return true;
  }
  return false;
}

type ViewTab = 'catalog' | 'history';

type SortOption = 'price_asc' | 'price_desc' | 'newest' | 'title_asc' | 'random';
type PageSize = 50 | 100 | 200;
const ALL_VENDORS_SLUG = '__all__';

const PRODUCT_SELECT_COLUMNS = 'id,vendor_slug,title,handle,collection,product_type,tags,price,compare_at_price,image_url,is_available,scraped_at';
const COLLECTION_BLOCK_LIST = '("dry-goods","drygoods","dry-good","freshwater-fish","freshwater-&-planted","freshwater-invert","aquatic-plant","frozen-food","aquarium","neptune-systems","aquarium-services","aquarium-supplies-and-accessories","aquariums-&-sumps","aquarium-furniture","aquariums,-tanks-and-bowls","aquarium-water","product","additives","food","fish-food","fish-&-coral-foods","shopkeep","reef-wear","water-care-and-testing","supplements-and-internal-health-supplies","skimmers,-reactors-&-filtration","salt-&-maintenance","cleaning-supplies","heaters-&-chillers","fragging-supplies","temperature-monitoring-and-control","auto-top-off","rock-&-sand","feeding-supplies","controllers-&-testing","panta-rhei","equipment","aquarium-supplies","supplements","testing","dosing","merch","apparel","fragging","salt","ro-di","lighting","nugget_giftcard","gift-card","gift-cards","gift-certificates","freshwater","pond","terrarium","reptile","medication","medications","fish-medication","fish-health","disease-treatment","treatments","ich-treatment","parasite-treatment","fish-treatments","shipping-upgrade","shipping-insurance","shipping-protection","shipping-fee","overnight-shipping","flat-rate-shipping","live-arrival","maintenance","water-maintenance","water-care","tank-maintenance","algae-control","algae-scrapers","cleaning","coral-food","reef-food","frozen-foods","live-food","dry-food","food-and-supplements")';

const COLLECTION_LABEL_MAP: Record<string, string> = {
  'acropora': 'Acropora',
  'acros-millis': 'Acropora / Millepora',
  'amazing-acropora': 'Acropora',
  'acropora-frags': 'Acropora Frags',
  'montipora': 'Montipora',
  'montipora-frags': 'Montipora Frags',
  'sps-corals': 'SPS',
  'sps': 'SPS',
  'sps-frags': 'SPS Frags',
  'sps-wysiwyg': 'WYSIWYG',
  'misc-collectable-sps': 'Collectable SPS',
  'lps': 'LPS',
  'lps-1': 'LPS',
  'lps-corals': 'LPS',
  'lps-frags': 'LPS Frags',
  'lps-wysiwyg': 'WYSIWYG',
  'zoanthids': 'Zoanthids',
  'zoanthid-corals-for-sale-at-reef-chasers-aquacultured-acclimated-wsiwyg': 'Zoanthids',
  'zoas-palys': 'Zoas & Palys',
  'palythoa': 'Palythoa',
  'mushrooms': 'Mushrooms',
  'soft-coral-mushrooms': 'Mushrooms',
  'mushrooms-and-ricordea': 'Mushrooms & Ricordea',
  'wysiwyg-mushrooms': 'WYSIWYG',
  'softies': 'Softies',
  'soft-corals': 'Soft Corals',
  'soft-coral': 'Soft Corals',
  'soft-corals-for-sale-at-reef-chasers-aquacultured-acclimated-wsiwyg': 'Soft Corals',
  'leather-corals': 'Leather Corals',
  'kenya-tree-cauliflower': 'Kenya Tree / Cauliflower',
  'star-polyps': 'Star Polyps',
  'pipe-organ': 'Pipe Organ',
  'euphyllia': 'Euphyllia',
  'euphyllia-1': 'Euphyllia',
  'ultra-euphyllia-and-elegance': 'Euphyllia & Elegance',
  'euphyllia-emporium-1': 'Euphyllia',
  'hammer-coral': 'Hammer Coral',
  'hammer-and-frogspawn': 'Hammer & Frogspawn',
  'hammer-corals': 'Hammer Corals',
  'torch-corals': 'Torch Corals',
  'torches': 'Torches',
  'frogspawn': 'Frogspawn',
  'elegance': 'Elegance',
  'chalices': 'Chalice',
  'chalice-corals': 'Chalice',
  'chalice': 'Chalice',
  'chalice-coral': 'Chalice',
  'chalice-frags': 'Chalice',
  'mycedium': 'Chalice',
  'oxypora': 'Chalice',
  'acanthastrea': 'Acanthastrea',
  'acanthastrea-wilsoni': 'Acanthastrea wilsoni',
  'acanthophyllia': 'Acanthophyllia',
  'micromussa': 'Micromussa',
  'micromussa-lord-acan': 'Micromussa / Lord Acan',
  'blastomussa': 'Blastomussa',
  'brain-coral': 'Brain Coral',
  'platygyra': 'Platygyra',
  'goniastrea': 'Goniastrea',
  'favites': 'Favites',
  'favia': 'Favia',
  'cyphastrea': 'Cyphastrea',
  'dipsastraea': 'Dipsastraea',
  'echinata': 'Echinata',
  'bowerbanki': 'Bowerbanki',
  'duncan-corals': 'Duncan Corals',
  'goniopora': 'Goniopora',
  'alveopora': 'Alveopora',
  'trachyphyllia': 'Trachyphyllia',
  'scolymia': 'Scolymia',
  'scolymia-and-cynarina': 'Scolymia & Cynarina',
  'cynarina': 'Cynarina',
  'wellsophyllia-and-lobophyllia': 'Wellsophyllia & Lobophyllia',
  'lobophyllia': 'Lobophyllia',
  'dendrophyllia': 'Dendrophyllia',
  'fungia': 'Fungia / Plate Coral',
  'plate-corals': 'Plate Corals',
  'bubble-corals': 'Bubble Corals',
  'fox-corals': 'Fox Corals',
  'hydnophora': 'Hydnophora',
  'galaxea': 'Galaxea',
  'leptastrea': 'Leptastrea',
  'leptastrea-1': 'Leptastrea',
  'leptoseris': 'Leptoseris',
  'pavona': 'Pavona',
  'psammacora': 'Psammocora',
  'pocillopora': 'Pocillopora',
  'stylophora': 'Stylophora',
  'stylocoeniella': 'Stylocoeniella',
  'birds-nest': 'Birdsnest',
  'porites': 'Porites',
  'tubastraea': 'Tubastraea',
  'pectinia': 'Pectinia',
  'turbinaria': 'Turbinaria',
  'meat-corals': 'Meat Corals',
  'euphylliidae': 'Euphylliidae',
  'ultra-encrusting-corals': 'Ultra Encrusting',
  'wysiwyg': 'WYSIWYG',
  'wysiwyg-coral': 'WYSIWYG',
  'wysiwyg-coral-colonies': 'WYSIWYG',
  'wysiwyg-corals': 'WYSIWYG',
  'wysiwyg-colony': 'WYSIWYG',
  'wysiwyg-colonies': 'WYSIWYG',
  'wysiwyg-sps': 'WYSIWYG',
  'wysiwyg-lps': 'WYSIWYG',
  'wysiwyg-softies': 'WYSIWYG',
  'wysiwyg-zoas': 'WYSIWYG',
  'wysiwyg-frags': 'WYSIWYG',
  'wizzi-wig': 'WYSIWYG',
  'all-corals': 'All Corals',
  'new-corals': 'New Arrivals',
  'fresh-cherries': 'Fresh Arrivals',
  'latest-arrivals': 'Latest Arrivals',
  'featured': 'Featured',
  'signature': 'Signature',
  'signature-battle-corals': 'Signature',
  'joes-gems': "Joe's Gems",
  'just-frags': 'Frags',
  'just-colonies': 'Colonies',
  'frag-packs': 'Frag Packs',
  'coral-frag-packs': 'Frag Packs',
  'battleboxes': 'Battle Boxes',
  'battlegrass': 'Battle Grass',
  'battlenems': 'Battle Nems',
  'anemones': 'Anemones',
  'anemone': 'Anemones',
  'anemones-for-sale-at-reef-chasers-aquacultured-acclimated-wsiwyg': 'Anemones',
  'bubble-tip-anemones': 'Bubble Tip Anemones',
  'ultra-rock-anemones': 'Rock Anemones',
  'inverts': 'Inverts / CUC',
  'inverts-clean-up-crews': 'Inverts / CUC',
  'invert': 'Inverts / CUC',
  'clean-up-crew': 'Inverts / CUC',
  'clean-up-crews': 'Inverts / CUC',
  'cuc': 'Inverts / CUC',
  'snails': 'Inverts / CUC',
  'crabs': 'Inverts / CUC',
  'shrimp': 'Inverts / CUC',
  'urchins': 'Inverts / CUC',
  'sea-urchins': 'Inverts / CUC',
  'hermit-crabs': 'Inverts / CUC',
  'starfish': 'Inverts / CUC',
  'sea-stars': 'Inverts / CUC',
  'feather-dusters': 'Inverts / CUC',
  'clams': 'Inverts / CUC',
  'clams-2': 'Inverts / CUC',
  'maxima-clams': 'Inverts / CUC',
  'tridacna-clams': 'Inverts / CUC',
  'gorgonians': 'Inverts / CUC',
  'sea-fans': 'Inverts / CUC',
  'sponges': 'Inverts / CUC',
  'nudibranchs': 'Inverts / CUC',
  'lobsters': 'Inverts / CUC',
  'octopus': 'Inverts / CUC',
  'saltwater-coral-for-sale': 'Coral',
  'wysiwyg-frags-for-reef-aquariums': 'WYSIWYG',
  'coral-colonies-for-reef-aquariums': 'Colonies',
  'polyps-and-shrooms-for-reef-aquariums': 'Polyps & Shrooms',
  'weekly-specials': 'Weekly Specials',
  'dr-macs-stash': "Dr. Mac's Stash",
  'pick-your-own-frag-pack': 'Pick-Your-Own Pack',
  'sps-coral-sale-at-reef-chasers-aquacultured-acclimated-wsiwyg': 'SPS',
  'coral-sale-at-reef-chasers-clearance-corals-wysiwg': 'Clearance',
  'doorbuster-deals': 'Doorbuster Deals',
  '15-dollar-frags': '$15 Frags',
  '25-dollar-frags': '$25 Frags',
  '35-dollar-frags': '$35 Frags',
  'auctions': 'Auctions',
  'auctions2': 'Auctions',
  'in-stock': 'In Stock',
  'premium-frags': 'Premium Frags',
  'coral': 'Coral',
  'fish': 'Fish',
  'saltwater-fish': 'Fish',
  'clownfish': 'Fish',
  'clownfish-1': 'Fish',
  'tangs': 'Fish',
  'wrasses': 'Fish',
  'gobies': 'Fish',
  'blennies': 'Fish',
  'damselfish': 'Fish',
  'damselfish-1': 'Fish',
  'anthias': 'Fish',
  'basslet': 'Fish',
  'cardinal-fish': 'Fish',
  'firefish': 'Fish',
  'hawkfish': 'Fish',
  'dottyback': 'Fish',
  'dragonets': 'Fish',
  'pygmy-angelfish': 'Fish',
  'nano-fish': 'Fish',
  'angelfish': 'Fish',
  'triggerfish': 'Fish',
  'lionfish': 'Fish',
  'pufferfish': 'Fish',
  'rabbitfish': 'Fish',
};

function getCollectionLabel(handle: string): string {
  if (COLLECTION_LABEL_MAP[handle]) return COLLECTION_LABEL_MAP[handle];
  if (/wysiwyg|wizzi.wig|wsiwyg|wysiwg/i.test(handle)) return 'WYSIWYG';
  if (/^chalice/i.test(handle)) return 'Chalice';
  if (/^invert|^cuc$|^clean.up|^shrimp|^snail|^crab|^clam|^urchin|^starfish|^sea.star|^hermit|^gorgon|^sponge|^nudibranch|^lobster|^octopus/i.test(handle)) return 'Inverts / CUC';
  return handle.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}


export default function VendorPricesPage() {
  const [vendors, setVendors] = useState<VendorScrapeConfig[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [filtered, setFiltered] = useState<VendorProduct[]>([]);
  const [displayed, setDisplayed] = useState<VendorProduct[]>([]);
  const [lastRun, setLastRun] = useState<VendorScrapeRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [hideSoldOut, setHideSoldOut] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(200);
  const [viewTab, setViewTab] = useState<ViewTab>('catalog');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [collectionOverflowOpen, setCollectionOverflowOpen] = useState(false);
  const [vendorOverflowOpen, setVendorOverflowOpen] = useState(false);

  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [totalDbCount, setTotalDbCount] = useState<number | null>(null);
  const [vendorLastRuns, setVendorLastRuns] = useState<Map<string, string | null>>(new Map());
  const [dbSearchResults, setDbSearchResults] = useState<VendorProduct[] | null>(null);
  const [isDbSearching, setIsDbSearching] = useState(false);

  const VENDOR_STALE_DAYS = 14;

  function isVendorStale(slug: string): boolean {
    if (!vendorLastRuns.has(slug)) return false;
    const last = vendorLastRuns.get(slug);
    if (!last) return true;
    const days = (Date.now() - new Date(last).getTime()) / 86400000;
    return days >= VENDOR_STALE_DAYS;
  }

  const isMountedRef = useRef(true);
  const scrapeAbortRef = useRef(false);
  const loadRequestIdRef = useRef(0);
  const shuffledProductsRef = useRef<VendorProduct[]>([]);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      scrapeAbortRef.current = true;
    };
  }, []);

  const MAX_VISIBLE_TABS = 6;
  const MAX_VISIBLE_VENDORS = 5;

  useEffect(() => {
    loadVendors();
    supabase
      .from('vendor_products')
      .select('*', { count: 'exact', head: true })
      .not('collection', 'in', COLLECTION_BLOCK_LIST)
      .then(({ count }) => {
        if (count !== null) setTotalDbCount(count);
      });
  }, []);

  useEffect(() => {
    scrapeAbortRef.current = true;
    setScraping(false);
    setScrapeError(null);
    if (selectedVendor && vendors.length > 0) {
      loadProducts(selectedVendor);
    }
  }, [selectedVendor, vendors]);

  async function loadVendors() {
    const { data } = await supabase
      .from('vendor_scrape_configs')
      .select('*')
      .eq('is_active', true);

    if (data && data.length > 0) {
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
      setVendors(sorted);
      if (!selectedVendor || selectedVendor === '') {
        setSelectedVendor(ALL_VENDORS_SLUG);
      }

      const since60d = new Date();
      since60d.setDate(since60d.getDate() - 60);
      const { data: runs } = await supabase
        .from('vendor_scrape_runs')
        .select('vendor_slug, completed_at')
        .eq('status', 'completed')
        .gte('completed_at', since60d.toISOString())
        .order('completed_at', { ascending: false });

      const lastRunMap = new Map<string, string | null>();
      for (const v of sorted) lastRunMap.set(v.slug, null);
      if (runs) {
        for (const run of runs) {
          if (!lastRunMap.has(run.vendor_slug)) continue;
          if (!lastRunMap.get(run.vendor_slug)) {
            lastRunMap.set(run.vendor_slug, run.completed_at);
          }
        }
      }
      setVendorLastRuns(lastRunMap);
    }
  }

  function buildBaseQuery(vendorSlug?: string) {
    let q = supabase
      .from('vendor_products')
      .select(PRODUCT_SELECT_COLUMNS)
      .not('collection', 'in', COLLECTION_BLOCK_LIST);
    if (vendorSlug) q = q.eq('vendor_slug', vendorSlug);
    return q;
  }

  async function fetchAllProducts(vendorSlug: string): Promise<VendorProduct[]> {
    const CHUNK = 1000;
    let all: VendorProduct[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await buildBaseQuery(vendorSlug)
        .order('scraped_at', { ascending: false })
        .range(from, from + CHUNK - 1);
      if (error || !data || data.length === 0) break;
      all = all.concat(data as VendorProduct[]);
      if (data.length < CHUNK) break;
      from += CHUNK;
    }
    return all;
  }

  async function fetchAllVendorsPage(): Promise<VendorProduct[]> {
    const { data } = await buildBaseQuery()
      .order('is_available', { ascending: false })
      .order('scraped_at', { ascending: false })
      .limit(1200);
    return (data as VendorProduct[]) ?? [];
  }

  async function loadProducts(vendorSlug: string) {
    const requestId = ++loadRequestIdRef.current;
    setLoading(true);
    setProducts([]);
    setSelectedCollection('all');
    setSelectedTags(new Set());
    setCollectionOverflowOpen(false);
    if (vendorSlug !== ALL_VENDORS_SLUG) {
      setSortBy('newest');
      shuffledProductsRef.current = [];
    }

    try {
      if (vendorSlug === ALL_VENDORS_SLUG) {
        setSortBy('random');
        const data = await fetchAllVendorsPage();
        for (let i = data.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [data[i], data[j]] = [data[j], data[i]];
        }
        shuffledProductsRef.current = data;
        if (isMountedRef.current && requestId === loadRequestIdRef.current) {
          setProducts(data);
          setLastRun(null);
        }
        return;
      }

      const [runRes, firstChunk] = await Promise.all([
        supabase
          .from('vendor_scrape_runs')
          .select('*')
          .eq('vendor_slug', vendorSlug)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        buildBaseQuery(vendorSlug)
          .order('scraped_at', { ascending: false })
          .range(0, 4999),
      ]);

      const firstBatch = (firstChunk.data as VendorProduct[]) ?? [];

      if (isMountedRef.current && requestId === loadRequestIdRef.current) {
        setProducts(firstBatch);
        setLastRun(runRes.data);
        setLoading(false);
      }

      if (firstBatch.length >= 1000) {
        const rest = await fetchAllProducts(vendorSlug);
        if (isMountedRef.current && requestId === loadRequestIdRef.current) {
          setProducts(rest);
        }
      }
    } catch (err) {
      if (isMountedRef.current && requestId === loadRequestIdRef.current) {
        setScrapeError(err instanceof Error ? err.message : 'Failed to load products');
        setLoading(false);
      }
    } finally {
      if (isMountedRef.current && requestId === loadRequestIdRef.current) {
        setLoading(false);
      }
    }
  }

  const visibleProducts = useMemo(
    () => products.filter(p => !shouldHideProduct(p.tags, p.collection, p.title, p.product_type, p.vendor_slug)),
    [products]
  );

  const collectionTabs = useMemo(() => {
    const labelToHandles: Record<string, string[]> = {};
    const labelCounts: Record<string, number> = {};
    for (const p of visibleProducts) {
      const label = getCollectionLabel(p.collection);
      if (!labelToHandles[label]) labelToHandles[label] = [];
      if (!labelToHandles[label].includes(p.collection)) labelToHandles[label].push(p.collection);
      labelCounts[label] = (labelCounts[label] ?? 0) + 1;
    }
    return Object.entries(labelCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, handles: labelToHandles[label], count }));
  }, [visibleProducts]);

  useEffect(() => {
    if (selectedVendor !== ALL_VENDORS_SLUG || !search.trim()) {
      setDbSearchResults(null);
      setIsDbSearching(false);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      return;
    }
    setIsDbSearching(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      const q = search.trim();
      const { data } = await supabase
        .from('vendor_products')
        .select(PRODUCT_SELECT_COLUMNS)
        .not('collection', 'in', COLLECTION_BLOCK_LIST)
        .or(`title.ilike.%${q}%,collection.ilike.%${q}%`)
        .order('scraped_at', { ascending: false })
        .limit(1000);
      if (isMountedRef.current) {
        setDbSearchResults((data as VendorProduct[]) ?? []);
        setIsDbSearching(false);
      }
    }, 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search, selectedVendor]);

  const applyFilters = useCallback(() => {
    const isAllVendorSearch = selectedVendor === ALL_VENDORS_SLUG && search.trim() && dbSearchResults !== null;
    const base = isAllVendorSearch
      ? dbSearchResults
      : (sortBy === 'random' && shuffledProductsRef.current.length > 0
        ? shuffledProductsRef.current
        : products);
    let result = base.filter(p => !shouldHideProduct(p.tags, p.collection, p.title, p.product_type, p.vendor_slug));

    if (selectedCollection !== 'all') {
      const tab = collectionTabs.find(t => t.label === selectedCollection);
      const handles = tab?.handles ?? [selectedCollection];
      result = result.filter(p => handles.includes(p.collection));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.collection.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (selectedTags.size > 0) {
      const smallBase = selectedCollection !== 'all'
        ? (() => {
            const tab = collectionTabs.find(t => t.label === selectedCollection);
            const handles = tab?.handles ?? [selectedCollection];
            return visibleProducts.filter(p => handles.includes(p.collection));
          })()
        : visibleProducts;
      const smallLabels = getSmallTagLabels(smallBase);
      result = result.filter(p =>
        [...selectedTags].every(tag => {
          if (tag === 'Other') {
            return smallLabels.size > 0 && [...smallLabels].some(sl => productMatchesTagFilter(p, sl));
          }
          return productMatchesTagFilter(p, tag);
        })
      );
    }
    if (priceMin) result = result.filter(p => p.price >= parseFloat(priceMin));
    if (priceMax) result = result.filter(p => p.price <= parseFloat(priceMax));
    if (onSaleOnly) result = result.filter(p => p.compare_at_price && p.compare_at_price > p.price);
    if (hideSoldOut) result = result.filter(p => p.is_available);

    if (sortBy !== 'random') {
      result.sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
        return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
      });
    }

    setFiltered(result);
    setPage(1);
  }, [products, search, selectedCollection, sortBy, priceMin, priceMax, onSaleOnly, hideSoldOut, collectionTabs, selectedTags, dbSearchResults, selectedVendor, visibleProducts]);

  useEffect(() => { applyFilters(); }, [applyFilters]);
  useEffect(() => { setPage(1); }, [pageSize]);
  useEffect(() => { setDisplayed(filtered.slice(0, page * pageSize)); }, [filtered, page, pageSize]);

  async function handleScrape() {
    if (!selectedVendor || selectedVendor === ALL_VENDORS_SLUG) return;
    scrapeAbortRef.current = false;
    setScraping(true);
    setScrapeError(null);
    const targetVendor = selectedVendor;
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-vendor-prices`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vendor_slug: targetVendor, include_fish: true, force: true }),
      });
      const data = await res.json();
      if (!data.success) {
        if (isMountedRef.current) setScrapeError(data.error ?? 'Scrape failed');
        if (isMountedRef.current) setScraping(false);
        return;
      }

      const POLL_INTERVAL = 3000;
      const MAX_WAIT_MS = 10 * 60 * 1000;
      const STUCK_THRESHOLD_MS = 8 * 60 * 1000;
      const startTime = Date.now();

      while (!scrapeAbortRef.current) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL));
        if (scrapeAbortRef.current) break;

        const elapsed = Date.now() - startTime;
        if (elapsed > MAX_WAIT_MS) {
          if (isMountedRef.current) setScrapeError('Scrape timed out. The store may have too many products. Try again later.');
          break;
        }

        try {
          const { data: runData } = await supabase
            .from('vendor_scrape_runs')
            .select('status, error_message, started_at')
            .eq('vendor_slug', targetVendor)
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!runData) continue;

          if (runData.status === 'completed') {
            if (isMountedRef.current) await loadProducts(targetVendor);
            break;
          } else if (runData.status === 'failed') {
            if (isMountedRef.current) setScrapeError(runData.error_message ?? 'Scrape failed');
            break;
          } else if (runData.status === 'running') {
            const runAge = Date.now() - new Date(runData.started_at).getTime();
            if (runAge > STUCK_THRESHOLD_MS) {
              if (isMountedRef.current) await loadProducts(targetVendor);
              break;
            }
          }
        } catch {
          // ignore individual poll errors
        }
      }
    } catch (err) {
      if (isMountedRef.current) setScrapeError(err instanceof Error ? err.message : 'Unknown error');
    }
    if (isMountedRef.current) setScraping(false);
  }

  function clearFilters() {
    setSearch('');
    setSelectedCollection('all');
    setPriceMin('');
    setPriceMax('');
    setOnSaleOnly(false);
    setHideSoldOut(false);
    setSortBy('newest');
    setSelectedTags(new Set());
  }

  function toggleTag(label: string) {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  const hasActiveFilters = search || selectedCollection !== 'all' || priceMin || priceMax || onSaleOnly || hideSoldOut || selectedTags.size > 0;

  const formatDate = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const currentVendor = vendors.find(v => v.slug === selectedVendor);

  const collectionFilteredProducts = useMemo(() => {
    if (selectedCollection !== 'all') {
      const tab = collectionTabs.find(t => t.label === selectedCollection);
      const handles = tab?.handles ?? [selectedCollection];
      return visibleProducts.filter(p => handles.includes(p.collection));
    }
    return visibleProducts;
  }, [visibleProducts, selectedCollection, collectionTabs]);

  const tagOptions = useMemo(
    () => buildTagFilterOptions(collectionFilteredProducts),
    [collectionFilteredProducts]
  );

  const catalogCount = visibleProducts.length;

  const TAG_COLOR_CLASSES: Record<NormalizedTag['color'], { base: string; active: string }> = {
    cyan:    { base: 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-400 dark:hover:border-cyan-700/60',    active: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-400 dark:border-cyan-600' },
    teal:    { base: 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:border-teal-400 dark:hover:border-teal-700/60',    active: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-400 dark:border-teal-600' },
    amber:   { base: 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:border-amber-400 dark:hover:border-amber-700/60',  active: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-400 dark:border-amber-600' },
    rose:    { base: 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-400 dark:hover:border-rose-700/60',    active: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-400 dark:border-rose-600' },
    slate:   { base: 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500',        active: 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-400 dark:border-slate-500' },
    emerald: { base: 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:border-emerald-400 dark:hover:border-emerald-700/60', active: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600' },
    sky:     { base: 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 hover:border-sky-400 dark:hover:border-sky-700/60',      active: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-sky-400 dark:border-sky-600' },
    orange:  { base: 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-300 hover:border-orange-400 dark:hover:border-orange-700/60', active: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-400 dark:border-orange-600' },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vendor Prices</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Real-time retail prices scraped from {vendors.length} online coral stores
          </p>
        </div>
      </div>

      <DailyUpdatesBanner />

      {vendors.length === 0 ? (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">Loading vendors...</div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {/* Mobile: dropdown */}
            <div className="sm:hidden flex items-center gap-2">
              <div className="relative flex-1">
                <button
                  onClick={() => setVendorDropdownOpen(o => !o)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Store size={14} className="text-slate-500 dark:text-slate-400 shrink-0" />
                    {selectedVendor === ALL_VENDORS_SLUG
                      ? 'All Vendors'
                      : vendors.find(v => v.slug === selectedVendor)?.name ?? 'Select Vendor'}
                  </span>
                  <ChevronDown size={14} className={`text-slate-500 dark:text-slate-400 transition-transform ${vendorDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {vendorDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden z-30 shadow-xl">
                    <button
                      onClick={() => { setSelectedVendor(ALL_VENDORS_SLUG); setVendorDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        selectedVendor === ALL_VENDORS_SLUG
                          ? 'bg-teal-100 dark:bg-teal-600/20 text-teal-700 dark:text-teal-400 font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      All Vendors
                    </button>
                    {vendors.map(v => {
                      const stale = isVendorStale(v.slug);
                      return (
                        <button
                          key={v.slug}
                          onClick={() => { setSelectedVendor(v.slug); setVendorDropdownOpen(false); }}
                          className={`w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
                            selectedVendor === v.slug
                              ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 font-medium'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {v.name}
                          {stale && (
                            <span className="text-amber-500 text-xs font-medium whitespace-nowrap">Stale</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {selectedVendor !== ALL_VENDORS_SLUG && (
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shrink-0">
                  <button
                    onClick={() => setViewTab('catalog')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      viewTab === 'catalog' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ShoppingBag size={12} />
                    Prices
                  </button>
                  <button
                    onClick={() => setViewTab('history')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      viewTab === 'history' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <BarChart2 size={12} />
                    History
                  </button>
                </div>
              )}
            </div>

            {/* Desktop: pill tabs */}
            <div className="hidden sm:flex items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedVendor(ALL_VENDORS_SLUG)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedVendor === ALL_VENDORS_SLUG
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All Vendors
                </button>
                {vendors.slice(0, MAX_VISIBLE_VENDORS).map(v => {
                  const stale = isVendorStale(v.slug);
                  return (
                    <button
                      key={v.slug}
                      onClick={() => setSelectedVendor(v.slug)}
                      title={stale ? `No successful scrape in ${VENDOR_STALE_DAYS}+ days` : undefined}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        selectedVendor === v.slug
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {v.name}
                      {stale && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            selectedVendor === v.slug ? 'bg-amber-300' : 'bg-amber-400'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
                {vendors.length > MAX_VISIBLE_VENDORS && (() => {
                  const overflowVendors = vendors.slice(MAX_VISIBLE_VENDORS);
                  const overflowActive = overflowVendors.some(v => v.slug === selectedVendor);
                  return (
                    <div className="relative">
                      <button
                        onClick={() => setVendorOverflowOpen(o => !o)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          overflowActive
                            ? 'bg-cyan-500 text-white'
                            : vendorOverflowOpen
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <MoreHorizontal size={14} />
                        {overflowActive
                          ? vendors.find(v => v.slug === selectedVendor)?.name
                          : `${overflowVendors.length} more`}
                        <ChevronDown size={12} className={`transition-transform ${vendorOverflowOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {vendorOverflowOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden z-30 shadow-xl min-w-48">
                          {overflowVendors.map(v => {
                            const stale = isVendorStale(v.slug);
                            return (
                              <button
                                key={v.slug}
                                onClick={() => { setSelectedVendor(v.slug); setVendorOverflowOpen(false); }}
                                className={`w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
                                  selectedVendor === v.slug
                                    ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-medium'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                              >
                                {v.name}
                                {stale && (
                                  <span className="text-amber-500 text-xs font-medium whitespace-nowrap">Stale</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              {selectedVendor !== ALL_VENDORS_SLUG && (
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 w-fit shrink-0">
                  <button
                    onClick={() => setViewTab('catalog')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      viewTab === 'catalog' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ShoppingBag size={14} />
                    Prices
                  </button>
                  <button
                    onClick={() => setViewTab('history')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      viewTab === 'history' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <BarChart2 size={14} />
                    Price History
                  </button>
                </div>
              )}
            </div>
          </div>


          {selectedVendor !== ALL_VENDORS_SLUG && isVendorStale(selectedVendor) && !scraping && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3.5">
              <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-amber-700 dark:text-amber-400 text-sm font-medium">Price data may be outdated</p>
                <p className="text-amber-600/70 dark:text-amber-500/70 text-xs mt-0.5">
                  This vendor has not had a successful price scrape in {VENDOR_STALE_DAYS}+ days. The catalog shown may not reflect current inventory or pricing.
                </p>
              </div>
              <button
                onClick={handleScrape}
                className="shrink-0 bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Fetch Now
              </button>
            </div>
          )}

          {scraping && currentVendor && (
            <ScrapeProgressBar
              vendorSlug={selectedVendor}
              vendorName={currentVendor.name}
            />
          )}

          {scrapeError && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={15} className="text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{scrapeError}</p>
            </div>
          )}

          {!loading && products.length === 0 && !scraping && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center transition-colors duration-200">
              <Store size={36} className="mx-auto mb-3 text-slate-400 dark:text-slate-600" />
              <p className="text-slate-900 dark:text-white font-semibold mb-1">No price data yet</p>
              {selectedVendor === ALL_VENDORS_SLUG ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                  Select a vendor and click "Fetch Prices" to populate the catalog.
                </p>
              ) : (
                <>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    Click "Fetch Prices" to scrape the latest prices from {currentVendor?.name}.
                  </p>
                  <button
                    onClick={handleScrape}
                    className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all"
                  >
                    Fetch Prices Now
                  </button>
                </>
              )}
            </div>
          )}


          {viewTab === 'history' && currentVendor && products.length > 0 && selectedVendor !== ALL_VENDORS_SLUG && (
            <PriceChangesPanel vendor={currentVendor} />
          )}

          {(viewTab === 'catalog' || selectedVendor === ALL_VENDORS_SLUG) && products.length > 0 && (
            <>
              {collectionTabs.length > 1 && (() => {
                const visibleTabs = collectionTabs.slice(0, MAX_VISIBLE_TABS);
                const overflowTabs = collectionTabs.slice(MAX_VISIBLE_TABS);
                const overflowActive = overflowTabs.some(t => t.label === selectedCollection);
                return (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedCollection('all')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                        selectedCollection === 'all'
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600'
                          : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      All
                      <span className={`text-xs font-normal ${selectedCollection === 'all' ? 'opacity-80' : 'opacity-50'}`}>
                        {catalogCount.toLocaleString()}
                      </span>
                    </button>
                    {visibleTabs.map(({ label, count }) => (
                      <button
                        key={label}
                        onClick={() => setSelectedCollection(label)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                          selectedCollection === label
                            ? 'bg-cyan-600/25 text-cyan-500 dark:text-cyan-300 border-cyan-600'
                            : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-400 dark:hover:border-cyan-700/60'
                        }`}
                      >
                        {label}
                        <span className={`text-xs font-normal ${selectedCollection === label ? 'opacity-80' : 'opacity-50'}`}>
                          {count}
                        </span>
                      </button>
                    ))}
                    {overflowTabs.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setCollectionOverflowOpen(o => !o)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                            overflowActive
                              ? 'bg-cyan-600/25 text-cyan-500 dark:text-cyan-300 border-cyan-600'
                              : collectionOverflowOpen
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600'
                                : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600'
                          }`}
                        >
                          <MoreHorizontal size={14} />
                          {overflowActive
                            ? collectionTabs.find(t => t.label === selectedCollection)?.label
                            : `${overflowTabs.length} more`}
                          <ChevronDown size={12} className={`transition-transform ${collectionOverflowOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {collectionOverflowOpen && (
                          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden z-30 shadow-xl min-w-40">
                            {overflowTabs.map(({ label, count }) => (
                              <button
                                key={label}
                                onClick={() => { setSelectedCollection(label); setCollectionOverflowOpen(false); }}
                                className={`w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
                                  selectedCollection === label
                                    ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-medium'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                              >
                                {label}
                                <span className="text-xs opacity-50">{count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, collection, or tag..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setHideSoldOut(s => !s)}
                  className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                    hideSoldOut
                      ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20'
                      : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <EyeOff size={15} />
                  <span className="hidden sm:inline">Hide Sold</span>
                  {hideSoldOut && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />}
                </button>
                <button
                  onClick={() => setShowFilters(s => !s)}
                  className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    showFilters || hasActiveFilters
                      ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20'
                      : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <SlidersHorizontal size={15} />
                  Filter
                  {hasActiveFilters && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />}
                </button>
                {selectedVendor !== ALL_VENDORS_SLUG && currentVendor && (
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shrink-0 transition-colors duration-200">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                      {lastRun?.completed_at && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {formatDate(lastRun.completed_at)}
                        </span>
                      )}
                      {products.length > 0 && (
                        <span className="text-slate-400 dark:text-slate-600">{products.length.toLocaleString()} products</span>
                      )}
                    </div>
                    <button
                      onClick={handleScrape}
                      disabled={scraping}
                      className="shrink-0 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 disabled:opacity-50 text-white font-semibold px-3 py-1 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-xs"
                    >
                      <RefreshCw size={12} className={scraping ? 'animate-spin' : ''} />
                      {scraping ? 'Scraping...' : 'Fetch Prices'}
                    </button>
                  </div>
                )}
              </div>

              {showFilters && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4 transition-colors duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Price Range</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={priceMin}
                          onChange={e => setPriceMin(e.target.value)}
                          placeholder="Min $"
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-slate-400 dark:text-slate-500 text-sm">–</span>
                        <input
                          type="number"
                          value={priceMax}
                          onChange={e => setPriceMax(e.target.value)}
                          placeholder="Max $"
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Sort By</label>
                      <div className="relative">
                        <select
                          value={sortBy}
                          onChange={e => setSortBy(e.target.value as SortOption)}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500 appearance-none pr-8"
                        >
                          <option value="random">Random</option>
                          <option value="newest">Newest First</option>
                          <option value="price_asc">Price: Low to High</option>
                          <option value="price_desc">Price: High to Low</option>
                          <option value="title_asc">Name A–Z</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {tagOptions.length > 0 && (
                    <div>
                      <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
                        <Tag size={11} />
                        Filter by Tag
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {tagOptions.map(({ label, color, count }) => {
                          const isActive = selectedTags.has(label);
                          const classes = TAG_COLOR_CLASSES[color];
                          return (
                            <button
                              key={label}
                              onClick={() => toggleTag(label)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all duration-150 ${
                                isActive ? classes.active : classes.base
                              }`}
                            >
                              {label}
                              <span className="opacity-60 font-normal">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => setOnSaleOnly(s => !s)}
                          className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${onSaleOnly ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                          <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform m-[3px] ${onSaleOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <TrendingDown size={13} className="text-red-400" />
                          On sale only
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => setHideSoldOut(s => !s)}
                          className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${hideSoldOut ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                          <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform m-[3px] ${hideSoldOut ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">Hide sold out</span>
                      </label>
                    </div>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1">
                        <X size={12} /> Clear all filters
                      </button>
                    )}
                  </div>
                </div>
              )}

              {selectedTags.size > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1"><Tag size={11} /> Tags:</span>
                  {[...selectedTags].map(label => {
                    const opt = tagOptions.find(t => t.label === label);
                    const color = opt?.color ?? 'slate';
                    const classes = TAG_COLOR_CLASSES[color];
                    return (
                      <button
                        key={label}
                        onClick={() => toggleTag(label)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-medium transition-all ${classes.active}`}
                      >
                        {label}
                        <X size={10} />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  {isDbSearching
                    ? <><RefreshCw size={12} className="animate-spin" /> Searching all vendors...</>
                    : <>
                        {selectedVendor === ALL_VENDORS_SLUG && !hasActiveFilters && totalDbCount !== null
                          ? `${totalDbCount.toLocaleString()} products`
                          : `${filtered.length.toLocaleString()} products`}
                        {hasActiveFilters && <span className="text-slate-400 dark:text-slate-500"> (filtered)</span>}
                      </>
                  }
                </span>
                <div className="flex items-center gap-2">
                  {!(selectedVendor === ALL_VENDORS_SLUG && !hasActiveFilters) && (
                    <span className="text-slate-400 dark:text-slate-500 text-xs hidden sm:inline">
                      {selectedVendor === ALL_VENDORS_SLUG && totalDbCount !== null
                        ? `${totalDbCount.toLocaleString()} total in catalog`
                        : `${catalogCount.toLocaleString()} total in catalog`}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 transition-colors duration-200">
                    {([50, 100, 200] as PageSize[]).map(size => (
                      <button
                        key={size}
                        onClick={() => setPageSize(size)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          pageSize === size
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden animate-pulse transition-colors duration-200">
                      <div className="aspect-square bg-slate-100 dark:bg-slate-800" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded" />
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayed.length === 0 ? (
                <div className="text-center py-16">
                  <Search size={32} className="mx-auto mb-3 text-slate-400 dark:text-slate-600" />
                  <p className="text-slate-500 dark:text-slate-400">No products match your filters</p>
                  <button onClick={clearFilters} className="mt-3 text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
                    Clear filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {displayed.map(product => {
                      const vendorCfg = vendors.find(v => v.slug === product.vendor_slug);
                      return (
                        <VendorProductCard
                          key={product.id}
                          product={product}
                          vendorBaseUrl={vendorCfg?.public_url ?? vendorCfg?.base_url ?? currentVendor?.public_url ?? currentVendor?.base_url ?? ''}
                          vendorName={vendorCfg?.name}
                          showVendorBadge={selectedVendor === ALL_VENDORS_SLUG}
                          vendorSlug={product.vendor_slug}
                        />
                      );
                    })}
                  </div>
                  {displayed.length < filtered.length && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => setPage(p => p + 1)}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-8 py-3 rounded-xl transition-colors text-sm font-medium"
                      >
                        Load more ({filtered.length - displayed.length} remaining)
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      <ImageCacheProgressBanner />

      <footer className="border-t border-slate-200 dark:border-slate-800 pt-5 mt-2 transition-colors duration-200">
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          Product listings, prices, and images displayed on this page are sourced from publicly accessible online coral vendors for informational and price-comparison purposes only. FragX does not claim ownership of any vendor product data, product images, or trademarks. All content remains the property of the respective vendors.{' '}
          <button
            onClick={() => setShowDisclaimer(true)}
            className="text-cyan-600 dark:text-cyan-400 hover:underline transition-colors"
          >
            Full Disclaimer
          </button>
        </p>
      </footer>

      {showDisclaimer && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowDisclaimer(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <Shield size={16} className="text-slate-500 dark:text-slate-400" />
                <h2 className="font-semibold text-slate-900 dark:text-white text-base">Disclaimer</h2>
              </div>
              <button
                onClick={() => setShowDisclaimer(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <section>
                <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-2">Informational Use Only</h3>
                <p>
                  FragX is an independent price-comparison and community tool for reef aquarium hobbyists. All vendor product listings, pricing data, and product images displayed on this site are retrieved from publicly accessible endpoints on vendor websites solely for informational and non-commercial price-comparison purposes.
                </p>
              </section>
              <section>
                <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-2">No Ownership Claimed</h3>
                <p>
                  FragX does not claim ownership of any product data, product descriptions, pricing information, product images, brand names, or trademarks belonging to any vendor. All such content remains the sole property of the respective vendors and is reproduced here solely as a reference for users comparing prices across stores.
                </p>
              </section>
              <section>
                <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-2">No Affiliation or Endorsement</h3>
                <p>
                  FragX is not affiliated with, endorsed by, sponsored by, or in any way officially connected to any of the vendors listed on this site. Vendor names, logos, and product images are the property of their respective owners. The appearance of a vendor on this site does not imply any partnership or endorsement.
                </p>
              </section>
              <section>
                <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-2">Accuracy and Availability</h3>
                <p>
                  Price data is updated periodically and may not reflect current pricing. Products shown as available may have since sold out. FragX makes no warranties, express or implied, regarding the completeness, accuracy, timeliness, or availability of any listed product or price. Always verify current pricing and availability directly with the vendor before making a purchasing decision.
                </p>
              </section>
              <section>
                <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-2">Image Usage</h3>
                <p>
                  Product images are sourced from vendor websites and are the property of their respective owners. FragX temporarily caches images solely to improve page load performance for users and does not use vendor images for any commercial or promotional purpose. If you are a vendor and wish to have your content removed, please contact us.
                </p>
              </section>
              <section>
                <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-2">Limitation of Liability</h3>
                <p>
                  FragX shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of or reliance on information provided on this site, including but not limited to purchasing decisions made based on displayed prices or availability.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
