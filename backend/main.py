import os
import io
import re
import json
import html
# html-sanitizer は pip install html-sanitizer でインストール推奨
# なければ標準の html.escape を使用するフォールバック実装
try:
    from html_sanitizer import Sanitizer
    sanitizer = Sanitizer()
except ImportError:
    sanitizer = None

import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# --- PDF Generation Libraries ---
from reportlab.lib.pagesizes import A4, B5
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import mm

load_dotenv()

# --- Config & Security ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    # 開発用フォールバック（本番ではエラーにするか環境変数を必須にする）
    print("WARNING: GEMINI_API_KEY is not set.")

genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

# CORS: フロントエンドのURLを環境変数から許可
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
allow_origins = [FRONTEND_URL, "https://medical-summary-app.vercel.app"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# フォント読み込み (IPAexGothic)
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    font_path = os.path.join(current_dir, "ipaexg.ttf")
    if os.path.exists(font_path):
        pdfmetrics.registerFont(TTFont('IPAexGothic', font_path))
    else:
        print("Warning: ipaexg.ttf not found. Fallback to Helvetica.")
except Exception as e:
    print(f"Font Load Error: {e}")

# --- AI Settings ---
system_instruction = """
あなたは救急・総合診療の経験豊富な「医療秘書AI」です。
患者（ユーザー）の入力した症状から、医師が診断に必要な情報（OPQRST、既往歴、リスク因子）を抽出し、
電子カルテにそのまま貼り付けられる「医学的サマリー」を作成してください。
【法的制約】医師ではないため、診断や病名の断定は行わないこと。
"""
model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

# --- Helper Functions ---

def mask_pii(text: str) -> str:
    """個人情報（電話番号、メアド）の簡易マスキング"""
    text = re.sub(r'\d{2,4}[-\s]?\d{2,4}[-\s]?\d{3,4}', '[PHONE_HIDDEN]', text)
    text = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[EMAIL_HIDDEN]', text)
    return text

def sanitize_input(text: str) -> str:
    """PDF生成用サニタイズ (タグの無効化)"""
    if sanitizer:
        return sanitizer.sanitize(text)
    return html.escape(text)

# --- API Models ---

class UserRequest(BaseModel):
    text: str = Field(..., max_length=4000, description="Patient symptoms")
    language: str = "Japanese"
    pdf_size: str = "A4"

# --- Endpoints ---

@app.post("/analyze")
async def analyze_symptoms(request: UserRequest):
    try:
        # 1. PII Masking
        safe_text = mask_pii(request.text)

        # 2. Prompt Construction
        prompt = f"""
        以下の患者の訴えを分析し、JSONフォーマットのみを出力してください。
        
        対象テキスト: {safe_text}
        言語: {request.language}

        出力フォーマット:
        {{
            "summary": {{
                "chief_complaint": "主訴",
                "history": "現病歴",
                "symptoms": "随伴症状",
                "background": "既往歴・服薬"
            }},
            "departments": ["診療科1"], 
            "explanation": "ユーザーへの説明"
        }}
        """
        
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)

    except Exception as e:
        print(f"Analyze Error: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed.")

@app.post("/pdf")
async def create_pdf(request: UserRequest):
    try:
        buffer = io.BytesIO()
        
        # サイズ設定
        pagesize = A4
        margin = 20*mm
        if request.pdf_size == "B5": pagesize = B5
        elif request.pdf_size == "Receipt": 
            pagesize = (80*mm, 300*mm); margin = 5*mm

        doc = SimpleDocTemplate(
            buffer, pagesize=pagesize, 
            rightMargin=margin, leftMargin=margin, topMargin=margin, bottomMargin=margin
        )

        styles = getSampleStyleSheet()
        registered_fonts = pdfmetrics.getRegisteredFontNames()
        font_name = 'IPAexGothic' if 'IPAexGothic' in registered_fonts else 'Helvetica'
        
        jp_style = ParagraphStyle(name='JP', parent=styles['Normal'], fontName=font_name, fontSize=10, leading=16)
        title_style = ParagraphStyle(name='Title', parent=styles['Heading1'], fontName=font_name, fontSize=18, alignment=1, spaceAfter=15)

        story = []
        story.append(Paragraph("Medical Summary", title_style))
        story.append(Spacer(1, 10))
        
        # テキスト処理
        lines = request.text.split('\n')
        for line in lines:
            if not line.strip(): continue
            
            # 安全化処理 (PDFライブラリへの攻撃防止)
            # **太字** を <b>タグ</b> に変換する前に、その他のタグをエスケープ
            safe_line = html.escape(line)
            formatted_line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', safe_line)
            
            # 見出し装飾
            if "■" in formatted_line:
                story.append(Spacer(1, 5))
                story.append(Paragraph(f"<font size=12><b>{formatted_line}</b></font>", jp_style))
            else:
                story.append(Paragraph(formatted_line, jp_style))
            
            story.append(Spacer(1, 2))

        doc.build(story)
        buffer.seek(0)
        return StreamingResponse(
            buffer, media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=summary.pdf"}
        )
    except Exception as e:
        print(f"PDF Error: {e}")
        raise HTTPException(status_code=500, detail="PDF generation failed.")