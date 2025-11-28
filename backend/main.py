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
あなたは救急・総合診療の経験豊富な「医療秘書AI」です。
患者の入力から情報を抽出し、医師が電子カルテに記載する形式（OPQRSTなど）に基づいて整理してください。
"""
model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

class UserRequest(BaseModel):
    text: str
    language: str = "Japanese"
    pdf_size: str = "A4"

@app.post("/analyze")
async def analyze_symptoms(request: UserRequest):
    try:
        explanation_instruction = ""
        if request.language not in ["Japanese", "日本語", "ja"]:
             explanation_instruction = f"- `explanation`: ユーザーへの説明を{request.language}で記述（AIの理解を伝えるため）。"
        else:
             explanation_instruction = "- `explanation`: 空文字（\"\"）にしてください。"

        # ★改良: 出力を厳密な構造化データにする
        prompt = f"""
        以下の患者の訴えを分析し、以下のJSONフォーマットのみを出力してください。Markdown記号（###など）は不要です。

        対象テキスト:
        {request.text}
        
        ユーザーの使用言語: {request.language}

        【出力JSONフォーマット】
        {{
            "summary": {{
                "chief_complaint": "主訴（一番の症状を一言で）",
                "history": "現病歴（いつから、どうなったか、OPQRST情報を含めて時系列で記述）",
                "symptoms": "随伴症状（主訴に伴うその他の症状）",
                "background": "既往歴・服薬・アレルギー（入力になければ「特記なし」）"
            }},
            "departments": ["推奨診療科1", "推奨診療科2"],
            "explanation": "ユーザーへの説明（日本語以外の場合のみ）"
        }}

        重要: 
        - 医師が読むための専門的かつ簡潔な表現に変換すること。
        - 重要なキーワード（数値、期間、部位）は強調のため **太字** で囲むこと（例: **38.5度**の発熱）。
        """
        
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)

    except Exception as e:
        print(f"Analyze Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pdf")
async def create_pdf(request: UserRequest):
    try:
        # フロントエンドから受け取るJSON構造が変わるため、ここでパースする前提にはせず、
        # フロント側で整形済みのテキストを送ってもらうか、ここで組み立てる必要がある。
        # 今回は簡易化のため、textとして「整形済みテキスト」を受け取る仕様に変更する。
        # ※実際の運用ではJSONを受け取ってPDF側でレイアウトするのがベストだが、今回は互換性を維持する。
        
        buffer = io.BytesIO()
        
        pagesize = A4
        margin = 20*mm
        if request.pdf_size == "B5": pagesize = B5
        elif request.pdf_size == "Receipt": 
            pagesize = (80*mm, 300*mm)
            margin = 5*mm

        doc = SimpleDocTemplate(
            buffer, pagesize=pagesize, 
            rightMargin=margin, leftMargin=margin, topMargin=margin, bottomMargin=margin
        )

        styles = getSampleStyleSheet()
        font_name = 'IPAexGothic' if 'IPAexGothic' in pdfmetrics.getRegisteredFontNames() else 'Helvetica'
        
        base_font_size = 9 if request.pdf_size == "Receipt" else 10
        title_font_size = 14 if request.pdf_size == "Receipt" else 18

        jp_style = ParagraphStyle(
            name='Japanese', parent=styles['Normal'], fontName=font_name, 
            fontSize=base_font_size, leading=base_font_size * 1.6
        )
        title_style = ParagraphStyle(
            name='Title', parent=styles['Heading1'], fontName=font_name, 
            fontSize=title_font_size, leading=title_font_size * 1.4, 
            alignment=1, spaceAfter=5*mm
        )

        story = []
        title_text = "Medical Summary" if request.pdf_size == "Receipt" else "Medical Summary / 医師提示用サマリー"
        story.append(Paragraph(title_text, title_style))
        story.append(Spacer(1, 5*mm))
        
        lines = request.text.split('\n')
        for line in lines:
            if not line.strip(): continue
            formatted_line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
            
            if line.strip().startswith("■"):
                clean_text = line.replace("■", "").strip()
                story.append(Spacer(1, 2*mm))
                header_size = base_font_size + 2
                story.append(Paragraph(f"<font size={header_size}><b>■ {clean_text}</b></font>", jp_style))
            elif line.strip().startswith("- ") or line.strip().startswith("・"):
                clean_text = line.replace("- ", "").replace("・", "").strip()
                # 太字変換後のテキストを使う
                clean_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', clean_text)
                story.append(Paragraph(f"• {clean_text}", jp_style))
            else:
                story.append(Paragraph(formatted_line, jp_style))
            
            story.append(Spacer(1, 1*mm))

        doc.build(story)
        buffer.seek(0)
        return StreamingResponse(
            buffer, media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=summary.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))