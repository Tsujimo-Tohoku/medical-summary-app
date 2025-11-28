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
from reportlab.lib.pagesizes import A4, B5
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

system_instruction = """
あなたは医療秘書AIです。
ユーザーの入力した症状を分析し、JSON形式でデータを出力してください。
"""
model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

class UserRequest(BaseModel):
    text: str
    language: str = "Japanese"
    pdf_size: str = "A4" # ★追加：PDFサイズ指定

@app.post("/analyze")
async def analyze_symptoms(request: UserRequest):
    try:
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
        
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)

    except Exception as e:
        print(f"Analyze Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pdf")
async def create_pdf(request: UserRequest):
    try:
        buffer = io.BytesIO()
        
        # ★追加：用紙サイズの分岐処理
        # デフォルトはA4
        pagesize = A4
        right_margin = 20*mm
        
        if request.pdf_size == "B5":
            pagesize = B5
        elif request.pdf_size == "Receipt":
            # レシートは幅80mm、高さは十分長く(300mm)設定
            pagesize = (80*mm, 300*mm)
            right_margin = 5*mm # レシートは余白を狭くする

        # マージン設定（レシートの場合は狭く）
        margin = 5*mm if request.pdf_size == "Receipt" else 20*mm

        doc = SimpleDocTemplate(
            buffer, 
            pagesize=pagesize, 
            rightMargin=margin, leftMargin=margin, 
            topMargin=margin, bottomMargin=margin
        )

        styles = getSampleStyleSheet()
        font_name = 'IPAexGothic' if 'IPAexGothic' in pdfmetrics.getRegisteredFontNames() else 'Helvetica'
        
        # レシートの場合は文字サイズを少し小さく
        base_font_size = 9 if request.pdf_size == "Receipt" else 10
        title_font_size = 14 if request.pdf_size == "Receipt" else 18

        jp_style = ParagraphStyle(
            name='Japanese', 
            parent=styles['Normal'], 
            fontName=font_name, 
            fontSize=base_font_size, 
            leading=base_font_size * 1.6
        )
        
        title_style = ParagraphStyle(
            name='Title', 
            parent=styles['Heading1'], 
            fontName=font_name, 
            fontSize=title_font_size, 
            leading=title_font_size * 1.4, 
            alignment=1, 
            spaceAfter=5*mm
        )

        story = []
        # タイトルもサイズによって変える
        title_text = "Medical Summary" if request.pdf_size == "Receipt" else "Medical Summary / 医師提示用サマリー"
        story.append(Paragraph(title_text, title_style))
        story.append(Spacer(1, 5*mm))
        
        lines = request.text.split('\n')
        for line in lines:
            if not line.strip(): continue
            
            formatted_line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
            
            if line.strip().startswith("■") or line.strip().startswith("##") or line.strip().startswith("【"):
                clean_text = formatted_line.replace("##", "").replace("■", "").strip()
                story.append(Spacer(1, 2*mm))
                # 見出しのサイズ調整
                header_size = base_font_size + 2
                story.append(Paragraph(f"<font size={header_size}><b>{clean_text}</b></font>", jp_style))
            elif line.strip().startswith("* ") or line.strip().startswith("- "):
                clean_text = formatted_line.strip()[2:]
                story.append(Paragraph(f"• {clean_text}", jp_style))
            else:
                story.append(Paragraph(formatted_line, jp_style))
            
            story.append(Spacer(1, 1*mm))

        doc.build(story)
        buffer.seek(0)
        return StreamingResponse(
            buffer, 
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=summary.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))