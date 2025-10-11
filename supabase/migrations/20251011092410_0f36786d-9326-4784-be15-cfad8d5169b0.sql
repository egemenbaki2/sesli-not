-- Add new columns to notes table for archive, trash, and reminders
ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_checklist BOOLEAN DEFAULT FALSE;

-- Create settings table for user preferences
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  add_new_items_to_bottom BOOLEAN DEFAULT FALSE,
  move_checked_items_to_bottom BOOLEAN DEFAULT TRUE,
  show_rich_link_previews BOOLEAN DEFAULT TRUE,
  morning_reminder_time TIME DEFAULT '08:00',
  afternoon_reminder_time TIME DEFAULT '13:00',
  evening_reminder_time TIME DEFAULT '18:00',
  sharing_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for settings
CREATE POLICY "Users can view their own settings"
ON public.settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create checklist items table
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  checked BOOLEAN DEFAULT FALSE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on checklist_items
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- Create policies for checklist_items
CREATE POLICY "Users can view checklist items for their notes"
ON public.checklist_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.notes
    WHERE notes.id = checklist_items.note_id
    AND notes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert checklist items for their notes"
ON public.checklist_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.notes
    WHERE notes.id = checklist_items.note_id
    AND notes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update checklist items for their notes"
ON public.checklist_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.notes
    WHERE notes.id = checklist_items.note_id
    AND notes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete checklist items for their notes"
ON public.checklist_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.notes
    WHERE notes.id = checklist_items.note_id
    AND notes.user_id = auth.uid()
  )
);

-- Create trigger for settings updated_at
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();