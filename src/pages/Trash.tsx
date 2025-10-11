import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NoteCard } from '@/components/NoteCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, RotateCcw } from 'lucide-react';
import Masonry from 'react-masonry-css';

interface Note {
  id: string;
  title: string | null;
  content: string;
  color: string;
  created_at: string;
}

const Trash = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchDeletedNotes();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const fetchDeletedNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('deleted', true)
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

  const handlePermanentDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      toast({
        title: "Kalıcı olarak silindi",
        description: "Not kalıcı olarak silindi.",
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

  const handleRestore = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ deleted: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Geri yüklendi",
        description: "Not geri yüklendi.",
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

  const handleEmptyTrash = async () => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('deleted', true);

      if (error) throw error;

      toast({
        title: "Çöp kutusu boşaltıldı",
        description: "Tüm notlar kalıcı olarak silindi.",
      });

      setNotes([]);
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

      fetchDeletedNotes();
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

      fetchDeletedNotes();
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trash2 className="h-8 w-8" />
          Çöp Kutusu
        </h1>
        {notes.length > 0 && (
          <Button variant="destructive" onClick={handleEmptyTrash}>
            <Trash2 className="h-4 w-4 mr-2" />
            Çöp Kutusunu Boşalt
          </Button>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
            <Trash2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Çöp kutusu boş</h2>
          <p className="text-muted-foreground">
            Sildiğiniz notlar burada görünecek
          </p>
        </div>
      ) : (
        <Masonry
          breakpointCols={breakpointColumns}
          className="flex gap-4 -ml-4"
          columnClassName="pl-4 bg-clip-padding"
        >
          {notes.map((note) => (
            <div key={note.id} className="mb-4 relative group">
              <Button
                size="sm"
                variant="secondary"
                className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRestore(note.id)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <NoteCard
                id={note.id}
                title={note.title}
                content={note.content}
                color={note.color}
                onDelete={handlePermanentDelete}
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

export default Trash;