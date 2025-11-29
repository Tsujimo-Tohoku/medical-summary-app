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

# CORS設定（Vercelなどからのアクセスを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# フォント登録（IPAexゴシック）
# ※ backendフォルダに ipaexg.ttf があることを前提とします
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    font_path = os.path.join(current_dir, "ipaexg.ttf")
    pdfmetrics.registerFont(TTFont('IPAexGothic', font_path))
except Exception:
    pass

# ★重要: 医師視点でのカルテ作成＆法的リスク回避のシステム指示
system_instruction = """
あなたは救急・総合診療の経験豊富な「医療秘書AI」です。
患者（ユーザー）の入力した症状から、医師が診断に必要な情報（OPQRST、既往歴、リスク因子）を抽出し、
電子カルテにそのまま貼り付けられる「医学的サマリー」を作成してください。

【重要：法的制約】
1. あなたは医師ではありません。「診断（病名の断定）」は絶対に行わないでください。
2. 「○○病の疑いがあります」といった病名の示唆も避けてください。
3. 診療科の提案を行う場合は、あくまで「一般的に考えられる可能性」として提示し、断定的な表現を避けてください。
"""
model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

class UserRequest(BaseModel):
    text: str
    language: str = "Japanese"
    pdf_size: str = "A4"

@app.post("/analyze")
async def analyze_symptoms(request: UserRequest):
    try:
        # 日本語以外の場合のみ説明文を生成
        explanation_instruction = ""
        if request.language not in ["Japanese", "日本語", "ja"]:
             explanation_instruction = f"- `explanation`: ユーザーへの説明を{request.language}で記述（AIの理解を伝えるため）。"
        else:
             explanation_instruction = "- `explanation`: 空文字（\"\"）にしてください。"

        # ★構造化データ(JSON)での出力を強制
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
            "departments": ["診療科1", "診療科2"], 
            "explanation": "ユーザーへの説明（日本語以外の場合のみ）"
        }}

        重要: 
        - 医師が読むための専門的かつ簡潔な表現に変換すること。
        - 重要なキーワード（数値、期間、部位）は強調のため **太字** で囲むこと（例: **38.5度**の発熱）。
        - `departments` は「推奨」ではなく「関連する診療科の例」として抽出すること。迷う場合は「一般内科」を含める。
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
        
        # 用紙サイズ設定
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
        
        # Frontendから送られてきた整形済みテキストを行ごとに処理
        lines = request.text.split('\n')
        for line in lines:
            if not line.strip(): continue
            
            # Markdown(**) を PDFタグ(<b>) に変換
            formatted_line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
            
            # 見出し行の処理 (■ で始まる行)
            if line.strip().startswith("■"):
                clean_text = line.replace("■", "").strip()
                story.append(Spacer(1, 2*mm))
                header_size = base_font_size + 2
                story.append(Paragraph(f"<font size={header_size}><b>■ {clean_text}</b></font>", jp_style))
            # リスト行の処理
            elif line.strip().startswith("- ") or line.strip().startswith("・"):
                clean_text = line.replace("- ", "").replace("・", "").strip()
                # 太字変換後のテキストを使うため再処理
                clean_text_bold = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', clean_text)
                story.append(Paragraph(f"• {clean_text_bold}", jp_style))
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