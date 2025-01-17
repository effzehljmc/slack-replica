import { decode } from '@msgpack/msgpack';

export interface ModelResponse {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'ready' | 'failed';
}

export interface CreateModelOptions {
  title: string;
  description: string;
  audioData: ArrayBuffer;
  transcription: string;
  language?: string;
  coverImage?: ArrayBuffer;  // Optional cover image
}

export async function createVoiceModel(apiKey: string, options: CreateModelOptions): Promise<ModelResponse> {
  console.log('[Debug - Fish Audio Service] Starting voice model creation:', {
    title: options.title,
    description: options.description,
    audioSize: options.audioData.byteLength,
    transcriptionLength: options.transcription.length,
    language: options.language,
    hasCoverImage: !!options.coverImage
  });

  try {
    // Create a FormData instance
    const formData = new FormData();
    
    // Add the audio fil
    const audioBlob = new Blob([options.audioData], { type: 'audio/wav' });
    const audioFile = new File([audioBlob], 'voice.wav', { type: 'audio/wav' });
    formData.append('voices', audioFile);
    
    // Add metadata as separate form fields
    formData.append('visibility', 'private');
    formData.append('type', 'tts');
    formData.append('title', options.title);
    formData.append('train_mode', 'fast');
    formData.append('enhance_audio_quality', 'true');
    formData.append('texts', options.transcription);
    
    if (options.language) {
      formData.append('language', options.language);
    }

    // Add cover image if provided
    if (options.coverImage) {
      const imageBlob = new Blob([options.coverImage], { type: 'image/jpeg' });
      const imageFile = new File([imageBlob], 'cover.jpg', { type: 'image/jpeg' });
      formData.append('cover_image', imageFile);
    }

    // Log the form data contents for debugging
    console.log('[Debug - Fish Audio Service] Form data contents:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File (${value.name}, ${value.type}, ${value.size} bytes)`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    console.log('[Debug - Fish Audio Service] Making API request');
    const response = await fetch('https://api.fish.audio/model', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      mode: 'cors',
      body: formData,
    });

    console.log('[Debug - Fish Audio Service] Response status:', response.status);
    console.log('[Debug - Fish Audio Service] Response headers:', Object.fromEntries(response.headers.entries()));

    // Always try to get the response text first for debugging
    const responseText = await response.text();
    console.log('[Debug - Fish Audio Service] Raw response:', responseText);

    if (!response.ok) {
      console.error('[Debug - Fish Audio Service] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      throw new Error(`Failed to create voice model: ${responseText}`);
    }

    // Try to parse the response as JSON
    let data: ModelResponse;
    try {
      data = JSON.parse(responseText) as ModelResponse;
    } catch (parseError) {
      console.error('[Debug - Fish Audio Service] Failed to parse response as JSON:', {
        responseText,
        parseError
      });
      throw new Error('Invalid response format from Fish Audio API');
    }

    // Validate the response data
    if (!data || typeof data !== 'object') {
      console.error('[Debug - Fish Audio Service] Invalid response data:', data);
      throw new Error('Invalid response data from Fish Audio API');
    }

    if (!data.id || typeof data.id !== 'string') {
      console.error('[Debug - Fish Audio Service] Missing or invalid model ID:', data);
      throw new Error('Missing model ID in response');
    }

    console.log('[Debug - Fish Audio Service] Model creation successful:', data);
    return data;
  } catch (error) {
    console.error('[Debug - Fish Audio Service] Error in createVoiceModel:', error);
    throw error;
  }
}

export async function getModelStatus(apiKey: string, modelId: string): Promise<ModelResponse> {
  try {
    const response = await fetch(`https://api.fish.audio/model/${modelId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/msgpack'
      },
      mode: 'cors'
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
      console.error('Error getting model status:', errorMessage);
      throw new Error(`Failed to get model status: ${errorMessage}`);
    }

    const data = await response.arrayBuffer().then(buffer => decode(buffer) as ModelResponse);
    console.log('Model status:', data);
    return data;
  } catch (error) {
    console.error('Error getting model status:', error);
    throw error;
  }
} 