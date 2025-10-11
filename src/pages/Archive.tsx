import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NoteCard } from '@/components/NoteCard';
import { useToast } from '@/hooks/use-toast';
import { Archive as ArchiveIcon } from 'lucide-react';
import Masonry from 'react-masonry-css';

interface Note {
  id: string;
  title: string | null;
  content: string;
  color: string;
  created_at: string;
}

const Archive = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchArchivedNotes();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const fetchArchivedNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('archived', true)
        .eq('deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ deleted: true })
        .eq('id', id);
      
      if (error) throw error;

      toast({
        title: "Çöp kutusuna taşındı",
        description: "Not çöp kutusuna taşındı.",
      });

      setNotes(notes.filter(note => note.id !== id));
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateNote = async (id: string, title: string, content: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ title: title || null, content })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Güncellendi",
        description: "Not güncellendi.",
      });

      fetchArchivedNotes();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleColorChange = async (id: string, color: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ color })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Güncellendi",
        description: "Not rengi değiştirildi.",
      });

      fetchArchivedNotes();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const breakpointColumns = {
    default: 3,
    1024: 2,
    640: 1,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <ArchiveIcon className="h-8 w-8" />
        Arşiv
      </h1>

      {notes.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
            <ArchiveIcon className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Arşivde not yok</h2>
          <p className="text-muted-foreground">
            Arşivlediğiniz notlar burada görünecek
          </p>
        </div>
      ) : (
        <Masonry
          breakpointCols={breakpointColumns}
          className="flex gap-4 -ml-4"
          columnClassName="pl-4 bg-clip-padding"
        >
          {notes.map((note) => (
            <div key={note.id} className="mb-4">
              <NoteCard
                id={note.id}
                title={note.title}
                content={note.content}
                color={note.color}
                onDelete={handleDeleteNote}
                onUpdate={handleUpdateNote}
                onColorChange={handleColorChange}
                showArchive={false}
              />
            </div>
          ))}
        </Masonry>
      )}
    </div>
  );
};

export default Archive;