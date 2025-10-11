import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Settings {
  add_new_items_to_bottom: boolean;
  move_checked_items_to_bottom: boolean;
  show_rich_link_previews: boolean;
  morning_reminder_time: string;
  afternoon_reminder_time: string;
  evening_reminder_time: string;
  sharing_enabled: boolean;
}

const Settings = () => {
  const [settings, setSettings] = useState<Settings>({
    add_new_items_to_bottom: false,
    move_checked_items_to_bottom: true,
    show_rich_link_previews: true,
    morning_reminder_time: '08:00',
    afternoon_reminder_time: '13:00',
    evening_reminder_time: '18:00',
    sharing_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchSettings();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          add_new_items_to_bottom: data.add_new_items_to_bottom,
          move_checked_items_to_bottom: data.move_checked_items_to_bottom,
          show_rich_link_previews: data.show_rich_link_previews,
          morning_reminder_time: data.morning_reminder_time,
          afternoon_reminder_time: data.afternoon_reminder_time,
          evening_reminder_time: data.evening_reminder_time,
          sharing_enabled: data.sharing_enabled,
        });
      }
    } catch (error: any) {
      console.error('Ayarlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const { error } = await supabase
        .from('settings')
        .upsert({
          user_id: user.id,
          ...settings,
        });

      if (error) throw error;

      toast({
        title: "Kaydedildi",
        description: "Ayarlar başarıyla kaydedildi.",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Ayarlar</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Notlar ve Listeler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="add_new_items_to_bottom"
                checked={settings.add_new_items_to_bottom}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, add_new_items_to_bottom: !!checked })
                }
              />
              <Label htmlFor="add_new_items_to_bottom">Yeni öğeleri alta ekle</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="move_checked_items_to_bottom"
                checked={settings.move_checked_items_to_bottom}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, move_checked_items_to_bottom: !!checked })
                }
              />
              <Label htmlFor="move_checked_items_to_bottom">İşaretli öğeleri alta taşı</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="show_rich_link_previews"
                checked={settings.show_rich_link_previews}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, show_rich_link_previews: !!checked })
                }
              />
              <Label htmlFor="show_rich_link_previews">
                Zengin bağlantı önizlemelerini göster
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Hatırlatıcı Varsayılanları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="morning">Sabah</Label>
              <Input
                id="morning"
                type="time"
                value={settings.morning_reminder_time}
                onChange={(e) =>
                  setSettings({ ...settings, morning_reminder_time: e.target.value })
                }
                className="w-32"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="afternoon">Öğleden sonra</Label>
              <Input
                id="afternoon"
                type="time"
                value={settings.afternoon_reminder_time}
                onChange={(e) =>
                  setSettings({ ...settings, afternoon_reminder_time: e.target.value })
                }
                className="w-32"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="evening">Akşam</Label>
              <Input
                id="evening"
                type="time"
                value={settings.evening_reminder_time}
                onChange={(e) =>
                  setSettings({ ...settings, evening_reminder_time: e.target.value })
                }
                className="w-32"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Paylaşım</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sharing_enabled"
                checked={settings.sharing_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, sharing_enabled: !!checked })
                }
              />
              <Label htmlFor="sharing_enabled">Paylaşımı etkinleştir</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/')}>
            İptal
          </Button>
          <Button onClick={handleSave}>Kaydet</Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;