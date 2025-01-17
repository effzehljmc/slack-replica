import os
import requests
import json
import sys

def create_voice_model(api_key, audio_file_path, title, transcription, language=None):
    try:
        print(f"[Debug] API Key length: {len(api_key)}", flush=True)
        print(f"[Debug] Audio file exists: {os.path.exists(audio_file_path)}", flush=True)
        print(f"[Debug] Audio file size: {os.path.getsize(audio_file_path)} bytes", flush=True)

        # Create the data list exactly as shown in the documentation
        data = [
            ("visibility", "private"),
            ("type", "tts"),
            ("title", title),
            ("train_mode", "fast"),
            ("enhance_audio_quality", "true"),
            ("texts", transcription)
        ]
        
        # Add language if provided
        if language:
            data.append(("language", language))

        # Log request data without converting tuples to dict
        print("[Debug] Request data:", flush=True)
        print("Data:", data, flush=True)
        print("Title:", title, flush=True)
        print("Transcription:", transcription, flush=True)
        print("Language:", language, flush=True)

        # Create the files list with explicit file name
        file_obj = open(audio_file_path, "rb")
        files = [
            ("voices", (os.path.basename(audio_file_path), file_obj, "audio/wav"))
        ]

        try:
            print("[Debug] Making request to Fish Audio API", flush=True)
            response = requests.post(
                "https://api.fish.audio/model",
                files=files,
                data=data,
                headers={
                    "Authorization": f"Bearer {api_key}",
                },
            )
            
            print(f"[Debug] Response status: {response.status_code}", flush=True)
            print(f"[Debug] Response headers: {response.headers}", flush=True)
            
            response_text = response.text
            print(f"[Debug] Raw response text: {response_text}", flush=True)

            if not response.ok:
                error_message = {
                    "error": response_text,
                    "status": response.status_code
                }
                return error_message

            try:
                result = response.json()
                print(f"[Debug] Parsed JSON response: {result}", flush=True)
                
                if not isinstance(result, dict) or '_id' not in result:
                    error_message = {
                        "error": "Invalid response format from Fish Audio API",
                        "received": result
                    }
                    return error_message
                    
                # Convert _id to id in the response
                result['id'] = result['_id']
                del result['_id']
                    
                return result
                
            except json.JSONDecodeError as e:
                error_message = {
                    "error": f"Failed to parse response as JSON: {str(e)}",
                    "response_text": response_text
                }
                return error_message
            
        except requests.exceptions.RequestException as e:
            return {
                "error": f"Request failed: {str(e)}"
            }
            
    except Exception as e:
        return {
            "error": f"Error in create_voice_model: {str(e)}"
        }
    finally:
        # Make sure to close the file
        try:
            file_obj.close()
        except:
            pass

if __name__ == "__main__":
    # Get arguments from command line
    api_key = sys.argv[1]
    audio_file_path = sys.argv[2]
    title = sys.argv[3]
    transcription = sys.argv[4]
    language = sys.argv[5] if len(sys.argv) > 5 else None
    
    # Run the model creation and print the result as a single JSON object
    result = create_voice_model(api_key, audio_file_path, title, transcription, language)
    print(json.dumps(result)) 