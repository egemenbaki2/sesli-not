import { Tag } from 'lucide-react';
import { CategoryManager } from '@/components/CategoryManager';

const Tags = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Tag className="h-8 w-8" />
        Etiketleri Düzenle
      </h1>
      <CategoryManager onCategoriesChange={() => {}} />
    </div>
  );
};

export default Tags;