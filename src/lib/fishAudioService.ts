import { encode, decode } from '@msgpack/msgpack';

export interface AudioOptions {
  text: string;
  language: string;
  voice_id?: string;
  reference_id?: string;
  speed?: number;
  pitch?: number;
  voice_instructions?: string;
}

interface CreditResponse {
  credit: number;
}

export async function checkApiCredit(apiKey: string): Promise<number> {
  console.log('Checking API credit with key length:', apiKey.length);
  try {
    const response = await fetch('https://api.fish.audio/v1/wallet/credit', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/msgpack',
        'Accept': 'application/msgpack',
      },
    });

    if (!response.ok) {
      let errorMessage: string;
      const clonedResponse = response.clone();
      try {
        const errorData = await response.arrayBuffer().then(buffer => decode(buffer) as Record<string, unknown>);
        errorMessage = JSON.stringify(errorData);
      } catch {
        errorMessage = await clonedResponse.text();
      }
      console.error('Error checking API credit:', errorMessage);
      throw new Error(`Failed to check API credit: ${errorMessage}`);
    }

    const data = await response.arrayBuffer().then(buffer => decode(buffer) as CreditResponse);
    console.log('Credit check response:', data);
    return data.credit;
  } catch (error) {
    console.error('Error checking API credit:', error);
    throw error;
  }
}

export async function generateSpeech(apiKey: string, options: AudioOptions): Promise<ArrayBuffer> {
  console.log('[Debug - Fish Audio] Starting speech generation with full options:', {
    ...options,
    text: options.text.substring(0, 100) + '...',
    apiKeyLength: apiKey.length,
    apiKeyPreview: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
  });
  
  try {
    // Build the request body using reference_id for custom models
    const requestBody = {
      text: options.text,
      language: options.language,
      speed: options.speed || 1.0,
      pitch: options.pitch || 1.0,
      voice_instructions: options.voice_instructions,
      ...(options.reference_id ? { reference_id: options.reference_id } : { voice_id: options.voice_id })
    };

    console.log('[Debug - Fish Audio] Full request body:', {
      ...requestBody,
      text: requestBody.text.substring(0, 50) + '...',
      hasReferenceId: !!options.reference_id,
      hasVoiceId: !options.reference_id && !!options.voice_id,
      referenceId: options.reference_id,
      voiceId: !options.reference_id ? options.voice_id : undefined
    });

    const msgpackData = encode(requestBody);
    console.log('[Debug - Fish Audio] MessagePack data size:', msgpackData.byteLength);

    console.log('[Debug - Fish Audio] Making API request to Fish Audio with headers:', {
      'Content-Type': 'application/msgpack',
      'Accept': 'application/msgpack',
      'Authorization': 'Bearer [HIDDEN]'
    });

    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/msgpack',
        'Accept': 'application/msgpack',
      },
      body: msgpackData,
    });

    console.log('[Debug - Fish Audio] Response status:', response.status);
    const headerObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headerObj[key] = value;
    });
    console.log('[Debug - Fish Audio] Response headers:', headerObj);

    if (!response.ok) {
      let errorMessage: string;
      const clonedResponse = response.clone();
      try {
        const errorData = await response.arrayBuffer().then(buffer => decode(buffer) as Record<string, unknown>);
        errorMessage = JSON.stringify(errorData);
      } catch {
        errorMessage = await clonedResponse.text();
      }
      console.error('[Debug - Fish Audio] Error response:', errorMessage);
      throw new Error(`Failed to generate speech: ${errorMessage}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('[Debug - Fish Audio] Successfully received audio buffer:', {
      size: audioBuffer.byteLength,
      isValidBuffer: audioBuffer.byteLength > 0,
      contentType: headerObj['content-type']
    });
    return audioBuffer;
  } catch (error) {
    console.error('[Debug - Fish Audio] Error in generateSpeech:', error);
    throw error;
  }
} 