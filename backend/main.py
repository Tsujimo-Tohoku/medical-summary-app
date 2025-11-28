# backend/main.py (全体を更新)

import os
import io # ★追加：メモリ上でファイルを扱う機能
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse # ★追加：ファイルを返す機能
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import mm

# --- PDF作成用ライブラリ ---
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

# 1. 設定
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

# CORS設定（変更なし）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# モデル設定（変更なし）
system_instruction = """
あなたは医療秘書AIです。患者の訴えを医師提示用に整理してください。
診断は行わず、事実の整理に徹してください。
"""
model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

class UserRequest(BaseModel):
    text: str

# --- 日本語フォントの登録（これがないと文字化けします） ---
pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3-UniJIS-UCS2-H'))

@app.post("/analyze")
async def analyze_symptoms(request: UserRequest):
    # (さっきと同じコード)
    try:
        prompt = f"以下の患者の訴えを医師提示用にサマリーしてください。\n対象テキスト:\n{request.text}"
        response = model.generate_content(prompt)
        return {"result": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ★追加機能：PDF作成エンドポイント
@app.post("/pdf")
async def create_pdf(request: UserRequest):
    try:
        # 1. バッファの準備
        buffer = io.BytesIO()
        
        # 2. ドキュメントの設定（余白などを指定）
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=20*mm, leftMargin=20*mm,
            topMargin=20*mm, bottomMargin=20*mm
        )

        # 3. スタイルの準備
        # 日本語フォントを登録
        pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3-UniJIS-UCS2-H'))
        
        styles = getSampleStyleSheet()
        # 基本の日本語スタイルを作成
        jp_style = ParagraphStyle(
            name='Japanese',
            parent=styles['Normal'],
            fontName='HeiseiMin-W3-UniJIS-UCS2-H',
            fontSize=10,
            leading=16, # 行間
        )
        # タイトル用のスタイル
        title_style = ParagraphStyle(
            name='Title',
            parent=styles['Heading1'],
            fontName='HeiseiMin-W3-UniJIS-UCS2-H',
            fontSize=18,
            leading=24,
            alignment=1, # 中央揃え
            spaceAfter=10*mm # 下の余白
        )

        # 4. PDFの中身（Story）を作っていく
        story = []
        
        # タイトル追加
        story.append(Paragraph("医師提示用サマリー", title_style))
        story.append(Spacer(1, 5*mm)) # 少し隙間を空ける
        
        # 本文を追加（改行ごとに段落として処理）
        # ※Geminiの出力に含まれるMarkdownの太字(**)などは、単純な置換でPDFタグに変換
        lines = request.text.split('\n')
        for line in lines:
            if not line.strip():
                continue # 空行はスキップ
                
            # Markdownの太字(**)を、ReportLabの太字タグ(<b>)に簡易変換
            # 注: 本格的なMarkdown変換は複雑なので、ここでは簡易的に処理
            clean_line = line.replace("**", "") 
            
            # 見出しっぽい行（■や##で始まる）は太く大きくする
            if line.strip().startswith("■") or line.strip().startswith("##"):
                story.append(Spacer(1, 3*mm))
                story.append(Paragraph(f"<font size=12><b>{clean_line}</b></font>", jp_style))
            else:
                story.append(Paragraph(clean_line, jp_style))
            
            # 段落ごとの隙間
            story.append(Spacer(1, 2*mm))

        # 5. PDFをビルド（ここで自動レイアウト計算が行われる）
        doc.build(story)
        
        # 6. バッファの先頭に戻して返す
        buffer.seek(0)
        return StreamingResponse(
            buffer, 
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=summary.pdf"}
        )

    except Exception as e:
        print(f"PDF Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
