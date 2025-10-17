import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { NoteCard } from '@/components/NoteCard';
import { NewNoteDialog } from '@/components/NewNoteDialog';
import { CategoryManager } from '@/components/CategoryManager';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { LogOut, Mic, Menu, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from '@/components/ui/sidebar';
import Masonry from 'react-masonry-css';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Note {
  id: string;
  title: string | null;
  content: string;
  color: string;
  category_id: string | null;
  created_at: string;
  categories?: Category;
}

const Index = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    checkAuth();
    fetchNotes();
    fetchCategories();

    // Realtime subscription for notes
    const notesChannel = supabase
      .channel('notes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
        },
        () => {
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notesChannel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const fetchNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotes([]);
        return;
      }
      const { data, error } = await supabase
        .from('notes')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .eq('archived', false)
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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Kategoriler yüklenemedi:', error);
    }
  };

  // Refetch when page/tab becomes visible (helps cross-device sync)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNotes();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const handleTranscriptionComplete = (text: string) => {
    console.log('Transkripsiyon alındı:', text, 'uzunluk:', text?.length);
    setTranscribedText(text || '');
    setDialogOpen(true);
  };

  const handleSaveNote = async (title: string, content: string, color: string, categoryId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { error } = await supabase.from('notes').insert({
        user_id: user.id,
        title: title || null,
        content,
        color,
        category_id: categoryId && categoryId !== 'none' ? categoryId : null,
      });

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Not kaydedildi.",
      });

      fetchNotes();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
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

      fetchNotes();
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

      fetchNotes();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ archived: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Arşivlendi",
        description: "Not arşivlendi.",
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const filteredNotes = notes.filter(note => {
    const matchesCategory = selectedCategoryFilter
      ? note.category_id === selectedCategoryFilter
      : true;
    const matchesSearch = searchQuery
      ? note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.title?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10" role="main">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-11 w-11 flex-shrink-0 hover:bg-accent/50 transition-colors">
                <Menu className="h-6 w-6" />
              </Button>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Mic className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-2xl font-bold truncate bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Sesli Notlar</h1>
                <p className="text-xs md:text-sm text-muted-foreground font-medium">
                  {filteredNotes.length} not
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={fetchNotes} title="Yenile" className="hover:bg-accent/50 transition-colors">
                <RefreshCw className="h-5 w-5" />
              </Button>
              <CategoryManager onCategoriesChange={fetchCategories} />
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Çıkış" className="hover:bg-accent/50 transition-colors">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-32">
        {categories.length > 0 && (
          <div className="mb-8 flex gap-2 flex-wrap">
            <Badge
              variant={selectedCategoryFilter === null ? 'default' : 'outline'}
              className="cursor-pointer hover:scale-105 transition-transform px-4 py-2 text-sm font-medium"
              onClick={() => setSelectedCategoryFilter(null)}
            >
              Tümü ({notes.length})
            </Badge>
            {categories.map((category) => {
              const count = notes.filter(n => n.category_id === category.id).length;
              return (
                <Badge
                  key={category.id}
                  variant={selectedCategoryFilter === category.id ? 'default' : 'outline'}
                  className="cursor-pointer hover:scale-105 transition-transform px-4 py-2 text-sm font-medium"
                  onClick={() => setSelectedCategoryFilter(category.id)}
                >
                  {category.name} ({count})
                </Badge>
              );
            })}
          </div>
        )}

        {filteredNotes.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 mb-6 shadow-lg">
              <Mic className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {selectedCategoryFilter ? 'Bu kategoride not yok' : 'Henüz notun yok'}
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              {selectedCategoryFilter 
                ? 'Başka bir kategori seçin veya yeni not ekleyin'
                : 'Aşağıdaki mikrofon butonuna basarak ilk notunu oluştur'}
            </p>
          </div>
        ) : (
          <Masonry
            breakpointCols={breakpointColumns}
            className="flex gap-4 -ml-4"
            columnClassName="pl-4 bg-clip-padding"
          >
            {filteredNotes.map((note) => (
              <div key={note.id} className="mb-4">
                <NoteCard
                  id={note.id}
                  title={note.title}
                  content={note.content}
                  color={note.color}
                  onDelete={handleDeleteNote}
                  onUpdate={handleUpdateNote}
                  onColorChange={handleColorChange}
                  onArchive={handleArchive}
                />
              </div>
            ))}
          </Masonry>
        )}
      </main>

      <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />

      <NewNoteDialog
        key={`${dialogOpen}-${transcribedText.length}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialContent={transcribedText}
        onSave={handleSaveNote}
      />
    </div>
  );
};

export default Index;
