-- Kategoriler tablosu oluştur
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS etkinleştir
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Kategori politikaları
CREATE POLICY "Users can view their own categories"
ON public.categories
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
ON public.categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON public.categories
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
ON public.categories
FOR DELETE
USING (auth.uid() = user_id);

-- Notes tablosuna category_id ekle
ALTER TABLE public.notes
ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;