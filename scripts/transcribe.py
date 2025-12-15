import argparse
import os
import sys
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

try:
    import whisper
    import torch
except ImportError:
    print("Error: Missing dependencies. Please run:")
    print("pip install openai-whisper torch")
    sys.exit(1)

def format_timestamp(seconds):
    """Converts seconds to [mm:ss.xx] format"""
    minutes = int(seconds // 60)
    remaining_seconds = seconds % 60
    return f"[{minutes:02d}:{remaining_seconds:05.2f}]"

def transcribe_audio(audio_path, model_name="base"):
    """Transcribes audio and returns LRC formatted string"""
    print(f"Loading model '{model_name}'...", file=sys.stderr)
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}", file=sys.stderr)
    
    model = whisper.load_model(model_name, device=device)
    
    print(f"Transcribing '{audio_path}'...", file=sys.stderr)
    result = model.transcribe(audio_path, word_timestamps=False)
    
    lrc_output = []
    
    for segment in result["segments"]:
        start_time = segment["start"]
        text = segment["text"].strip()
        timestamp = format_timestamp(start_time)
        lrc_line = f"{timestamp} {text}"
        lrc_output.append(lrc_line)
        
    return "\n".join(lrc_output)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transcribe audio to LRC format using OpenAI Whisper")
    parser.add_argument("audio_file", help="Path to the audio file")
    parser.add_argument("--model", default="base", help="Whisper model to use (tiny, base, small, medium, large)")
    parser.add_argument("--output", "-o", help="Output file path (optional, defaults to stdout)")
    
    args = parser.parse_args()
    
    if args.audio_file.startswith('http'):
        import urllib.request
        import tempfile
        
        print(f"Downloading audio from {args.audio_file}...", file=sys.stderr)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
            urllib.request.urlretrieve(args.audio_file, temp_audio.name)
            audio_path = temp_audio.name
            
        try:
            lrc_content = transcribe_audio(audio_path, args.model)
            
            if args.output:
                with open(args.output, "w", encoding="utf-8") as f:
                    f.write(lrc_content)
                print(f"Transcription saved to {args.output}", file=sys.stderr)
            else:
                print(lrc_content)
        finally:
            os.unlink(audio_path)
            
    elif not os.path.exists(args.audio_file):
        print(f"Error: File '{args.audio_file}' not found.")
        sys.exit(1)
    else:
        try:
            lrc_content = transcribe_audio(args.audio_file, args.model)
            
            if args.output:
                with open(args.output, "w", encoding="utf-8") as f:
                    f.write(lrc_content)
                print(f"Transcription saved to {args.output}", file=sys.stderr)
            else:
                print(lrc_content)
                
        except Exception as e:
            print(f"An error occurred: {e}", file=sys.stderr)
            sys.exit(1)
