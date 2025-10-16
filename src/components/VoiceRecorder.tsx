import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

type AudioSource = 'microphone' | 'system';

export const VoiceRecorder = ({ onTranscriptionComplete }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioSource, setAudioSource] = useState<AudioSource>('microphone');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
      let stream: MediaStream;

      if (audioSource === 'system') {
        if (!('getDisplayMedia' in navigator.mediaDevices)) {
          throw new Error('SYSTEM_NOT_SUPPORTED');
        }
        // Sistem sesi için getDisplayMedia kullan (video gerekli)
        const constraints: any = {
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            // Bazı tarayıcılarda sekme sesi için gereklidir (ignore if unsupported)
            systemAudio: 'include',
            suppressLocalAudioPlayback: true,
          },
          video: {
            frameRate: 1,
            width: 1,
            height: 1,
            // Kullanıcıya sekme seçtirirken başarılı olma olasılığını artır
            displaySurface: 'browser',
            preferCurrentTab: true,
          } as any,
        };

        stream = await navigator.mediaDevices.getDisplayMedia(constraints);

        // Audio track var mı kontrol et
        const hasAudio = stream.getAudioTracks().length > 0;
        if (!hasAudio) {
          stream.getTracks().forEach(t => t.stop());
          const err: any = new Error('NO_SYSTEM_AUDIO');
          err.code = 'NO_SYSTEM_AUDIO';
          throw err;
        }

        // Video track'leri durdur, yalnızca ses kullan
        stream.getVideoTracks().forEach(track => track.stop());
      } else {
        // Mikrofon için getUserMedia
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

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
    } catch (error: any) {
      console.error('Ses erişim hatası:', error);
      let description = '';
      if (error?.code === 'NO_SYSTEM_AUDIO') {
        description = "Sistem sesine erişim sağlanamadı. Lütfen bir tarayıcı sekmesi seçin ve 'Ses paylaş' kutusunu işaretleyin.";
      } else if (error?.message === 'SYSTEM_NOT_SUPPORTED') {
        description = 'Bu tarayıcıda ekran/ses paylaşımı desteklenmiyor.';
      } else if (error?.name === 'NotAllowedError') {
        description = 'İzin reddedildi. Lütfen ekran paylaşımı iznini verin ve ses paylaşımını seçin.';
      } else if (error?.name === 'NotFoundError') {
        description = 'Uygun ses kaynağı bulunamadı.';
      } else {
        description = audioSource === 'system'
          ? "Sistem sesine erişilemedi. Seçim ekranında bir tarayıcı sekmesi seçip 'Ses paylaş' seçeneğini işaretleyin."
          : 'Mikrofona erişilemedi. Lütfen mikrofon izni verin.';
      }
      toast({ title: 'Hata', description, variant: 'destructive' });
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

      const transcribedText = data?.text?.trim() || '';
      
      if (transcribedText.length === 0) {
        console.log('Boş metin döndü, ses algılanmadı');
        toast({
          title: "Uyarı",
          description: "Ses algılanamadı. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
        return;
      }

      console.log('Transkripsiyon başarılı:', transcribedText);
      onTranscriptionComplete(transcribedText);
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
        {!isMobile && !isRecording && (
          <div className="flex flex-col items-center gap-1 mb-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={audioSource === 'microphone' ? 'default' : 'outline'}
                onClick={() => setAudioSource('microphone')}
                className="gap-2"
              >
                <Mic className="h-4 w-4" />
                Mikrofon
              </Button>
              <Button
                size="sm"
                variant={audioSource === 'system' ? 'default' : 'outline'}
                onClick={() => setAudioSource('system')}
                className="gap-2"
              >
                <Monitor className="h-4 w-4" />
                Sistem Sesi
              </Button>
            </div>
            {audioSource === 'system' && (
              <p className="text-xs text-muted-foreground">
                Bir tarayıcı sekmesi seçin ve 'Ses paylaş' seçeneğini işaretleyin.
              </p>
            )}
          </div>
        )}
        
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
            {audioSource === 'microphone' ? (
              <Mic className="h-14 w-14" />
            ) : (
              <Monitor className="h-14 w-14" />
            )}
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
