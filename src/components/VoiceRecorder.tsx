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

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error('Ses verisi işlenemedi');
        }

        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio },
        });

        if (error) throw error;

        if (data?.text) {
          onTranscriptionComplete(data.text);
          toast({
            title: "Başarılı!",
            description: "Ses metne dönüştürüldü.",
          });
        }
      };
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
