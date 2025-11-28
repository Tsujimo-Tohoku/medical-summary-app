import os
import io
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

# 1. 設定
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

# 2. CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. フォント登録
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    font_path = os.path.join(current_dir, "ipaexg.ttf")
    pdfmetrics.registerFont(TTFont('IPAexGothic', font_path))
except Exception:
    pass

# 4. モデル設定（多言語対応の指示を追加）
system_instruction = """
あなたは医療秘書AIです。
ユーザーの入力した症状（あらゆる言語）を分析し、日本の医師に提示するための「日本語の医療サマリー」を作成してください。
また、ユーザーの安心のために、指定された「ユーザーの母国語」での要約も併記してください。
診断行為は行わず、情報の整理に徹してください。
"""
model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

# ★変更：言語指定を受け取れるようにする
class UserRequest(BaseModel):
    text: str
    language: str = "Japanese" # デフォルトは日本語

@app.post("/analyze")
async def analyze_symptoms(request: UserRequest):
    try:
        # プロンプトを強化
        prompt = f"""
        以下の患者の訴えを分析し、以下のフォーマットで出力してください。
        
        対象テキスト:
        {request.text}
        
        ユーザーの使用言語: {request.language}

        【出力フォーマット】
        1. **【医師提示用サマリー】 (日本語)**
           - 医師が短時間で理解できる専門的な表現（箇条書き）
           
        2. **【患者確認用】 ({request.language}で記述)**
           - AIがどのように理解したかをユーザーに伝えるための簡単な説明
        """
        
        response = model.generate_content(prompt)
        return {"result": response.text}
    except Exception as e:
        print(f"Analyze Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pdf")
async def create_pdf(request: UserRequest):
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=20*mm, leftMargin=20*mm,
            topMargin=20*mm, bottomMargin=20*mm
        )

        styles = getSampleStyleSheet()
        font_name = 'IPAexGothic' if 'IPAexGothic' in pdfmetrics.getRegisteredFontNames() else 'Helvetica'
        
        jp_style = ParagraphStyle(
            name='Japanese',
            parent=styles['Normal'],
            fontName=font_name,
            fontSize=10,
            leading=16,
        )
        
        title_style = ParagraphStyle(
            name='Title',
            parent=styles['Heading1'],
            fontName=font_name,
            fontSize=18,
            leading=24,
            alignment=1,
            spaceAfter=10*mm
        )

        story = []
        story.append(Paragraph("Medical Summary / 医師提示用サマリー", title_style))
        story.append(Spacer(1, 5*mm))
        
        lines = request.text.split('\n')
        for line in lines:
            if not line.strip(): continue
            clean_line = line.replace("**", "")
            if line.strip().startswith("■") or line.strip().startswith("##") or line.strip().startswith("【"):
                story.append(Spacer(1, 3*mm))
                story.append(Paragraph(f"<font size=12><b>{clean_line}</b></font>", jp_style))
            else:
                story.append(Paragraph(clean_line, jp_style))
            story.append(Spacer(1, 2*mm))

        doc.build(story)
        buffer.seek(0)
        return StreamingResponse(
            buffer, 
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=summary.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))