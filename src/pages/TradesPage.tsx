import { useEffect, useState } from 'react';
import { Plus, X, ArrowLeftRight, Heart, Inbox, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { supabase, CoralSpecies, CoralMorph, HaveListItem, WantListItem, TradeMatch } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import RarityBadge from '../components/ui/RarityBadge';

type TradeTab = 'have' | 'want' | 'matches' | 'messages';

export default function TradesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TradeTab>('have');
  const [haveList, setHaveList] = useState<HaveListItem[]>([]);
  const [wantList, setWantList] = useState<WantListItem[]>([]);
  const [matches, setMatches] = useState<TradeMatch[]>([]);
  const [conversations, setConversations] = useState<{ partnerId: string; partnerName: string; lastMsg: string; unread: number }[]>([]);
  const [species, setSpecies] = useState<CoralSpecies[]>([]);
  const [morphs, setMorphs] = useState<CoralMorph[]>([]);
  const [showAddHave, setShowAddHave] = useState(false);
  const [showAddWant, setShowAddWant] = useState(false);
  const [addForm, setAddForm] = useState({ species_id: '', morph_id: '', notes: '', quantity: '1', max_price: '' });
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ id: string; sender_id: string; content: string; created_at: string; sender?: { username: string } }[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadAll();
    supabase.from('coral_species').select('*').order('genus').then(({ data }) => setSpecies(data ?? []));
  }, [user]);

  useEffect(() => {
    if (addForm.species_id) {
      supabase.from('coral_morphs').select('*').eq('species_id', addForm.species_id).then(({ data }) => setMorphs(data ?? []));
    }
  }, [addForm.species_id]);

  async function loadAll() {
    if (!user) return;
    setLoading(true);
    const [haveRes, wantRes, matchRes, msgRes] = await Promise.all([
      supabase.from('have_list').select('*, coral_species(*), coral_morphs(*)').eq('user_id', user.id).eq('is_active', true),
      supabase.from('want_list').select('*, coral_species(*), coral_morphs(*)').eq('user_id', user.id).eq('is_active', true),
      supabase.from('trade_matches').select('*, user_a:user_a_id(username, display_name, reputation_score, total_reviews), user_b:user_b_id(username, display_name, reputation_score, total_reviews)').or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`).order('created_at', { ascending: false }),
      supabase.from('messages').select('*, sender:sender_id(username)').or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order('created_at', { ascending: false }),
    ]);

    setHaveList(haveRes.data ?? []);
    setWantList(wantRes.data ?? []);
    setMatches(matchRes.data ?? []);

    const msgs = msgRes.data ?? [];
    const convMap = new Map<string, typeof conversations[number]>();
    msgs.forEach(m => {
      const partnerId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const partnerName = m.sender_id === user.id ? 'Them' : (m.sender as { username: string })?.username ?? 'User';
      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, { partnerId, partnerName, lastMsg: m.content, unread: m.status === 'sent' && m.recipient_id === user.id ? 1 : 0 });
      } else if (m.status === 'sent' && m.recipient_id === user.id) {
        convMap.get(partnerId)!.unread++;
      }
    });
    setConversations(Array.from(convMap.values()));
    setLoading(false);
  }

  async function loadConversation(partnerId: string) {
    if (!user) return;
    setSelectedConvo(partnerId);
    const { data } = await supabase
      .from('messages')
      .select('*, sender:sender_id(username)')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`)
      .order('created_at');
    setMessages(data ?? []);
    await supabase.from('messages').update({ status: 'read' }).eq('sender_id', partnerId).eq('recipient_id', user.id);
  }

  async function sendMessage() {
    if (!user || !selectedConvo || !newMsg.trim()) return;
    await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: selectedConvo,
      content: newMsg.trim(),
    });
    setNewMsg('');
    await loadConversation(selectedConvo);
  }

  async function addToHave() {
    if (!user) return;
    setSubmitting(true);
    await supabase.from('have_list').insert({
      user_id: user.id,
      species_id: addForm.species_id || null,
      morph_id: addForm.morph_id || null,
      notes: addForm.notes || null,
      quantity: parseInt(addForm.quantity) || 1,
    });
    setSubmitting(false);
    setShowAddHave(false);
    setAddForm({ species_id: '', morph_id: '', notes: '', quantity: '1', max_price: '' });
    loadAll();
  }

  async function addToWant() {
    if (!user) return;
    setSubmitting(true);
    await supabase.from('want_list').insert({
      user_id: user.id,
      species_id: addForm.species_id || null,
      morph_id: addForm.morph_id || null,
      notes: addForm.notes || null,
      max_price: addForm.max_price ? parseFloat(addForm.max_price) : null,
    });
    setSubmitting(false);
    setShowAddWant(false);
    setAddForm({ species_id: '', morph_id: '', notes: '', quantity: '1', max_price: '' });
    loadAll();
  }

  async function removeFromHave(id: string) {
    await supabase.from('have_list').update({ is_active: false }).eq('id', id);
    loadAll();
  }

  async function removeFromWant(id: string) {
    await supabase.from('want_list').update({ is_active: false }).eq('id', id);
    loadAll();
  }

  async function updateMatchStatus(id: string, status: 'contacted' | 'completed' | 'declined') {
    await supabase.from('trade_matches').update({ status }).eq('id', id);
    loadAll();
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <ArrowLeftRight size={40} className="text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 mb-2">Sign in to access the Trade Network</p>
      </div>
    );
  }

  const tabs: { id: TradeTab; label: string; count?: number }[] = [
    { id: 'have', label: 'Have', count: haveList.length },
    { id: 'want', label: 'Want', count: wantList.length },
    { id: 'matches', label: 'Matches', count: matches.filter(m => m.status === 'pending').length },
    { id: 'messages', label: 'Messages', count: conversations.reduce((a, c) => a + c.unread, 0) },
  ];

  const CoralAddForm = ({ onSubmit, onCancel, isWant }: { onSubmit: () => void; onCancel: () => void; isWant?: boolean }) => (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
      <h3 className="text-white font-semibold">{isWant ? 'Add to Want List' : 'Add to Have List'}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <select
          value={addForm.species_id}
          onChange={e => setAddForm(f => ({ ...f, species_id: e.target.value, morph_id: '' }))}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="">Select species...</option>
          {['SPS', 'LPS', 'Soft Coral'].map(g => (
            <optgroup key={g} label={g} className="bg-slate-800">
              {species.filter(s => s.coral_group === g).map(s => (
                <option key={s.id} value={s.id}>{s.genus} {s.species}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {morphs.length > 0 && (
          <select
            value={addForm.morph_id}
            onChange={e => setAddForm(f => ({ ...f, morph_id: e.target.value }))}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">Any morph</option>
            {morphs.map(m => <option key={m.id} value={m.id}>{m.morph_name}</option>)}
          </select>
        )}
      </div>
      {isWant ? (
        <input
          value={addForm.max_price}
          onChange={e => setAddForm(f => ({ ...f, max_price: e.target.value }))}
          type="number"
          placeholder="Max price willing to pay ($)"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      ) : (
        <input
          value={addForm.quantity}
          onChange={e => setAddForm(f => ({ ...f, quantity: e.target.value }))}
          type="number"
          min="1"
          placeholder="Quantity available"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      )}
      <input
        value={addForm.notes}
        onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
        placeholder="Notes (optional)"
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
      />
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl transition-colors text-sm">
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting || !addForm.species_id}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 text-sm"
        >
          {submitting ? 'Adding...' : 'Add'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Trade Network</h1>
        <p className="text-slate-400 text-sm mt-0.5">Smart matchmaking for reef hobbyists</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === id ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${
                activeTab === id ? 'bg-white/20' : 'bg-cyan-500 text-white'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* HAVE tab */}
          {activeTab === 'have' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-slate-400 text-sm">Corals you have available to trade</p>
                <button
                  onClick={() => { setShowAddHave(true); setShowAddWant(false); }}
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>

              {showAddHave && <CoralAddForm onSubmit={addToHave} onCancel={() => setShowAddHave(false)} />}

              {haveList.length === 0 ? (
                <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
                  <Heart size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Your Have List is empty</p>
                  <p className="text-slate-500 text-xs mt-1">Add corals you're willing to trade</p>
                </div>
              ) : haveList.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-white font-medium text-sm">
                        {item.coral_morphs ? `${(item.coral_morphs as CoralMorph).morph_name} — ` : ''}
                        {item.coral_species ? `${(item.coral_species as CoralSpecies).genus} ${(item.coral_species as CoralSpecies).species}` : 'Unknown'}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        Qty: {item.quantity}
                        {item.notes ? ` · ${item.notes}` : ''}
                      </div>
                    </div>
                    {item.coral_species && <RarityBadge tier={(item.coral_species as CoralSpecies).rarity_tier} />}
                  </div>
                  <button onClick={() => removeFromHave(item.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* WANT tab */}
          {activeTab === 'want' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-slate-400 text-sm">Corals you're looking to acquire</p>
                <button
                  onClick={() => { setShowAddWant(true); setShowAddHave(false); }}
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>

              {showAddWant && <CoralAddForm onSubmit={addToWant} onCancel={() => setShowAddWant(false)} isWant />}

              {wantList.length === 0 ? (
                <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
                  <Inbox size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Your Want List is empty</p>
                  <p className="text-slate-500 text-xs mt-1">Add corals you're looking for to get matched</p>
                </div>
              ) : wantList.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-white font-medium text-sm">
                        {item.coral_morphs ? `${(item.coral_morphs as CoralMorph).morph_name} — ` : ''}
                        {item.coral_species ? `${(item.coral_species as CoralSpecies).genus} ${(item.coral_species as CoralSpecies).species}` : 'Unknown'}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {item.max_price ? `Max: $${item.max_price}` : 'No max price'}
                        {item.notes ? ` · ${item.notes}` : ''}
                      </div>
                    </div>
                    {item.coral_species && <RarityBadge tier={(item.coral_species as CoralSpecies).rarity_tier} />}
                  </div>
                  <button onClick={() => removeFromWant(item.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* MATCHES tab */}
          {activeTab === 'matches' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-sm">Auto-matched traders based on your Have/Want lists</p>
              {matches.length === 0 ? (
                <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
                  <ArrowLeftRight size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No matches yet</p>
                  <p className="text-slate-500 text-xs mt-1">Add items to your Have & Want lists to get matched</p>
                </div>
              ) : matches.map(match => {
                const partner = match.user_a_id === user.id ? match.user_b : match.user_a;
                const partnerObj = partner as { username: string; display_name: string | null } | undefined;
                return (
                  <div key={match.id} className={`bg-slate-900 border rounded-xl p-4 space-y-3 ${
                    match.status === 'pending' ? 'border-cyan-800' : 'border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-sm font-bold text-white">
                          {partnerObj?.username?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{partnerObj?.display_name ?? partnerObj?.username}</div>
                          <div className="text-slate-400 text-xs">@{partnerObj?.username}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        match.status === 'pending' ? 'bg-cyan-900/40 text-cyan-400' :
                        match.status === 'contacted' ? 'bg-amber-900/40 text-amber-400' :
                        match.status === 'completed' ? 'bg-emerald-900/40 text-emerald-400' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {match.status}
                      </span>
                    </div>

                    {match.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateMatchStatus(match.id, 'contacted')}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-800 py-2 rounded-xl text-xs font-medium transition-all"
                        >
                          <MessageSquare size={12} />
                          Contact
                        </button>
                        <button
                          onClick={() => updateMatchStatus(match.id, 'completed')}
                          className="flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-800 py-2 px-3 rounded-xl text-xs font-medium transition-all"
                        >
                          <CheckCircle size={12} />
                        </button>
                        <button
                          onClick={() => updateMatchStatus(match.id, 'declined')}
                          className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-900 py-2 px-3 rounded-xl text-xs font-medium transition-all"
                        >
                          <XCircle size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* MESSAGES tab */}
          {activeTab === 'messages' && (
            <div className="space-y-3">
              {selectedConvo ? (
                <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col" style={{ height: '60vh' }}>
                  <div className="flex items-center gap-3 p-4 border-b border-slate-700">
                    <button onClick={() => setSelectedConvo(null)} className="text-slate-400 hover:text-white transition-colors text-sm">
                      ← Back
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-sm font-bold text-white">
                      {conversations.find(c => c.partnerId === selectedConvo)?.partnerName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-white font-medium">{conversations.find(c => c.partnerId === selectedConvo)?.partnerName}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          msg.sender_id === user.id
                            ? 'bg-cyan-600 text-white rounded-br-sm'
                            : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-slate-700 flex gap-2">
                    <input
                      value={newMsg}
                      onChange={e => setNewMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMsg.trim()}
                      className="bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      Send
                    </button>
                  </div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
                  <MessageSquare size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No messages yet</p>
                  <p className="text-slate-500 text-xs mt-1">Contact a seller or respond to a trade match</p>
                </div>
              ) : conversations.map(convo => (
                <button
                  key={convo.partnerId}
                  onClick={() => loadConversation(convo.partnerId)}
                  className="w-full flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-4 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {convo.partnerName[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm">{convo.partnerName}</div>
                    <div className="text-slate-500 text-xs truncate">{convo.lastMsg}</div>
                  </div>
                  {convo.unread > 0 && (
                    <span className="bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold flex-shrink-0">
                      {convo.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
