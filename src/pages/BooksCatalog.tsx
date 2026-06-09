import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, BookOpen, X, ChevronDown } from 'lucide-react';
import { supabase, Book } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFlash, FlashContainer } from '../components/FlashMessage';

const CATEGORIES = ['Fiction', 'Science', 'Technology', 'History', 'Biography', 'Philosophy', 'Arts', 'Other'];

type BookFormData = {
  title: string;
  author: string;
  isbn: string;
  category: string;
  total_copies: number;
  available_copies: number;
};

const emptyForm: BookFormData = {
  title: '', author: '', isbn: '', category: 'Fiction', total_copies: 1, available_copies: 1,
};

export default function BooksCatalog() {
  const { user } = useAuth();
  const { flashes, showFlash, dismiss } = useFlash();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Book | null>(null);
  const [form, setForm] = useState<BookFormData>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('books').select('*').order('created_at', { ascending: false });
    if (search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,author.ilike.%${search.trim()}%`);
    }
    if (categoryFilter) query = query.eq('category', categoryFilter);
    if (availabilityFilter === 'available') query = query.gt('available_copies', 0);
    if (availabilityFilter === 'unavailable') query = query.eq('available_copies', 0);
    const { data, error } = await query;
    if (error) showFlash('Failed to load books.', 'error');
    else setBooks(data ?? []);
    setLoading(false);
  }, [search, categoryFilter, availabilityFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchBooks, 300);
    return () => clearTimeout(timer);
  }, [fetchBooks]);

  function openAdd() {
    setEditBook(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  }

  function openEdit(book: Book) {
    setEditBook(book);
    setForm({
      title: book.title, author: book.author, isbn: book.isbn,
      category: book.category, total_copies: book.total_copies, available_copies: book.available_copies,
    });
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (form.available_copies > form.total_copies) {
      setFormError('Available copies cannot exceed total copies.');
      return;
    }
    setFormLoading(true);
    if (editBook) {
      const { error } = await supabase.from('books').update(form).eq('id', editBook.id);
      if (error) { setFormError(error.message); setFormLoading(false); return; }
      showFlash('Book updated successfully.', 'success');
    } else {
      const { error } = await supabase.from('books').insert(form);
      if (error) {
        setFormError(error.code === '23505' ? 'A book with this ISBN already exists.' : error.message);
        setFormLoading(false);
        return;
      }
      showFlash('Book added successfully.', 'success');
    }
    setFormLoading(false);
    setShowModal(false);
    fetchBooks();
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    const { error } = await supabase.from('books').delete().eq('id', deleteConfirm.id);
    if (error) showFlash('Failed to delete book.', 'error');
    else { showFlash('Book deleted.', 'success'); fetchBooks(); }
    setDeleteConfirm(null);
  }

  async function handleBorrow(book: Book) {
    if (!user) return;
    const { count } = await supabase
      .from('borrowings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('return_date', null);
    if ((count ?? 0) >= 3) {
      showFlash('You have reached the maximum of 3 borrowed books. Please return one first.', 'error');
      return;
    }
    const { error: borrowErr } = await supabase.from('borrowings').insert({
      user_id: user.id,
      book_id: book.id,
    });
    if (borrowErr) { showFlash('Failed to borrow book.', 'error'); return; }
    const { error: updateErr } = await supabase.from('books')
      .update({ available_copies: book.available_copies - 1 })
      .eq('id', book.id);
    if (updateErr) showFlash('Borrowed but failed to update count.', 'error');
    else showFlash(`"${book.title}" borrowed successfully! Due in 14 days.`, 'success');
    fetchBooks();
  }

  const categoryColors: Record<string, string> = {
    Fiction: 'bg-sky-100 text-sky-700',
    Science: 'bg-violet-100 text-violet-700',
    Technology: 'bg-emerald-100 text-emerald-700',
    History: 'bg-orange-100 text-orange-700',
    Biography: 'bg-pink-100 text-pink-700',
    Philosophy: 'bg-teal-100 text-teal-700',
    Arts: 'bg-yellow-100 text-yellow-700',
    Other: 'bg-stone-100 text-stone-600',
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <FlashContainer flashes={flashes} dismiss={dismiss} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">Books Catalog</h1>
            <p className="text-stone-500 mt-0.5">{books.length} book{books.length !== 1 ? 's' : ''} found</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md active:scale-[0.99] self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" /> Add Book
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or author..."
              className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-stone-200 rounded-xl text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={availabilityFilter}
              onChange={e => setAvailabilityFilter(e.target.value)}
              className="pl-4 pr-8 py-2.5 border border-stone-200 rounded-xl text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="">All Availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
                <div className="h-32 bg-stone-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-16" />
                  <div className="h-5 bg-stone-200 rounded w-3/4" />
                  <div className="h-4 bg-stone-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 font-medium">No books found</p>
            <p className="text-stone-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {books.map(book => (
              <div key={book.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col">
                <div className="h-32 bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-2 right-2 w-12 h-12 border border-white rounded-full" />
                  </div>
                  <BookOpen className="w-10 h-10 text-pink-100" />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full self-start ${categoryColors[book.category] ?? 'bg-stone-100 text-stone-600'}`}>
                    {book.category}
                  </span>
                  <h3 className="font-semibold text-stone-800 mt-2 text-sm leading-tight line-clamp-2 flex-1">{book.title}</h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-1">{book.author}</p>
                  <p className="text-xs text-stone-400 mt-0.5">ISBN: {book.isbn}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                    <div>
                      <p className="text-xs text-stone-400">Available</p>
                      <p className={`text-sm font-bold ${book.available_copies > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {book.available_copies}/{book.total_copies}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleBorrow(book)}
                        disabled={book.available_copies === 0}
                        className="px-3 py-1.5 text-xs font-medium bg-pink-600 text-white rounded-lg hover:bg-pink-500 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed transition-all"
                      >
                        Borrow
                      </button>
                      <button
                        onClick={() => openEdit(book)}
                        className="p-1.5 text-stone-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(book)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="text-lg font-semibold text-stone-800">{editBook ? 'Edit Book' : 'Add New Book'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{formError}</div>
              )}
              {[
                { label: 'Title', key: 'title', type: 'text', placeholder: 'Book title' },
                { label: 'Author', key: 'author', type: 'text', placeholder: 'Author name' },
                { label: 'ISBN', key: 'isbn', type: 'text', placeholder: '978-x-xxx-xxxxx-x' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof BookFormData] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    required
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-sm"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Total Copies</label>
                  <input
                    type="number"
                    min={1}
                    value={form.total_copies}
                    onChange={e => setForm(f => ({ ...f, total_copies: Number(e.target.value) }))}
                    required
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Available Copies</label>
                  <input
                    type="number"
                    min={0}
                    value={form.available_copies}
                    onChange={e => setForm(f => ({ ...f, available_copies: Number(e.target.value) }))}
                    required
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-500 disabled:bg-pink-300 text-white rounded-xl font-medium transition-all text-sm flex items-center justify-center gap-2"
                >
                  {formLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (editBook ? 'Save Changes' : 'Add Book')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-stone-800 text-center">Delete Book?</h2>
            <p className="text-stone-500 text-sm text-center mt-2 mb-6">
              Are you sure you want to delete <span className="font-medium text-stone-700">"{deleteConfirm.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-all text-sm">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-all text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
