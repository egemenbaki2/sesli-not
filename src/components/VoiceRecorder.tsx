import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export const VoiceRecorder = ({ onTranscriptionComplete }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Mikrofon erişim hatası:', error);
      toast({
        title: "Hata",
        description: "Mikrofona erişilemedi. Lütfen mikrofon izni verin.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    console.log('Ses işleniyor, boyut:', audioBlob.size);

    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const result = reader.result?.toString() || '';
            const base64 = result.split(',')[1];
            if (!base64) return reject(new Error('Ses verisi işlenemedi'));
            resolve(base64);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = (e) => reject(new Error('Ses dosyası okunamadı'));
        reader.readAsDataURL(audioBlob);
      });

      console.log('Base64 audio uzunluğu:', base64Audio.length);
      console.log('Edge function çağrılıyor...');

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio },
      });

      console.log('Edge function yanıtı:', { data, error });

      if (error) {
        console.error('Edge function hatası:', error);
        throw error;
      }

      if (data?.error) {
        console.error('API hatası:', data.error);
        throw new Error(data.error);
      }

      if (!data?.text) {
        console.error('Metin bulunamadı:', data);
        throw new Error('Transkripsiyon sonucu alınamadı');
      }

      console.log('Transkripsiyon başarılı:', data.text);
      onTranscriptionComplete(data.text);
      toast({
        title: "Başarılı!",
        description: "Ses metne dönüştürüldü.",
      });
    } catch (error: any) {
      console.error('Transkripsiyon hatası:', error);
      toast({
        title: "Hata",
        description: error.message || "Ses metne dönüştürülemedi.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      {!isRecording ? (
        <Button
          size="lg"
          onClick={startRecording}
          disabled={isProcessing}
          className="h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-all duration-200"
        >
          <Mic className="h-8 w-8" />
        </Button>
      ) : (
        <Button
          size="lg"
          onClick={stopRecording}
          variant="destructive"
          className="h-16 w-16 rounded-full shadow-2xl animate-pulse-slow"
        >
          <Square className="h-8 w-8" />
        </Button>
      )}
      
      {isProcessing && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-sm text-muted-foreground">İşleniyor...</p>
        </div>
      )}
    </div>
  );
};
