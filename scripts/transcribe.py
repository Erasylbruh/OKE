import argparse
import os
import sys
import warnings
import json
import whisper
import torch

# Suppress warnings
warnings.filterwarnings("ignore")

def transcribe_audio(audio_path, model_name="base"):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = whisper.load_model(model_name, device=device)
    
    # word_timestamps=True улучшает точность, если модель поддерживает
    result = model.transcribe(audio_path, word_timestamps=False)
    
    output_data = []
    
    for i, segment in enumerate(result["segments"]):
        output_data.append({
            "id": i,
            "text": segment["text"].strip(),
            "start": segment["start"],
            "end": segment["end"] # Whisper дает точное время конца!
        })
        
    return json.dumps(output_data, ensure_ascii=False)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("audio_file")
    parser.add_argument("--model", default="base")
    
    args = parser.parse_args()
    
    if os.path.exists(args.audio_file):
        try:
            json_output = transcribe_audio(args.audio_file, args.model)
            print(json_output) # Печатаем JSON в stdout
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)
    else:
        sys.exit(1)
