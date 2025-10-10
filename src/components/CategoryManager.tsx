import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trash2, Plus, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  color: string;
}

const colors = [
  { name: 'Mavi', value: 'blue' },
  { name: 'Yeşil', value: 'green' },
  { name: 'Sarı', value: 'yellow' },
  { name: 'Kırmızı', value: 'red' },
  { name: 'Mor', value: 'purple' },
  { name: 'Turuncu', value: 'orange' },
];

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
};

export const CategoryManager = ({ onCategoriesChange }: { onCategoriesChange: () => void }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { error } = await supabase.from('categories').insert({
        user_id: user.id,
        name: newCategoryName.trim(),
        color: selectedColor,
      });

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Kategori eklendi.",
      });

      setNewCategoryName('');
      setSelectedColor('blue');
      fetchCategories();
      onCategoriesChange();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: "Silindi",
        description: "Kategori silindi.",
      });

      setCategories(categories.filter(cat => cat.id !== id));
      onCategoriesChange();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FolderOpen className="h-4 w-4 mr-2" />
          Kategoriler
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Kategorileri Yönet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-3">
            <Label>Yeni Kategori</Label>
            <div className="space-y-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Kategori adı..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <div className="flex gap-2 items-center">
                <Label className="text-sm">Renk:</Label>
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-6 h-6 rounded-full ${colorClasses[color.value]} ${
                      selectedColor === color.value
                        ? 'ring-2 ring-offset-2 ring-primary'
                        : ''
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
              <Button onClick={handleAddCategory} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ekle
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="mb-3 block">Mevcut Kategoriler</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Henüz kategori eklenmedi
                </p>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full ${colorClasses[category.color]}`}
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};