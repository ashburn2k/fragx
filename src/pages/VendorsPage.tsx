import { ExternalLink, ShoppingCart, BarChart2 } from 'lucide-react';

interface Vendor {
  name: string;
  domain: string;
  url: string;
  description: string;
}

const ALL_VENDORS: Vendor[] = [
  {
    name: 'Battle Corals',
    domain: 'battlecorals.com',
    url: 'https://battlecorals.com',
    description: 'Known for SPS frags, Acropora, and high-color morphs at volume pricing',
  },
  {
    name: 'Biota Marine Life',
    domain: 'biotamarinelife.com',
    url: 'https://biotamarinelife.com',
    description: 'Captive-bred marine life specialists focused on sustainable aquaculture',
  },
  {
    name: 'Cherry Corals',
    domain: 'cherrycorals.com',
    url: 'https://cherrycorals.com',
    description: 'Hand-picked high-end euphyllia, SPS, and rare show pieces',
  },
  {
    name: 'Coral Finder',
    domain: 'coralfinder.com',
    url: 'https://coralfinder.com',
    description: 'Aggregator for finding named coral morphs across multiple vendor listings',
  },
  {
    name: 'Cornbred Corals',
    domain: 'cornbredcorals.com',
    url: 'https://cornbredcorals.com',
    description: 'Named morphs, designer clownfish, and high-end collector pieces',
  },
  {
    name: 'Cultivated Reef',
    domain: 'cultivatedreef.com',
    url: 'https://cultivatedreef.com',
    description: 'Boutique online store focused on aquacultured premium specimens',
  },
  {
    name: 'Fragbox Corals',
    domain: 'fragboxcorals.com',
    url: 'https://fragboxcorals.com',
    description: 'Curated frag packs and specialty corals with transparent pricing',
  },
  {
    name: 'LiveAquaria',
    domain: 'liveaquaria.com',
    url: 'https://liveaquaria.com',
    description: 'One of the oldest and most trusted online marine livestock retailers',
  },
  {
    name: 'ORA (Oceans Reefs & Aquariums)',
    domain: 'orafarm.com',
    url: 'https://orafarm.com',
    description: 'Leading aquaculture farm producing captive-bred fish and aquacultured corals',
  },
  {
    name: 'Pacific East Aquaculture',
    domain: 'pacificeastaquaculture.com',
    url: 'https://pacificeastaquaculture.com',
    description: 'Veteran aquaculture facility offering rare SPS and time-tested coral strains',
  },
  {
    name: 'Reef Builders Store',
    domain: 'store.reefbuilders.com',
    url: 'https://store.reefbuilders.com',
    description: 'Premium frags and equipment from the iconic reef media brand',
  },
  {
    name: 'Reef Chasers',
    domain: 'reefchasers.com',
    url: 'https://reefchasers.com',
    description: 'Popular vendor for zoanthids, palys, and reef staples with fast shipping',
  },
  {
    name: 'Reef Raft USA',
    domain: 'reefraftusa.com',
    url: 'https://reefraftusa.com',
    description: 'US arm of Australian coral powerhouse known for ultra-rare SPS and WYSIWYG',
  },
  {
    name: 'Reef2Reef Classifieds',
    domain: 'reef2reef.com',
    url: 'https://reef2reef.com/ams',
    description: "The reef hobby's largest forum with active buy/sell/trade classifieds",
  },
  {
    name: 'Saltwaterfish.com',
    domain: 'saltwaterfish.com',
    url: 'https://saltwaterfish.com',
    description: 'Wide selection of saltwater fish and corals with stock availability tracking',
  },
  {
    name: 'Tidal Gardens',
    domain: 'tidalgardens.com',
    url: 'https://tidalgardens.com',
    description: 'Long-running aquaculture operation with educational content and healthy frags',
  },
  {
    name: 'Top Shelf Aquatics',
    domain: 'topshelfaquatics.com',
    url: 'https://topshelfaquatics.com',
    description: 'Premium SPS, LPS, and WYSIWYG corals with a wide rotating live catalog',
  },
  {
    name: 'Unique Corals',
    domain: 'uniquecorals.com',
    url: 'https://uniquecorals.com',
    description: 'Collector-grade SPS and LPS with exceptional photography and curation',
  },
  {
    name: 'Vivid Aquariums',
    domain: 'vividaquariums.com',
    url: 'https://vividaquariums.com',
    description: 'Large catalog of corals and fish with competitive pricing and frequent sales',
  },
  {
    name: 'World Wide Corals',
    domain: 'worldwidecorals.com',
    url: 'https://worldwidecorals.com',
    description: 'Industry-leading reef vendor with massive live catalog and weekly drops',
  },
].sort((a, b) => a.name.localeCompare(b.name));

function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <a
      href={vendor.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="text-slate-900 dark:text-white font-semibold text-sm leading-snug group-hover:text-cyan-300 transition-colors truncate">
            {vendor.name}
          </h3>
          <span className="text-slate-400 dark:text-slate-500 text-xs">{vendor.domain}</span>
        </div>
        <ExternalLink
          size={14}
          className="shrink-0 text-slate-400 dark:text-slate-600 group-hover:text-cyan-400 transition-colors mt-0.5"
        />
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-2">{vendor.description}</p>
    </a>
  );
}

interface VendorsPageProps {
  onViewPrices?: (page: string) => void;
}

export default function VendorsPage({ onViewPrices }: VendorsPageProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Online Vendors</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Curated list of {ALL_VENDORS.length} trusted online coral stores, sorted A–Z
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onViewPrices && (
            <button
              onClick={() => onViewPrices('vendor-prices')}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200"
            >
              <BarChart2 size={14} />
              View Live Prices
            </button>
          )}
          <div className="shrink-0 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
            <ShoppingCart size={14} className="text-cyan-400" />
            <span className="text-slate-900 dark:text-white text-sm font-semibold">{ALL_VENDORS.length}</span>
            <span className="text-slate-500 dark:text-slate-400 text-xs">vendors</span>
          </div>
        </div>
      </div>

      <div className="bg-white/90 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        All links open the vendor's website in a new tab. FragX is not affiliated with any of these stores.
        Always verify shipping policies and livestock guarantees before purchasing.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ALL_VENDORS.map(vendor => (
          <VendorCard key={vendor.domain} vendor={vendor} />
        ))}
      </div>
    </div>
  );
}
