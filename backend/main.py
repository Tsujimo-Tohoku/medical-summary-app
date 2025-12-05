import os
import io
import re
import json
import html
# html-sanitizer推奨だが、なければ標準ライブラリで代用するロジック
try:
    from html_sanitizer import Sanitizer
    sanitizer = Sanitizer()
except ImportError:
    sanitizer = None

import google.generativeai as genai
import stripe
from supabase import create_client, Client
from fastapi import FastAPI, HTTPException, Request, Header
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
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Initialize Clients
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY
else:
    print("WARNING: STRIPE_SECRET_KEY is not set.")

# Supabase Admin Client
supabase: Client = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    except Exception as e:
        print(f"Supabase Init Error: {e}")
else:
    print("WARNING: Supabase credentials not set. Subscription updates will fail.")

app = FastAPI()

# CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
allow_origins = [FRONTEND_URL, "https://medical-summary-app.vercel.app", "https://karteno.jp"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Font Loading
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    font_path = os.path.join(current_dir, "ipaexg.ttf")
    if os.path.exists(font_path):
        pdfmetrics.registerFont(TTFont('IPAexGothic', font_path))
    else:
        print("Warning: ipaexg.ttf not found. Fallback to Helvetica.")
except Exception as e:
    print(f"Font Load Error: {e}")

# --- ★ Plan Configuration (Secure & Scalable) ---
# 環境変数からPrice IDを読み込む
PRICE_ID_PRO = os.getenv("STRIPE_PRICE_ID_PRO")
PRICE_ID_FAMILY = os.getenv("STRIPE_PRICE_ID_FAMILY")

# フロントエンドからのリクエスト(key)をPrice IDに変換するマップ
PLAN_KEY_TO_ID = {
    "pro_monthly": PRICE_ID_PRO,
    "family_monthly": PRICE_ID_FAMILY,
}

# --- AI Settings ---
system_instruction = """
あなたは救急・総合診療の経験豊富な「医療秘書AI」です。
患者（ユーザー）の入力した症状から、医師が診断に必要な情報（OPQRST、既往歴、リスク因子）を抽出し、
電子カルテにそのまま貼り付けられる「医学的サマリー」を作成してください。

【重要：法的制約】
1. あなたは医師ではありません。「診断（病名の断定）」は絶対に行わないでください。
2. 「○○病の疑いがあります」といった病名の示唆も避けてください。
3. 診療科の提案を行う場合は、あくまで「一般的に考えられる可能性」として提示し、断定的な表現を避けてください。

【出力品質の基準】
- 医師が短時間で状況を把握できる「専門的かつ簡潔」な表現を用いること。
- 患者が「言ったこと」と「言わなかったこと（陰性所見）」を明確に区別すること。
"""
model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

# --- Helper Functions ---

def mask_pii(text: str) -> str:
    text = re.sub(r'\d{2,4}[-\s]?\d{2,4}[-\s]?\d{3,4}', '[PHONE_HIDDEN]', text)
    text = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[EMAIL_HIDDEN]', text)
    return text

def sanitize_input(text: str) -> str:
    if sanitizer:
        return sanitizer.sanitize(text)
    return html.escape(text)

# --- API Models ---

class UserRequest(BaseModel):
    text: str = Field(..., max_length=4000, description="Patient symptoms")
    language: str = "Japanese"
    pdf_size: str = "A4"

class CheckoutRequest(BaseModel):
    plan_key: str # 'pro_monthly' or 'family_monthly'
    user_id: str
    cancel_url: str = f"{FRONTEND_URL}/plans" 

# --- AI & PDF Endpoints ---

@app.post("/analyze")
async def analyze_symptoms(request: UserRequest):
    try:
        safe_text = mask_pii(request.text)
        explanation_instruction = ""
        if request.language not in ["Japanese", "日本語", "ja"]:
             explanation_instruction = f"- `explanation`: ユーザーへの説明を{request.language}で記述（AIの理解を伝えるため）。"
        else:
             explanation_instruction = "- `explanation`: 空文字（\"\"）にしてください。"

        prompt = f"""
        以下の患者の訴えを分析し、以下のJSONフォーマットのみを出力してください。
        Markdown記号（###など）は含めないでください。純粋なJSON文字列のみを返してください。

        対象テキスト:
        {safe_text}
        
        ユーザーの使用言語: {request.language}

        【出力JSONフォーマット】
        {{
            "summary": {{
                "chief_complaint": "主訴（一番の症状を一言で。期間を含める。例: **3日前**からの発熱）",
                "history": "現病歴（OPQRSTに基づき、時系列順に記述。重要な陰性所見（例: 呼吸苦はない）もあれば含める）",
                "symptoms": "随伴症状（主訴に伴うその他の症状。箇条書き推奨）",
                "background": "既往歴・服薬・アレルギー（入力になければ「特記なし」）"
            }},
            "departments": ["診療科1", "診療科2"], 
            "explanation": "ユーザーへの説明（日本語以外の場合のみ）"
        }}

        重要指示: 
        - 医師が読むためのカルテ用語（例: 「熱がある」→「発熱」、「お腹が痛い」→「腹痛」）に変換すること。
        - **数値**（体温、回数）、**期間**（いつから）、**部位**（右下腹部など）は、医師が見落とさないよう **太字** で囲むこと（例: **38.5度**）。
        - 否定された症状（「吐き気はない」など）も、鑑別診断に重要なため省略せずに記載すること。
        - `departments` は、可能性のある診療科を広い範囲で抽出すること。
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
        
        base_font_size = 9 if request.pdf_size == "Receipt" else 10
        title_font_size = 14 if request.pdf_size == "Receipt" else 18

        jp_style = ParagraphStyle(
            name='JP', parent=styles['Normal'], fontName=font_name, 
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
            safe_line = html.escape(line)
            formatted_line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', safe_line)
            
            if line.strip().startswith("■"):
                clean_text = formatted_line.replace("■", "").strip()
                story.append(Spacer(1, 2*mm))
                header_size = base_font_size + 2
                story.append(Paragraph(f"<font size={header_size}><b>■ {clean_text}</b></font>", jp_style))
            elif line.strip().startswith("- ") or line.strip().startswith("・"):
                clean_text = formatted_line.replace("- ", "").replace("・", "").strip()
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
        print(f"PDF Error: {e}")
        raise HTTPException(status_code=500, detail="PDF generation failed.")

# --- Stripe Payment Endpoints ---

@app.post("/create-checkout-session")
async def create_checkout_session(request: CheckoutRequest):
    """
    Stripeの決済画面URLを発行する
    ★ フロントからは 'plan_key' (例: pro_monthly) を受け取り、
       サーバー側で環境変数からPrice IDを解決する安全な実装
    """
    try:
        if not STRIPE_SECRET_KEY:
            raise HTTPException(status_code=500, detail="Stripe config missing")

        # 1. プランキーに対応するPrice IDを環境変数から取得
        target_price_id = PLAN_KEY_TO_ID.get(request.plan_key)
        
        if not target_price_id:
            # 開発環境でID未設定の場合のエラーハンドリング
            print(f"Error: Price ID not found for key: {request.plan_key}")
            raise HTTPException(status_code=400, detail=f"Price ID configuration error for {request.plan_key}")

        # 2. セッション作成
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price': target_price_id, 
                    'quantity': 1,
                },
            ],
            mode='subscription', 
            success_url=f"{FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=request.cancel_url,
            client_reference_id=request.user_id,
            metadata={
                "user_id": request.user_id,
                "plan_type": request.plan_key # わかりやすいキーを保存
            }
        )
        return {"url": checkout_session.url}
    except Exception as e:
        print(f"Stripe Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        await handle_checkout_completed(session)

    return {"status": "success"}

async def handle_checkout_completed(session):
    """
    決済成功時のロジック: Supabaseのユーザー情報を更新
    """
    user_id = session.get("client_reference_id")
    customer_id = session.get("customer")
    
    # Metadataからプラン情報を取得（create_checkout_sessionで埋め込んだもの）
    metadata = session.get("metadata", {})
    plan_type = metadata.get("plan_type", "free")
    
    if not user_id or not supabase:
        print("Webhook Warning: No user_id or Supabase client.")
        return

    try:
        supabase.table("profiles").update({
            "stripe_customer_id": customer_id,
            "subscription_status": "active",
            "plan_type": plan_type
        }).eq("id", user_id).execute()
        print(f"User {user_id} upgraded to {plan_type}.")
    except Exception as e:
        print(f"Supabase Update Error: {e}")