import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

interface PythonResult {
  error?: string;
  id?: string;
  status?: string;
}

export async function POST(request: Request) {
  try {
    console.log('[Debug - Voice Model API] Starting voice model creation');
    const formData = await request.formData();
    
    // Log form data contents (excluding actual file data)
    console.log('[Debug - Voice Model API] Form data received:', {
      hasAudioFile: formData.has('voices'),
      audioFileName: formData.get('voices') instanceof File ? (formData.get('voices') as File).name : null,
      audioFileType: formData.get('voices') instanceof File ? (formData.get('voices') as File).type : null,
      audioFileSize: formData.get('voices') instanceof File ? (formData.get('voices') as File).size : null,
      title: formData.get('title'),
      transcription: formData.get('texts'),
      language: formData.get('language')
    });

    const audioFile = formData.get('voices') as File;
    const title = formData.get('title') as string;
    const transcription = formData.get('texts') as string;
    const language = formData.get('language') as string;

    if (!audioFile || !title || !transcription) {
      console.error('[Debug - Voice Model API] Missing required fields:', {
        hasAudioFile: !!audioFile,
        hasTitle: !!title,
        hasTranscription: !!transcription
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!audioFile.type.includes('audio/')) {
      console.error('[Debug - Voice Model API] Invalid file type:', audioFile.type);
      return NextResponse.json(
        { error: 'Invalid file type. Must be an audio file.' },
        { status: 400 }
      );
    }

    // Create a temporary file for the audio
    const tempDir = tmpdir();
    const tempFilePath = join(tempDir, `${randomUUID()}_${audioFile.name}`);
    
    console.log('[Debug - Voice Model API] Writing audio file to:', tempFilePath);
    await writeFile(tempFilePath, Buffer.from(await audioFile.arrayBuffer()));

    // Run the Python script
    console.log('[Debug - Voice Model API] Running Python script');
    const pythonScript = join(process.cwd(), 'src/app/api/voice-model/create_model.py');
    
    const result = await new Promise<PythonResult>((resolve, reject) => {
      let outputData = '';
      let errorData = '';

      const pythonProcess = spawn('python3', [
        pythonScript,
        process.env.FISH_AUDIO_API_KEY || '',
        tempFilePath,
        title,
        transcription,
        language
      ]);

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
        console.error('[Debug - Voice Model API] Python error:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        console.log('[Debug - Voice Model API] Python script finished with code:', code);
        console.log('[Debug - Voice Model API] Python output:', outputData);
        
        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}: ${errorData}`));
          return;
        }

        try {
          // Parse the last line of output as JSON
          const lines = outputData.trim().split('\n');
          const result = JSON.parse(lines[lines.length - 1]);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error}`));
        }
      });
    });

    // Clean up the temporary file
    try {
      await unlink(tempFilePath);
    } catch (error) {
      console.error('[Debug - Voice Model API] Failed to delete temp file:', error);
    }

    if ('error' in result) {
      console.error('[Debug - Voice Model API] Error from Python script:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[Debug - Voice Model API] Success:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Debug - Voice Model API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create voice model' },
      { status: 500 }
    );
  }
} 