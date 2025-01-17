'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
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

export function VoiceModelUpload({ userId, onModelCreated }: VoiceModelUploadProps) {
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

      // Create FormData for the request
      const formData = new FormData();
      formData.append('voices', audioFile);
      formData.append('title', modelTitle);
      formData.append('texts', transcription.trim());
      formData.append('language', selectedLanguage);

      console.log('[Debug - VoiceModelUpload] Sending request with:', {
        title: modelTitle,
        language: selectedLanguage,
        audioFileName: audioFile.name,
        audioFileType: audioFile.type,
        audioFileSize: audioFile.size,
        transcriptionLength: transcription.trim().length
      });

      // Send request to our API endpoint
      const response = await fetch('/api/voice-model', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Debug - VoiceModelUpload] API error response:', error);
        throw new Error(error.error || 'Failed to create voice model');
      }

      const model = await response.json();
      console.log('[Debug - VoiceModelUpload] API response:', model);

      if (!model || typeof model !== 'object') {
        console.error('[Debug - VoiceModelUpload] Invalid response data:', model);
        throw new Error('Invalid response from voice model creation');
      }

      if (!model.id || typeof model.id !== 'string') {
        console.error('[Debug - VoiceModelUpload] Missing model ID in response:', model);
        throw new Error('Missing model ID in response');
      }

      // Update user's voice model ID
      await updateUserVoiceModel({
        userId,
        modelId: model.id
      });

      onModelCreated(model.id);
      toast.success('Voice model created successfully');

      // Clear form
      setAudioFile(null);
      setTranscription('');
      setModelTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('[Debug - VoiceModelUpload] Error:', error);
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