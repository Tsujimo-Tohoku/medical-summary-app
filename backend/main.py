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
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
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

# ★改良: 医師視点でのカルテ作成を意識したシステム指示
system_instruction = """
あなたは救急・総合診療の経験豊富な「医療秘書AI」です。
患者（ユーザー）の入力した雑多な症状の訴えから、医師が診断を下すために必要な情報（OPQRST情報、既往歴、リスク因子）を抽出し、
電子カルテにそのまま貼り付けられるような「医学的に整理されたサマリー」を作成してください。
診断行為（病名の断定）は行わず、あくまで事実の整理とトリアージ支援に徹してください。
"""
model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

class UserRequest(BaseModel):
    text: str
    language: str = "Japanese"
    pdf_size: str = "A4"

@app.post("/analyze")
async def analyze_symptoms(request: UserRequest):
    try:
        # 言語ごとの説明文制御
        explanation_instruction = ""
        if request.language != "Japanese" and request.language != "日本語":
             explanation_instruction = f"3. `explanation`: ユーザーへの説明を{request.language}で記述（AIの理解を伝えるため）。"
        else:
             explanation_instruction = "3. `explanation`: 空文字（\"\"）にしてください。"

        prompt = f"""
        以下の患者の訴えを分析し、以下のJSONフォーマットのみを出力してください。Markdown記法は含めないでください。

        対象テキスト:
        {request.text}
        
        ユーザーの使用言語: {request.language}

        【出力JSONキーと要件】
        1. `summary`: 医師提示用サマリー（日本語）。
           - 以下の構成でMarkdownの箇条書きを用いて整理すること。
           - **【主訴】**: 一番の症状を一言で。
           - **【現病歴】**: いつから(Onset)、何をして(Provoke)、どんな(Quality)、どこが(Region)、どのくらい(Severity)、時間経過(Time)を整理。
           - **【随伴症状】**: 主訴に伴うその他の症状。
           - **【既往歴・服薬】**: 入力に含まれていれば記載。なければ「特記なし」や記載を省略。
           - 重要なキーワード（数値、期間、部位、痛みの性質）はMarkdownの太字(**)で強調すること。

        2. `departments`: 推奨される診療科（日本語のリスト形式）。
           - 症状から考えられる適切な診療科を1つ〜3つ挙げること（例: ["消化器内科", "一般内科"]）。
           - 迷う場合は "一般内科" や "総合診療科" を含めること。

        {explanation_instruction}

        Example JSON:
        {{
            "summary": "### ■ 主訴\\n**右下腹部痛**\\n\\n### ■ 現病歴\\n- **昨夜**から心窩部痛が出現し、**今朝**から右下腹部に移動した。...\\n...",
            "departments": ["消化器内科", "一般外科"],
            "explanation": ""
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
        
        pagesize = A4
        right_margin = 20*mm
        if request.pdf_size == "B5": pagesize = B5
        elif request.pdf_size == "Receipt": 
            pagesize = (80*mm, 300*mm)
            right_margin = 5*mm

        margin = 5*mm if request.pdf_size == "Receipt" else 20*mm

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
        
        # 本文の処理
        lines = request.text.split('\n')
        for line in lines:
            if not line.strip(): continue
            formatted_line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
            
            # 見出しの強調処理
            if line.strip().startswith("■") or line.strip().startswith("##") or line.strip().startswith("###") or line.strip().startswith("【"):
                clean_text = line.replace("#", "").replace("■", "").replace("【", "").replace("】", "").strip()
                story.append(Spacer(1, 2*mm))
                header_size = base_font_size + 2
                story.append(Paragraph(f"<font size={header_size}><b>■ {clean_text}</b></font>", jp_style))
            elif line.strip().startswith("* ") or line.strip().startswith("- "):
                clean_text = formatted_line.strip()[2:]
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