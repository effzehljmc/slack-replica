import { action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { generateSpeech, AudioOptions } from "../src/lib/fishAudioService";
import { internal } from "./_generated/api";

export const synthesizeSpeech = action({
  args: {
    text: v.string(),
    userId: v.id("users"),
    messageId: v.union(v.id("messages"), v.id("direct_messages")),
  },
  handler: async (ctx, { text, userId, messageId }) => {
    // Get user's voice settings
    const user = await ctx.runQuery(internal.users.getUser, { userId });
    if (!user) {
      console.log('User not found for voice synthesis:', userId);
      return null;
    }

    try {
      // Build audio options based on whether we have a custom model or standard voice
      const audioOptions: AudioOptions = {
        text,
        language: 'en',
        voice_instructions: user.voiceDescription?.trim()
      };

      // If user has a custom model, use reference_id
      if (user.voiceModelId) {
        audioOptions.reference_id = user.voiceModelId;
        console.log('Using custom voice model:', {
          reference_id: user.voiceModelId,
          voice_instructions: audioOptions.voice_instructions
        });
      } else {
        // Otherwise use standard voice_id with fallback
        audioOptions.voice_id = user.voiceId || 'en_male_2';
        console.log('Using standard voice:', {
          voice_id: audioOptions.voice_id,
          voice_instructions: audioOptions.voice_instructions
        });
      }

      // Get the API key from Convex environment variables
      const apiKey = process.env.FISH_AUDIO_API_KEY;
      if (!apiKey) {
        console.error('FISH_AUDIO_API_KEY not set in Convex environment');
        throw new Error('Fish Audio API key not configured');
      }

      const audioBuffer = await generateSpeech(apiKey, audioOptions);
      console.log('Audio buffer received, size:', audioBuffer.byteLength);

      // Convert ArrayBuffer to Blob for storage
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      console.log('Audio blob created, size:', audioBlob.size);
      
      // Store in Convex storage
      const storageId = await ctx.storage.store(audioBlob);
      console.log('Audio stored in Convex, storageId:', storageId);
      
      // Update message with audio reference
      await ctx.runMutation(internal.messages.updateMessageAudio, { 
        messageId, 
        storageId 
      });
      console.log('Message updated with audio reference');

      return { success: true, storageId };
    } catch (error) {
      console.error('TTS generation failed:', error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate speech' };
    }
  }
}); 