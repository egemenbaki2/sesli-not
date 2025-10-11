import { Bell } from 'lucide-react';

const Reminders = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Bell className="h-8 w-8" />
        Hatırlatıcılar
      </h1>
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
          <Bell className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Yakında gelecek</h2>
        <p className="text-muted-foreground">
          Hatırlatıcı özelliği yakında eklenecek
        </p>
      </div>
    </div>
  );
};

export default Reminders;