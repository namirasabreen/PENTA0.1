import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Library, User, LogOut, Menu, X, BookMarked } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const isActive = (path: string) => location.pathname === path;

  const navLink = (to: string, label: string, icon: React.ReactNode) => (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive(to)
          ? 'bg-pink-100 text-pink-800'
          : 'text-stone-600 hover:bg-pink-50 hover:text-pink-700'
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-pink-600 rounded-lg flex items-center justify-center group-hover:bg-pink-500 transition-colors">
              <Library className="w-5 h-5 text-pink-50" />
            </div>
            <div>
              <span className="text-lg font-bold text-stone-800 leading-tight block">Penta</span>
              <span className="text-xs text-stone-400 leading-tight block -mt-0.5">Library System</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLink('/', 'Home', <BookOpen className="w-4 h-4" />)}
            {user && navLink('/books', 'Books Catalog', <Library className="w-4 h-4" />)}
            {user && navLink('/borrowings', 'My Borrowings', <BookMarked className="w-4 h-4" />)}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-stone-700 leading-tight">{profile?.name ?? user.email}</p>
                  {profile && <p className="text-xs text-stone-400 leading-tight">{profile.library_card_number}</p>}
                </div>
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-pink-700" />
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-pink-700 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium bg-pink-600 text-white rounded-lg hover:bg-pink-500 transition-colors">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-stone-200 px-4 py-3 space-y-1">
          {navLink('/', 'Home', <BookOpen className="w-4 h-4" />)}
          {user && navLink('/books', 'Books Catalog', <Library className="w-4 h-4" />)}
          {user && navLink('/borrowings', 'My Borrowings', <BookMarked className="w-4 h-4" />)}
          {user ? (
            <div className="pt-2 border-t border-stone-100 mt-2">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-stone-700">{profile?.name ?? user.email}</p>
                {profile && <p className="text-xs text-stone-400">{profile.library_card_number}</p>}
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-stone-100 mt-2 flex flex-col gap-1">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 rounded-lg">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm font-medium bg-pink-600 text-white rounded-lg text-center hover:bg-pink-500">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
