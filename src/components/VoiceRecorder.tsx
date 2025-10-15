import { useState, useRef, useEffect } from 'react';
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
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex flex-col items-center gap-3">
        {isRecording && (
          <div className="bg-card/95 backdrop-blur-sm border rounded-full px-6 py-2 shadow-lg">
            <p className="text-sm font-medium text-destructive animate-pulse">
              Kayıt yapılıyor • {formatTime(recordingTime)}
            </p>
          </div>
        )}
        
        {!isRecording ? (
          <Button
            size="lg"
            onClick={startRecording}
            disabled={isProcessing}
            className="h-28 w-28 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 bg-destructive hover:bg-destructive/90"
          >
            <Mic className="h-14 w-14" />
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={stopRecording}
            variant="destructive"
            className="h-28 w-28 rounded-full shadow-2xl transition-all duration-300 animate-pulse-slow hover:animate-none hover:scale-110"
          >
            <Square className="h-14 w-14 fill-current" />
          </Button>
        )}
        
        {isProcessing && (
          <div className="bg-card/95 backdrop-blur-sm border rounded-full px-6 py-2 shadow-lg">
            <p className="text-sm font-medium text-muted-foreground">İşleniyor...</p>
          </div>
        )}
      </div>
    </div>
  );
};
