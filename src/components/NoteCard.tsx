import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Check, X, Palette, Archive, MoreVertical } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NoteCardProps {
  id: string;
  title: string | null;
  content: string;
  color: string;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string, content: string) => void;
  onColorChange: (id: string, color: string) => void;
  onArchive?: (id: string) => void;
  showArchive?: boolean;
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
  blue: 'bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800/50 hover:shadow-blue-500/20',
  green: 'bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800/50 hover:shadow-green-500/20',
  yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800/50 hover:shadow-yellow-500/20',
  red: 'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800/50 hover:shadow-red-500/20',
  purple: 'bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800/50 hover:shadow-purple-500/20',
  orange: 'bg-orange-50 border-orange-200 dark:bg-orange-950/50 dark:border-orange-800/50 hover:shadow-orange-500/20',
};

const colorButtonClasses: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
};

export const NoteCard = ({
  id,
  title,
  content,
  color,
  onDelete,
  onUpdate,
  onColorChange,
  onArchive,
  showArchive = true,
}: NoteCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title || '');
  const [editContent, setEditContent] = useState(content);

  const handleSave = () => {
    onUpdate(id, editTitle, editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(title || '');
    setEditContent(content);
    setIsEditing(false);
  };

  return (
    <Card className={`${colorClasses[color] || colorClasses.blue} p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-2xl border-2`}>
      {isEditing ? (
        <div className="space-y-3">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Başlık (opsiyonel)"
            className="bg-background/60 backdrop-blur-sm border-border/50 rounded-xl font-semibold"
          />
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Not içeriği"
            rows={4}
            className="bg-background/60 backdrop-blur-sm border-border/50 rounded-xl"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="rounded-xl shadow-md">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="rounded-xl">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          {title && (
            <h3 className="font-bold mb-3 text-foreground text-lg">{title}</h3>
          )}
          <p className="text-sm text-foreground/80 whitespace-pre-wrap mb-5 leading-relaxed">
            {content}
          </p>
          <div className="flex gap-1 items-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="hover:bg-background/60 rounded-xl transition-all hover:scale-105"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="hover:bg-background/60 rounded-xl transition-all hover:scale-105"
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 rounded-xl shadow-xl border-border/50 backdrop-blur-xl">
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => onColorChange(id, c.value)}
                      className={`w-9 h-9 rounded-xl ${colorButtonClasses[c.value]} ${
                        color === c.value
                          ? 'ring-2 ring-offset-2 ring-primary scale-110'
                          : ''
                      } hover:scale-110 transition-all shadow-md`}
                      title={c.name}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="hover:bg-background/60 ml-auto rounded-xl transition-all hover:scale-105"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-border/50 backdrop-blur-xl">
                {showArchive && onArchive && (
                  <DropdownMenuItem onClick={() => onArchive(id)} className="rounded-lg">
                    <Archive className="h-4 w-4 mr-2" />
                    Arşivle
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(id)}
                  className="text-destructive rounded-lg"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </Card>
  );
};
