import { useEffect, useState, useCallback } from 'react';
import { BookMarked, Clock, CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { supabase, Borrowing } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFlash, FlashContainer } from '../components/FlashMessage';

export default function MyBorrowings() {
  const { user } = useAuth();
  const { flashes, showFlash, dismiss } = useFlash();
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState<string | null>(null);

  const fetchBorrowings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('borrowings')
      .select('*, books(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) showFlash('Failed to load borrowings.', 'error');
    else setBorrowings(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchBorrowings(); }, [fetchBorrowings]);

  async function handleReturn(borrowing: Borrowing) {
    setReturning(borrowing.id);
    const today = new Date().toISOString().split('T')[0];
    const { error: returnErr } = await supabase
      .from('borrowings')
      .update({ return_date: today })
      .eq('id', borrowing.id);
    if (returnErr) { showFlash('Failed to return book.', 'error'); setReturning(null); return; }
    const { error: updateErr } = await supabase
      .from('books')
      .update({ available_copies: (borrowing.books?.available_copies ?? 0) + 1 })
      .eq('id', borrowing.book_id);
    if (updateErr) showFlash('Returned but failed to update book count.', 'error');
    else showFlash(`"${borrowing.books?.title}" returned successfully!`, 'success');
    setReturning(null);
    fetchBorrowings();
  }

  function getStatus(borrowing: Borrowing): { label: string; color: string; icon: React.ReactNode } {
    if (borrowing.return_date) {
      return { label: 'Returned', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-4 h-4" /> };
    }
    const due = new Date(borrowing.due_date);
    const now = new Date();
    if (now > due) {
      return { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: <AlertTriangle className="w-4 h-4" /> };
    }
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) {
      return { label: `Due in ${daysLeft}d`, color: 'bg-pink-100 text-pink-700', icon: <Clock className="w-4 h-4" /> };
    }
    return { label: 'Active', color: 'bg-sky-100 text-sky-700', icon: <BookMarked className="w-4 h-4" /> };
  }

  const active = borrowings.filter(b => !b.return_date);
  const returned = borrowings.filter(b => b.return_date);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const BorrowingCard = ({ b }: { b: Borrowing }) => {
    const status = getStatus(b);
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-sm transition-all">
        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shrink-0">
          <BookMarked className="w-6 h-6 text-pink-100" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-stone-800 truncate">{b.books?.title ?? 'Unknown'}</h3>
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
              {status.icon} {status.label}
            </span>
          </div>
          <p className="text-sm text-stone-500 truncate">{b.books?.author}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            <span className="text-xs text-stone-400">Borrowed: <span className="text-stone-600 font-medium">{formatDate(b.borrow_date)}</span></span>
            <span className="text-xs text-stone-400">Due: <span className={`font-medium ${!b.return_date && new Date() > new Date(b.due_date) ? 'text-red-600' : 'text-stone-600'}`}>{formatDate(b.due_date)}</span></span>
            {b.return_date && (
              <span className="text-xs text-stone-400">Returned: <span className="text-emerald-600 font-medium">{formatDate(b.return_date)}</span></span>
            )}
          </div>
        </div>
        {!b.return_date && (
          <button
            onClick={() => handleReturn(b)}
            disabled={returning === b.id}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:bg-pink-300 text-white text-sm font-medium rounded-xl transition-all self-start sm:self-auto shrink-0"
          >
            {returning === b.id ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><RotateCcw className="w-4 h-4" /> Return</>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <FlashContainer flashes={flashes} dismiss={dismiss} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-800">My Borrowings</h1>
          <p className="text-stone-500 mt-0.5">Track your borrowed books and manage returns</p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Active', value: active.length, color: 'text-sky-700', bg: 'bg-sky-50', icon: <BookMarked className="w-5 h-5" /> },
            { label: 'Returned', value: returned.length, color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <CheckCircle className="w-5 h-5" /> },
            { label: 'Overdue', value: active.filter(b => new Date() > new Date(b.due_date)).length, color: 'text-red-700', bg: 'bg-red-50', icon: <AlertTriangle className="w-5 h-5" /> },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center shrink-0`}>{icon}</div>
              <div>
                <p className="text-xl font-bold text-stone-800">{value}</p>
                <p className="text-xs text-stone-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 flex gap-4 animate-pulse">
                <div className="w-12 h-12 bg-stone-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-stone-200 rounded w-1/2" />
                  <div className="h-4 bg-stone-200 rounded w-1/3" />
                  <div className="h-3 bg-stone-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : borrowings.length === 0 ? (
          <div className="text-center py-24">
            <BookMarked className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 font-medium">No borrowings yet</p>
            <p className="text-stone-400 text-sm mt-1">Head to the Books Catalog to borrow your first book!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-3">Currently Borrowed ({active.length}/3)</h2>
                <div className="space-y-3">{active.map(b => <BorrowingCard key={b.id} b={b} />)}</div>
              </div>
            )}
            {returned.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-3">Returned</h2>
                <div className="space-y-3">{returned.map(b => <BorrowingCard key={b.id} b={b} />)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
