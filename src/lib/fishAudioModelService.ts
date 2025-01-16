import { encode, decode } from '@msgpack/msgpack';

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
}

export async function createVoiceModel(apiKey: string, options: CreateModelOptions): Promise<ModelResponse> {
  console.log('Creating voice model:', {
    title: options.title,
    description: options.description,
    audioSize: options.audioData.byteLength,
    transcriptionLength: options.transcription.length,
    language: options.language
  });

  try {
    const requestBody = {
      title: options.title,
      description: options.description,
      voices: [options.audioData],
      texts: [options.transcription],
      language: options.language || 'en'
    };

    console.log('Making model creation request with body:', {
      ...requestBody,
      voices: `[ArrayBuffer of size ${options.audioData.byteLength}]`
    });

    const response = await fetch('https://api.fish.audio/v1/model', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/msgpack',
        'Accept': 'application/msgpack',
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type,accept'
      },
      mode: 'cors',
      credentials: 'include',
      body: encode(requestBody),
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
      console.error('Error creating voice model:', errorMessage);
      throw new Error(`Failed to create voice model: ${errorMessage}`);
    }

    const data = await response.arrayBuffer().then(buffer => decode(buffer) as ModelResponse);
    console.log('Model creation response:', data);
    return data;
  } catch (error) {
    console.error('Error creating voice model:', error);
    throw error;
  }
}

export async function getModelStatus(apiKey: string, modelId: string): Promise<ModelResponse> {
  try {
    const response = await fetch(`https://api.fish.audio/v1/model/${modelId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/msgpack',
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,accept'
      },
      mode: 'cors',
      credentials: 'include',
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