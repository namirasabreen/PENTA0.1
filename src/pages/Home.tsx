import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, BookMarked, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import { supabase, Book } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Stats = { totalBooks: number; totalUsers: number; activeBorrowings: number; availableBooks: number };

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalBooks: 0, totalUsers: 0, activeBorrowings: 0, availableBooks: 0 });
  const [featured, setFeatured] = useState<Book[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [{ count: totalBooks }, { count: activeBorrowings }, { data: booksData }] = await Promise.all([
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('borrowings').select('*', { count: 'exact', head: true }).is('return_date', null),
        supabase.from('books').select('*').limit(4).order('created_at', { ascending: false }),
      ]);

      setStats({
        totalBooks: totalBooks ?? 0,
        totalUsers: 0,
        activeBorrowings: activeBorrowings ?? 0,
        availableBooks: (booksData ?? []).reduce((sum: number, b: Book) => sum + b.available_copies, 0),
      });
      setFeatured(booksData ?? []);
      setLoadingStats(false);
    }
    fetchData();
  }, []);

  const categoryColors: Record<string, string> = {
    Fiction: 'bg-sky-100 text-sky-700',
    Science: 'bg-violet-100 text-violet-700',
    Technology: 'bg-emerald-100 text-emerald-700',
    History: 'bg-orange-100 text-orange-700',
    Default: 'bg-stone-100 text-stone-600',
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-pink-600 via-pink-500 to-rose-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full" />
          <div className="absolute bottom-10 right-20 w-48 h-48 border border-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 border border-white rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-pink-500/40 px-4 py-1.5 rounded-full text-pink-100 text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              Welcome to Penta
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
              Your Gateway to<br />
              <span className="text-pink-200">Endless Knowledge</span>
            </h1>
            <p className="text-pink-100/90 text-lg mb-8 leading-relaxed">
              Discover thousands of books, manage your borrowings, and explore new worlds — all from one place.
            </p>
            {user ? (
              <Link
                to="/books"
                className="inline-flex items-center gap-2 bg-white text-pink-700 px-6 py-3 rounded-xl font-semibold hover:bg-pink-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Browse Books <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="inline-flex items-center gap-2 bg-white text-pink-700 px-6 py-3 rounded-xl font-semibold hover:bg-pink-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  Get Started <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 bg-pink-500/30 border border-pink-300/40 text-white px-6 py-3 rounded-xl font-semibold hover:bg-pink-500/50 transition-all">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Books', value: stats.totalBooks, icon: <BookOpen className="w-5 h-5" />, color: 'text-pink-700', bg: 'bg-pink-50' },
            { label: 'Available Copies', value: stats.availableBooks, icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Active Borrowings', value: stats.activeBorrowings, icon: <Clock className="w-5 h-5" />, color: 'text-sky-700', bg: 'bg-sky-50' },
            { label: 'Categories', value: 5, icon: <BookMarked className="w-5 h-5" />, color: 'text-rose-700', bg: 'bg-rose-50' },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex items-center gap-4">
              <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center shrink-0`}>
                {icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-800">{loadingStats ? '...' : value}</p>
                <p className="text-sm text-stone-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Books */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-stone-800">Featured Books</h2>
            <p className="text-stone-500 mt-1">Recently added to our collection</p>
          </div>
          {user && (
            <Link to="/books" className="flex items-center gap-1.5 text-pink-600 hover:text-pink-500 font-medium text-sm transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map(book => (
            <div key={book.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="h-36 bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-2 right-2 w-16 h-16 border border-white rounded-full" />
                  <div className="absolute bottom-2 left-2 w-10 h-10 border border-white rounded-full" />
                </div>
                <BookOpen className="w-12 h-12 text-pink-100" />
              </div>
              <div className="p-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[book.category] ?? categoryColors.Default}`}>
                  {book.category}
                </span>
                <h3 className="font-semibold text-stone-800 mt-2 text-sm leading-tight line-clamp-2">{book.title}</h3>
                <p className="text-xs text-stone-500 mt-1">{book.author}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                  <span className="text-xs text-stone-400">Available</span>
                  <span className={`text-xs font-semibold ${book.available_copies > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {book.available_copies}/{book.total_copies}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="bg-pink-600 text-white py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <BookMarked className="w-12 h-12 text-pink-200 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3">Start Reading Today</h2>
            <p className="text-pink-100 mb-8">Create a free account and get your library card to start borrowing books.</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-white text-pink-700 px-8 py-3 rounded-xl font-semibold hover:bg-pink-50 transition-all shadow-lg">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
