import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('İstek alındı');
    const { audio } = await req.json();
    
    if (!audio) {
      console.error('Ses verisi boş');
      throw new Error('Ses verisi bulunamadı');
    }

    console.log('Ses verisi alındı, uzunluk:', audio.length);
    
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error('OPENAI_API_KEY bulunamadı');
      throw new Error('API anahtarı yapılandırılmamış');
    }

    console.log('Ses işleniyor...');
    const binaryAudio = processBase64Chunks(audio);
    console.log('Binary ses boyutu:', binaryAudio.length);
    
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'tr');

    console.log('OpenAI Whisper API\'ye gönderiliyor...');
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    console.log('OpenAI yanıt durumu:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API hatası:', response.status, errorText);
      throw new Error(`OpenAI API hatası (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('Transkripsiyon başarılı, metin uzunluğu:', result.text?.length || 0);
    console.log('Metin:', result.text);

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function hatası:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    console.error('Hata mesajı:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
