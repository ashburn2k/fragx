import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { supabase, CoralSpecies, CoralMorph, ListingType, CareDifficulty } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface CreateListingProps {
  onBack: () => void;
}

export default function CreateListing({ onBack }: CreateListingProps) {
  const { user, profile } = useAuth();
  const [species, setSpecies] = useState<CoralSpecies[]>([]);
  const [morphs, setMorphs] = useState<CoralMorph[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);

  const [form, setForm] = useState({
    title: '',
    description: '',
    species_id: '',
    morph_id: '',
    listing_type: 'sale' as ListingType,
    asking_price: '',
    trade_for: '',
    frag_size: '',
    care_difficulty: '' as CareDifficulty | '',
    light_requirement: '',
    flow_requirement: '',
    is_shipping_available: true,
    is_local_pickup: true,
    location_city: profile?.location_city ?? '',
    location_state: profile?.location_state ?? '',
    is_wysiwyg: false,
    is_aquacultured: false,
    is_beginner_friendly: false,
  });

  useEffect(() => {
    supabase.from('coral_species').select('*').order('genus').then(({ data }) => setSpecies(data ?? []));
  }, []);

  useEffect(() => {
    if (form.species_id) {
      supabase.from('coral_morphs').select('*').eq('species_id', form.species_id).then(({ data }) => setMorphs(data ?? []));
    } else {
      setMorphs([]);
      setForm(f => ({ ...f, morph_id: '' }));
    }
  }, [form.species_id]);

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    setLoading(true);

    const { data: listing, error } = await supabase.from('listings').insert({
      seller_id: user.id,
      title: form.title,
      description: form.description || null,
      species_id: form.species_id || null,
      morph_id: form.morph_id || null,
      listing_type: form.listing_type,
      asking_price: form.asking_price ? parseFloat(form.asking_price) : null,
      trade_for: form.trade_for || null,
      frag_size: form.frag_size || null,
      care_difficulty: form.care_difficulty || null,
      light_requirement: form.light_requirement || null,
      flow_requirement: form.flow_requirement || null,
      is_shipping_available: form.is_shipping_available,
      is_local_pickup: form.is_local_pickup,
      location_city: form.location_city || null,
      location_state: form.location_state || null,
      is_wysiwyg: form.is_wysiwyg,
      is_aquacultured: form.is_aquacultured,
      is_beginner_friendly: form.is_beginner_friendly,
    }).select().single();

    if (!error && listing) {
      const validUrls = imageUrls.filter(u => u.trim());
      if (validUrls.length > 0) {
        await supabase.from('listing_images').insert(
          validUrls.map((url, i) => ({ listing_id: listing.id, url, is_primary: i === 0, sort_order: i }))
        );
      }
    }

    setLoading(false);
    if (!error) onBack();
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Cancel
      </button>

      <h1 className="text-2xl font-bold text-white mb-6">List a Coral</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

        {/* Coral identification */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Coral Identification</h3>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Title <span className="text-red-400">*</span></label>
            <input
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="e.g. Dragon Soul Torch — 3 head frag"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Species</label>
              <select
                value={form.species_id}
                onChange={e => setField('species_id', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="">Select species...</option>
                {['SPS', 'LPS', 'Soft Coral'].map(group => (
                  <optgroup key={group} label={group} className="bg-slate-800">
                    {species.filter(s => s.coral_group === group).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.genus} {s.species}{s.common_name ? ` (${s.common_name})` : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Named Morph</label>
              <select
                value={form.morph_id}
                onChange={e => setField('morph_id', e.target.value)}
                disabled={!form.species_id || morphs.length === 0}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
              >
                <option value="">{morphs.length === 0 ? 'No named morphs' : 'Select morph...'}</option>
                {morphs.map(m => (
                  <option key={m.id} value={m.id}>{m.morph_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              placeholder="Describe the frag, its history, coloration, health..."
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Pricing & Type</h3>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Listing Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['sale', 'trade', 'both'] as ListingType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setField('listing_type', t)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
                    form.listing_type === t
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {t === 'both' ? 'Sale/Trade' : t}
                </button>
              ))}
            </div>
          </div>
          {(form.listing_type === 'sale' || form.listing_type === 'both') && (
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Asking Price ($)</label>
              <input
                value={form.asking_price}
                onChange={e => setField('asking_price', e.target.value)}
                type="number"
                min="0"
                step="0.01"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="0.00"
              />
            </div>
          )}
          {(form.listing_type === 'trade' || form.listing_type === 'both') && (
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Looking to trade for</label>
              <input
                value={form.trade_for}
                onChange={e => setField('trade_for', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="e.g. Acropora frags, Zoa colonies..."
              />
            </div>
          )}
        </div>

        {/* Care info */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Care Requirements</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Difficulty</label>
              <select
                value={form.care_difficulty}
                onChange={e => setField('care_difficulty', e.target.value as CareDifficulty)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select...</option>
                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Light</label>
              <select
                value={form.light_requirement}
                onChange={e => setField('light_requirement', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select...</option>
                {['Low', 'Medium', 'High'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Flow</label>
              <select
                value={form.flow_requirement}
                onChange={e => setField('flow_requirement', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select...</option>
                {['Low', 'Medium', 'High'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Frag Size</label>
            <input
              value={form.frag_size}
              onChange={e => setField('frag_size', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              placeholder="e.g. 1 inch, 3 polyps, tennis ball size..."
            />
          </div>
        </div>

        {/* Tags */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-3">
          <h3 className="text-white font-semibold">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'is_wysiwyg', label: 'WYSIWYG' },
              { key: 'is_aquacultured', label: 'Aquacultured' },
              { key: 'is_beginner_friendly', label: 'Beginner Friendly' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setField(key as keyof typeof form, !form[key as keyof typeof form] as never)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  form[key as keyof typeof form]
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Shipping & Location</h3>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setField('is_shipping_available', !form.is_shipping_available)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                form.is_shipping_available ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Ships Nationally
            </button>
            <button
              type="button"
              onClick={() => setField('is_local_pickup', !form.is_local_pickup)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                form.is_local_pickup ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Local Pickup
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.location_city}
              onChange={e => setField('location_city', e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              placeholder="City"
            />
            <input
              value={form.location_state}
              onChange={e => setField('location_state', e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              placeholder="State (FL)"
              maxLength={2}
            />
          </div>
        </div>

        {/* Images */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Photos</h3>
          <p className="text-slate-400 text-sm">Paste image URLs (Imgur, Google Photos, etc.)</p>
          <div className="space-y-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex-1 relative">
                  <Upload size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={url}
                    onChange={e => {
                      const next = [...imageUrls];
                      next[i] = e.target.value;
                      setImageUrls(next);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                    placeholder={i === 0 ? 'Primary photo URL (required for WYSIWYG)' : 'Additional photo URL'}
                  />
                </div>
                {imageUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setImageUrls(urls => urls.filter((_, idx) => idx !== i))}
                    className="text-slate-500 hover:text-red-400 transition-colors p-2"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {imageUrls.length < 8 && (
            <button
              type="button"
              onClick={() => setImageUrls(u => [...u, ''])}
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
            >
              <Plus size={14} />
              Add another photo
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !form.title}
          className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-white font-semibold py-4 rounded-xl transition-all duration-200 disabled:opacity-50 text-lg"
        >
          {loading ? 'Publishing...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
}
