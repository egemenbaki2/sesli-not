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
  blue: 'bg-blue-100 border-blue-300 dark:bg-blue-950 dark:border-blue-800',
  green: 'bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-800',
  yellow: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800',
  red: 'bg-red-100 border-red-300 dark:bg-red-950 dark:border-red-800',
  purple: 'bg-purple-100 border-purple-300 dark:bg-purple-950 dark:border-purple-800',
  orange: 'bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-800',
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
    <Card className={`${colorClasses[color] || colorClasses.blue} p-4 transition-all hover:shadow-lg`}>
      {isEditing ? (
        <div className="space-y-3">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Başlık (opsiyonel)"
            className="bg-background/50"
          />
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Not içeriği"
            rows={4}
            className="bg-background/50"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          {title && (
            <h3 className="font-semibold mb-2 text-foreground">{title}</h3>
          )}
          <p className="text-sm text-foreground/80 whitespace-pre-wrap mb-4">
            {content}
          </p>
          <div className="flex gap-2 items-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="hover:bg-background/50"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="hover:bg-background/50"
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3">
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => onColorChange(id, c.value)}
                      className={`w-8 h-8 rounded-full ${colorButtonClasses[c.value]} ${
                        color === c.value
                          ? 'ring-2 ring-offset-2 ring-primary'
                          : ''
                      } hover:scale-110 transition-transform`}
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
                  className="hover:bg-background/50 ml-auto"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {showArchive && onArchive && (
                  <DropdownMenuItem onClick={() => onArchive(id)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Arşivle
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(id)}
                  className="text-destructive"
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
