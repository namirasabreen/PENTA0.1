
-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  library_card_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Books table
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  total_copies INTEGER NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
  available_copies INTEGER NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read books
CREATE POLICY "select_books" ON books FOR SELECT
  TO authenticated USING (true);

-- Only authenticated users can insert/update/delete books
CREATE POLICY "insert_books" ON books FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_books" ON books FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_books" ON books FOR DELETE
  TO authenticated USING (true);

-- Borrowings table
CREATE TABLE borrowings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  return_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE borrowings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_borrowings" ON borrowings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_borrowings" ON borrowings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_borrowings" ON borrowings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_borrowings" ON borrowings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Function to auto-generate library card numbers
CREATE OR REPLACE FUNCTION generate_library_card()
RETURNS TEXT AS $$
DECLARE
  card_num TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    card_num := 'LIB-' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM profiles WHERE library_card_number = card_num) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN card_num;
END;
$$ LANGUAGE plpgsql;

-- Sample books
INSERT INTO books (title, author, isbn, category, total_copies, available_copies) VALUES
  ('The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 'Fiction', 3, 3),
  ('A Brief History of Time', 'Stephen Hawking', '978-0-553-38016-3', 'Science', 2, 2),
  ('Clean Code', 'Robert C. Martin', '978-0-13-235088-4', 'Technology', 4, 4),
  ('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', '978-0-06-231609-7', 'History', 2, 2),
  ('To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 'Fiction', 3, 3);
