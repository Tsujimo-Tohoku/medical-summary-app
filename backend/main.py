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
from reportlab.pdfbase.ttfonts import TTFont # ★ここが変わっています
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import mm

# 1. 設定
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

# 2. CORS設定（すべて許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. フォントの登録（サーバー起動時に1回だけやる）
# 同じフォルダにある ipaexg.ttf を探す
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    font_path = os.path.join(current_dir, "ipaexg.ttf")
    pdfmetrics.registerFont(TTFont('IPAexGothic', font_path))
    print(f"Font loaded: {font_path}")
except Exception as e:
    print(f"Font Error: {e}")
    # フォントがない場合のエラー回避（最悪英語で動くようにする）
    pass

# 4. モデル設定
system_instruction = """
あなたは医療秘書AIです。患者の訴えを医師提示用に整理してください。
診断は行わず、事実の整理に徹してください。
"""
model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

class UserRequest(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_symptoms(request: UserRequest):
    try:
        prompt = f"以下の患者の訴えを医師提示用にサマリーしてください。\n対象テキスト:\n{request.text}"
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

        # スタイル設定
        styles = getSampleStyleSheet()
        
        # フォントが読み込めていれば日本語フォントを使う
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
        
        # タイトル
        story.append(Paragraph("医師提示用サマリー", title_style))
        story.append(Spacer(1, 5*mm))
        
        # 本文の処理
        lines = request.text.split('\n')
        for line in lines:
            if not line.strip():
                continue
            
            clean_line = line.replace("**", "")
            
            if line.strip().startswith("■") or line.strip().startswith("##"):
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
        print(f"PDF Logic Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "AI Medical Server is Running!"}