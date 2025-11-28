import os
import io
import re
import json
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- PDF用ライブラリ ---
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import mm

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    font_path = os.path.join(current_dir, "ipaexg.ttf")
    pdfmetrics.registerFont(TTFont('IPAexGothic', font_path))
except Exception:
    pass

# ★重要: JSONで出力するように指示
system_instruction = """
あなたは医療秘書AIです。
ユーザーの入力した症状を分析し、JSON形式でデータを出力してください。
"""
model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

class UserRequest(BaseModel):
    text: str
    language: str = "Japanese"

@app.post("/analyze")
async def analyze_symptoms(request: UserRequest):
    try:
        # 日本語の場合は説明を省くロジック
        explanation_instruction = ""
        if request.language != "Japanese" and request.language != "日本語":
             explanation_instruction = f"2. `explanation`: ユーザーへの説明を{request.language}で記述（AIの理解を伝えるため）。"
        else:
             explanation_instruction = "2. `explanation`: 空文字（\"\"）にしてください（日本語ユーザーには説明不要なため）。"

        prompt = f"""
        以下の患者の訴えを分析し、以下のJSONフォーマットのみを出力してください。Markdown記法は含めないでください。

        対象テキスト:
        {request.text}
        
        ユーザーの使用言語: {request.language}

        【出力JSONキー】
        1. `summary`: 医師提示用サマリー（日本語）。医師が読みやすい箇条書きスタイル。Markdownの太字(**)を使用して重要な部分を強調すること。
        {explanation_instruction}

        Example JSON:
        {{
            "summary": "・主訴：腹痛\\n・詳細：昨夜から...",
            "explanation": "I understood that you have a stomach ache..."
        }}
        """
        
        # JSONモードを強制（Geminiの機能）
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text) # JSONとして返す

    except Exception as e:
        print(f"Analyze Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pdf")
async def create_pdf(request: UserRequest):
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
        styles = getSampleStyleSheet()
        font_name = 'IPAexGothic' if 'IPAexGothic' in pdfmetrics.getRegisteredFontNames() else 'Helvetica'
        
        jp_style = ParagraphStyle(name='Japanese', parent=styles['Normal'], fontName=font_name, fontSize=10, leading=16)
        title_style = ParagraphStyle(name='Title', parent=styles['Heading1'], fontName=font_name, fontSize=18, leading=24, alignment=1, spaceAfter=10*mm)

        story = []
        story.append(Paragraph("Medical Summary / 医師提示用サマリー", title_style))
        story.append(Spacer(1, 5*mm))
        
        # 受け取ったテキスト（summary部分）をそのままPDF化
        lines = request.text.split('\n')
        for line in lines:
            if not line.strip(): continue
            
            # Markdown(**) を PDFタグ(<b>) に変換
            formatted_line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
            
            if line.strip().startswith("■") or line.strip().startswith("##") or line.strip().startswith("【"):
                clean_text = formatted_line.replace("##", "").replace("■", "").strip()
                story.append(Spacer(1, 3*mm))
                story.append(Paragraph(f"<font size=12><b>{clean_text}</b></font>", jp_style))
            elif line.strip().startswith("* ") or line.strip().startswith("- "):
                clean_text = formatted_line.strip()[2:]
                story.append(Paragraph(f"• {clean_text}", jp_style))
            else:
                story.append(Paragraph(formatted_line, jp_style))
            
            story.append(Spacer(1, 1*mm))

        doc.build(story)
        buffer.seek(0)
        return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=summary.pdf"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))