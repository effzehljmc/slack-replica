'use client'

import { useState, useEffect } from 'react'
import { Check, Save, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/features/auth/hooks/use-current-user"
import { useRouter } from 'next/navigation'
import { VoiceModelUpload } from './VoiceModelUpload';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const personalityStyles = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'formal', label: 'Formal' }
]

const traits = [
  { id: 'empathetic', label: 'Empathetic' },
  { id: 'analytical', label: 'Analytical' },
  { id: 'creative', label: 'Creative' },
  { id: 'direct', label: 'Direct' },
  { id: 'supportive', label: 'Supportive' },
  { id: 'proactive', label: 'Proactive' }
]

const voiceOptions = [
  { value: 'default', label: 'Default Voice' },
  { value: 'en_female_1', label: 'English Female 1' },
  { value: 'en_female_2', label: 'English Female 2' },
  { value: 'en_male_1', label: 'English Male 1' },
  { value: 'en_male_2', label: 'English Male 2' },
];

// Helper to parse the style string and determine if it's a predefined style or custom
function parseStyleString(style?: string): { type: string; custom?: string } {
  if (!style) return { type: 'professional' };
  
  // Check if it matches our predefined styles
  const styleMatch = style.match(/You are (\w+) and/);
  if (styleMatch && personalityStyles.some(s => s.value === styleMatch[1].toLowerCase())) {
    return { type: styleMatch[1].toLowerCase() };
  }
  
  // If no match or different format, treat as custom
  return { type: 'custom', custom: style };
}

export default function AIAvatarSettings() {
  const { data: user } = useCurrentUser();
  const router = useRouter();
  const enableAutoAvatar = useMutation(api.rag.enableAutoAvatar);
  const updateVoiceDescription = useMutation(api.users.updateVoiceDescription);
  const setCustomVoiceModel = useMutation(api.users.setCustomVoiceModel);

  const [isEnabled, setIsEnabled] = useState(user?.autoAvatarEnabled ?? false);
  const [isSaved, setIsSaved] = useState(false);
  const [voiceDescription, setVoiceDescription] = useState(user?.voiceDescription ?? '');
  const [voiceId, setVoiceId] = useState(user?.voiceId ?? 'default');
  
  // Initialize personality style from user settings
  const parsedStyle = parseStyleString(user?.avatarStyle);
  const [personality, setPersonality] = useState(parsedStyle.type);
  const [customStyle, setCustomStyle] = useState(parsedStyle.custom ?? '');
  const [selectedTraits, setSelectedTraits] = useState<string[]>(user?.avatarTraits ?? []);
  const [showVoiceModelUpload, setShowVoiceModelUpload] = useState(false);

  // Update states when user data changes
  useEffect(() => {
    setIsEnabled(user?.autoAvatarEnabled ?? false);
    const parsed = parseStyleString(user?.avatarStyle);
    setPersonality(parsed.type);
    setCustomStyle(parsed.custom ?? '');
    setSelectedTraits(user?.avatarTraits ?? []);
    setVoiceDescription(user?.voiceDescription ?? '');
    setVoiceId(user?.voiceId ?? 'default');
  }, [user]);

  const handleSave = async () => {
    if (!user?._id) return;

    try {
      // Check if selected voiceId is a custom model ID (32 characters)
      const isCustomModel = voiceId?.length === 32;
      
      await enableAutoAvatar({
        userId: user._id,
        enabled: isEnabled,
        style: personality === 'custom' 
          ? customStyle 
          : `You are ${personality} and like to keep responses concise`,
        traits: isEnabled ? selectedTraits : [],
        voiceId: isEnabled ? (isCustomModel ? undefined : voiceId) : undefined,
        voiceDescription: isEnabled ? voiceDescription.trim() : undefined,
      });
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save avatar settings:', error);
    }
  }

  const handleTraitToggle = (traitId: string) => {
    setSelectedTraits(prev => 
      prev.includes(traitId)
        ? prev.filter(id => id !== traitId)
        : [...prev, traitId]
    )
  }

  const handleApplyLukasVoice = async () => {
    if (!user?._id) {
      console.error('[Debug] No user ID available');
      toast.error('User not found');
      return;
    }
    
    const modelId = '6a5f12ab1ebd4952afe776a80d4f3307';
    const debugInfo = {
      userId: user._id,
      currentVoiceId: user.voiceId,
      currentModelId: user.voiceModelId,
      isEnabled,
      isSaved
    };
    console.log('[Debug] Starting handleApplyLukasVoice', debugInfo);

    // Check if voice model is already set
    if (user.voiceModelId === modelId) {
      const message = 'Lukas voice is already set! Click Save Settings to ensure your changes are saved.';
      console.log('[Debug] Voice already set:', message);
      toast.success(message, {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    try {
      console.log('[Debug] Calling setCustomVoiceModel mutation');
      const result = await setCustomVoiceModel({ userId: user._id });
      console.log('[Debug] Mutation result:', result);
      
      console.log('[Debug] Updating local voiceId state');
      setVoiceId(modelId);
      
      const successMessage = 'Lukas voice model applied! Click Save Settings to save your changes.';
      console.log('[Debug] Showing success toast:', successMessage);
      toast.success(successMessage, {
        duration: 4000,
        position: 'top-center',
      });
      
      // Set saved state to false to indicate changes need to be saved
      setIsSaved(false);
      
      console.log('[Debug] handleApplyLukasVoice completed successfully');
    } catch (error) {
      console.error('[Debug] Failed to apply voice model:', error);
      toast.error('Failed to apply voice model', {
        duration: 4000,
        position: 'top-center',
      });
    }
  };

  return (
    <>
      <Toaster />
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-6 top-6"
            onClick={() => router.push('/app')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-center">AI Avatar Settings</CardTitle>
          <CardDescription className="text-center">
            Customize how your AI avatar behaves and responds in conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-toggle">Enable AI Avatar</Label>
              <p className="text-sm text-muted-foreground">
                Allow AI to automatically generate responses based on your style
              </p>
            </div>
            <Switch
              id="ai-toggle"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          {/* Personality Style Selection */}
          <div className="space-y-2">
            <Label>Personality Style</Label>
            <Select
              value={personality}
              onValueChange={setPersonality}
              disabled={!isEnabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a personality style" />
              </SelectTrigger>
              <SelectContent>
                {personalityStyles.map(style => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trait Selection */}
          <div className="space-y-3">
            <Label>Personality Traits</Label>
            <div className="grid grid-cols-2 gap-4">
              {traits.map(trait => (
                <div key={trait.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={trait.id}
                    checked={selectedTraits.includes(trait.id)}
                    onCheckedChange={() => handleTraitToggle(trait.id)}
                    disabled={!isEnabled}
                  />
                  <label
                    htmlFor={trait.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {trait.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Style Description */}
          {personality === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customStyle">Custom Style Description</Label>
              <Textarea
                id="customStyle"
                placeholder="Describe your custom style (e.g., 'You are witty but professional, and like to use analogies')"
                className="min-h-[100px]"
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                disabled={!isEnabled}
              />
              <p className="text-sm text-muted-foreground">
                This will help your AI avatar understand your preferred style
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Voice Settings</h3>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyLukasVoice}
                >
                  Apply Lukas Voice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVoiceModelUpload(!showVoiceModelUpload)}
                >
                  {showVoiceModelUpload ? 'Hide Upload' : 'Upload Custom Voice'}
                </Button>
              </div>
            </div>

            {showVoiceModelUpload && user?._id && (
              <VoiceModelUpload
                apiKey={process.env.NEXT_PUBLIC_FISH_AUDIO_API_KEY || ''}
                userId={user._id}
                onModelCreated={(modelId) => {
                  setVoiceId(modelId);
                  setShowVoiceModelUpload(false);
                }}
              />
            )}

            <div className="space-y-2">
              <Label>Voice Selection</Label>
              <Select
                value={voiceId}
                onValueChange={setVoiceId}
                disabled={!isEnabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Default Voices</SelectLabel>
                    <SelectItem value="default">Default Male Voice</SelectItem>
                    <SelectItem value="en_female_1">Female Voice 1</SelectItem>
                    <SelectItem value="en_female_2">Female Voice 2</SelectItem>
                    <SelectItem value="en_male_1">Male Voice 1</SelectItem>
                    <SelectItem value="en_male_2">Male Voice 2</SelectItem>
                  </SelectGroup>
                  {user?.voiceModelId && (
                    <SelectGroup>
                      <SelectLabel>Custom Voice</SelectLabel>
                      <SelectItem value={user.voiceModelId}>
                        My Custom Voice
                      </SelectItem>
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Voice Instructions</Label>
              <Textarea
                value={voiceDescription}
                onChange={(e) => setVoiceDescription(e.target.value)}
                placeholder="Add instructions for how the voice should sound (e.g., cheerful, professional, etc.)"
                className="min-h-[100px]"
                disabled={!isEnabled}
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            className="w-full"
          >
            {isSaved ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Saved
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </>
  )
} 