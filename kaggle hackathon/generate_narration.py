import os
import json
import base64
import struct
import requests
import time 

# ==========================================
# 設定エリア
# ==========================================

# Gemini APIキー (環境変数から取得、なければ直接入力してください)
API_KEY = "AIzaSyDOUOZ3kYvqJtB0Z5jOFKqsgNRatmeKqzw"

# 使用するモデル
MODEL_NAME = "gemini-2.5-flash-preview-tts"

# 声の設定 (利用可能な声: Kore, Fenrir, Puck, Zephyr など)
# Kore: 落ち着いた女性の声 (プレゼン向き)
# Fenrir: 深みのある男性の声
VOICE_NAME = "Kore"

# 26個の文を順番に定義
# キー名はファイル名のプレフィックスとして使用されます
SCRIPTS = {
    # Part 1: Problem (6 files)
    "01_01_problem": "Japan is facing a crisis that the whole world will soon follow.",
    "01_02_problem": "A super-aging society.",
    "01_03_problem": "Doctors are overwhelmed.",
    "01_04_problem": "Patients struggle to communicate their symptoms accurately.",
    "01_05_problem": "This communication gap leads to misdiagnosis and burnout.",
    "01_06_problem": "We need a bridge.",
    
    # Part 2: Solution (7 files)
    "02_01_solution": "Enter Karutto.",
    "02_02_solution": "I didn't write a single line of UI code manually.",
    "02_03_solution": "I used Vibe Coding.",
    "02_04_solution": "I simply showed Gemini 3 Pro a sketch,",
    "02_05_solution": "and it built a trustworthy, medical-grade interface instantly.",
    "02_06_solution": "I instructed it to use its advanced reasoning capabilities for triage,",
    "02_07_solution": "and localized it for Japanese seniors in seconds.",
    
    # Part 3: Demo (7 files)
    "03_01_demo": "Listen to the nuance.",
    "03_02_demo": "The user speaks naturally in Japanese.",
    "03_03_demo": "Gemini doesn't just transcribe.",
    "03_04_demo": "It reasons.",
    "03_05_demo": "It identifies the 'Red Flag' of appendicitis from the vague description,",
    "03_06_demo": "and structures it for the doctor.",
    "03_07_demo": "Bilingual output ensures global transparency.",
    
    # Part 4: Vision (6 files)
    "04_01_vision": "Karutto isn't just an app.",
    "04_02_vision": "It's an efficiency engine for the overwhelmed healthcare system.",
    "04_03_vision": "Privacy is paramount.",
    "04_04_vision": "No data is stored without consent.",
    "04_05_vision": "We are bridging the gap, one summary at a time.",
    "04_06_vision": "Thank you."
}

# ==========================================
# 関数定義
# ==========================================

def pcm_to_wav(pcm_data, sample_rate=24000, num_channels=1):
    """PCMデータをWAVフォーマットに変換"""
    byte_count = len(pcm_data)
    header = b'RIFF'
    header += struct.pack('<I', 36 + byte_count)
    header += b'WAVE'
    header += b'fmt '
    header += struct.pack('<I', 16)
    header += struct.pack('<H', 1)
    header += struct.pack('<H', num_channels)
    header += struct.pack('<I', sample_rate)
    header += struct.pack('<I', sample_rate * num_channels * 2)
    header += struct.pack('<H', num_channels * 2)
    header += struct.pack('<H', 16)
    header += b'data'
    header += struct.pack('<I', byte_count)
    return header + pcm_data

def generate_audio_file(text, filename):
    """1つのファイルを生成して保存"""
    if not API_KEY:
        print("エラー: APIキーが設定されていません。")
        return False

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={API_KEY}"
    
    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {"voiceName": VOICE_NAME}
                }
            }
        }
    }

    try:
        # APIレート制限への配慮
        time.sleep(1) 
        
        response = requests.post(url, headers={"Content-Type": "application/json"}, json=payload)
        response.raise_for_status()
        result = response.json()
        
        inline_data = result["candidates"][0]["content"]["parts"][0]["inlineData"]
        pcm_data = base64.b64decode(inline_data["data"])
        
        # サンプリングレート取得
        sample_rate = 24000
        if "rate=" in inline_data["mimeType"]:
            try:
                sample_rate = int(inline_data["mimeType"].split("rate=")[1])
            except:
                pass

        wav_data = pcm_to_wav(pcm_data, sample_rate=sample_rate)
        
        with open(filename, "wb") as f:
            f.write(wav_data)
        
        print(f"OK: {os.path.basename(filename)}")
        return True

    except Exception as e:
        print(f"Error ({os.path.basename(filename)}): {e}")
        return False

# ==========================================
# メイン処理
# ==========================================

if __name__ == "__main__":
    print(f"=== Gemini TTS 26分割生成ツール ({MODEL_NAME}) ===")
    
    output_dir = "narration_26files"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    total_files = 0
    
    # 辞書の順序を保持して処理
    for file_key, text in SCRIPTS.items():
        filename = os.path.join(output_dir, f"{file_key}.wav")
        if generate_audio_file(text, filename):
            total_files += 1

    print(f"\n完了！ 合計 {total_files} 個のファイルを '{output_dir}' に保存しました。")