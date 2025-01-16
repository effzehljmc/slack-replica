'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { createVoiceModel, getModelStatus } from '@/lib/fishAudioModelService';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Id } from "@/convex/_generated/dataModel";

interface VoiceModelUploadProps {
  apiKey: string;
  userId: Id<"users">;
  onModelCreated: (modelId: string) => void;
}

const ALLOWED_AUDIO_FORMATS = ['audio/wav', 'audio/x-wav', 'audio/mp3', 'audio/mpeg'];
const MAX_FILE_SIZE_MB = 10;
const MIN_DURATION_SEC = 3;
const MAX_DURATION_SEC = 30;

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pl', name: 'Polish' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
] as const;

type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export function VoiceModelUpload({ apiKey, userId, onModelCreated }: VoiceModelUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState('');
  const [modelTitle, setModelTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');

  const updateUserVoiceModel = useMutation(api.users.updateVoiceModel);

  const validateAudioFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check file format
      if (!ALLOWED_AUDIO_FORMATS.includes(file.type)) {
        toast.error('Please upload a WAV or MP3 file');
        resolve(false);
        return;
      }

      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        toast.error(`Audio file must be smaller than ${MAX_FILE_SIZE_MB}MB`);
        resolve(false);
        return;
      }

      // Create a new blob URL
      const blobUrl = URL.createObjectURL(file);
      const audio = new Audio();
      
      const cleanupAndResolve = (result: boolean, message?: string) => {
        URL.revokeObjectURL(blobUrl);
        if (message) {
          toast.error(message);
        }
        resolve(result);
      };

      // Set timeout for loading
      const timeoutId = setTimeout(() => {
        cleanupAndResolve(false, 'Audio file loading timed out. Please try again.');
      }, 5000);

      audio.addEventListener('loadedmetadata', () => {
        clearTimeout(timeoutId);
        const duration = audio.duration;
        setAudioDuration(duration);

        if (isNaN(duration)) {
          cleanupAndResolve(false, 'Invalid audio file duration');
          return;
        }

        if (duration < MIN_DURATION_SEC) {
          cleanupAndResolve(false, `Audio must be at least ${MIN_DURATION_SEC} seconds long`);
        } else if (duration > MAX_DURATION_SEC) {
          cleanupAndResolve(false, `Audio must be no longer than ${MAX_DURATION_SEC} seconds`);
        } else {
          cleanupAndResolve(true);
        }
      });

      audio.addEventListener('error', () => {
        clearTimeout(timeoutId);
        cleanupAndResolve(false, `Failed to load audio file: ${audio.error?.message || 'Unknown error'}`);
      });

      // Start loading the audio
      audio.src = blobUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const isValid = await validateAudioFile(file);
        if (isValid) {
          setAudioFile(file);
        } else {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          setAudioFile(null);
        }
      } catch (error) {
        console.error('Error validating audio file:', error);
        toast.error('Failed to validate audio file');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setAudioFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!audioFile || !transcription.trim() || !modelTitle.trim()) {
      toast.error('Please provide an audio file, transcription, and title');
      return;
    }

    try {
      setIsUploading(true);

      // Validate the audio file again before uploading
      const isValid = await validateAudioFile(audioFile);
      if (!isValid) {
        throw new Error('Audio file validation failed');
      }

      // Read the audio file as ArrayBuffer
      let audioData: ArrayBuffer;
      try {
        audioData = await audioFile.arrayBuffer();
        if (!audioData || audioData.byteLength === 0) {
          throw new Error('Failed to read audio file data');
        }
      } catch (error) {
        console.error('Error reading audio file:', error);
        throw new Error('Failed to read audio file data');
      }

      console.log('Audio data loaded:', {
        size: audioData.byteLength,
        type: audioFile.type,
        duration: audioDuration
      });

      // Create the voice model with language
      const model = await createVoiceModel(apiKey, {
        title: modelTitle,
        description: `AI Avatar voice model for user ${userId} (${selectedLanguage})`,
        audioData,
        transcription: transcription.trim(),
        language: selectedLanguage
      });

      if (!model || !model.id) {
        throw new Error('Invalid response from voice model creation');
      }

      // Poll for model status
      let finalModel = model;
      while (finalModel.status === 'pending') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        finalModel = await getModelStatus(apiKey, model.id);
      }

      if (finalModel.status === 'ready') {
        // Update user's voice model ID
        await updateUserVoiceModel({
          userId,
          modelId: finalModel.id
        });

        onModelCreated(finalModel.id);
        toast.success('Voice model created successfully');

        // Clear form
        setAudioFile(null);
        setTranscription('');
        setModelTitle('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(`Model creation failed with status: ${finalModel.status}`);
      }
    } catch (error) {
      console.error('Failed to create voice model:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create voice model');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="model-title">Model Title</Label>
        <Input
          id="model-title"
          value={modelTitle}
          onChange={(e) => setModelTitle(e.target.value)}
          placeholder="My AI Avatar Voice"
          disabled={isUploading}
        />
      </div>

      <div className="space-y-2">
        <Label>Language</Label>
        <Select
          value={selectedLanguage}
          onValueChange={(value) => setSelectedLanguage(value as LanguageCode)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Select the language of your voice sample
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="audio-file">Voice Sample</Label>
        <Input
          ref={fileInputRef}
          id="audio-file"
          type="file"
          accept=".wav,.mp3"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Upload a clear audio recording of your voice (or the voice you want to use)
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside">
            <li>Format: WAV or MP3</li>
            <li>Size: Up to {MAX_FILE_SIZE_MB}MB</li>
            <li>Duration: {MIN_DURATION_SEC}-{MAX_DURATION_SEC} seconds</li>
            <li>Quality: Clear speech with minimal background noise</li>
          </ul>
          {audioFile && (
            <p className="text-sm">
              Duration: {audioDuration.toFixed(1)} seconds
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transcription">Transcription ({SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name})</Label>
        <Textarea
          id="transcription"
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          placeholder={`Type the exact words spoken in your audio sample (in ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name})...`}
          className="min-h-[100px]"
          disabled={isUploading}
        />
        <p className="text-sm text-muted-foreground">
          Provide an exact transcription of the words spoken in your audio sample, in the selected language
        </p>
      </div>

      <Button
        onClick={handleUpload}
        disabled={isUploading || !audioFile || !transcription.trim() || !modelTitle.trim()}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Voice Model...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Create Voice Model
          </>
        )}
      </Button>
    </div>
  );
} 