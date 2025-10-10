import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface NewNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContent: string;
  onSave: (title: string, content: string, color: string, categoryId?: string) => void;
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

export const NewNoteDialog = ({
  open,
  onOpenChange,
  initialContent,
  onSave,
}: NewNoteDialogProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(initialContent);
  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);

  // initialContent değiştiğinde veya dialog açıldığında içeriği senkronize et
  useEffect(() => {
    if (open) {
      setContent(initialContent || '');
      fetchCategories();
    }
  }, [initialContent, open]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error);
    }
  };

  const handleSave = () => {
    onSave(title, content, selectedColor, selectedCategory || undefined);
    setTitle('');
    setContent('');
    setSelectedColor('blue');
    setSelectedCategory('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni Not</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık (opsiyonel)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Not başlığı..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">İçerik</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Not içeriği..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori (opsiyonel)</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Kategori seç..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kategori yok</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${colorClasses[category.color]}`}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Renk</Label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-8 h-8 rounded-full ${colorClasses[color.value]} ${
                    selectedColor === color.value
                      ? 'ring-2 ring-offset-2 ring-primary'
                      : ''
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1" disabled={!content.trim()}>
              Kaydet
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              İptal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
