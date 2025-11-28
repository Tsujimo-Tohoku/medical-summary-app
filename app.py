import os
import streamlit as st
import google.generativeai as genai
from dotenv import load_dotenv

# 1. 設定の読み込み
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# 2. モデルの設定（医療秘書としての役割）
system_instruction = """
あなたは、患者の体調不良の訴えを、医師や救急隊員が短時間で理解できるように整理する「医療秘書AI」です。
ユーザーの入力した雑多な文章から医学的に重要な情報を抽出し、医師がカルテに記述するような形式で出力してください。
医学的な診断（病名の断定）は行わず、あくまで「症状の正確な伝達」に徹してください。
"""
model = genai.GenerativeModel(
    'gemini-2.5-flash',
    system_instruction=system_instruction
)

# 3. 画面構成
st.set_page_config(page_title="医師提示用サマリー作成", layout="centered")

st.title("体調言語化・整理ツール")
st.markdown("体調が悪い時、症状や不安要素を医師に伝わりやすいようAIが整理します。\n**出力された画面をそのまま医師や救急隊員に見せてください。**")

# 入力エリア
user_input = st.text_area(
    "今の症状を詳しく書いてください（話すように書いてOK）", 
    height=200, 
    placeholder="（例）\n昨日の夜からお腹が痛い。\n朝起きたら熱が38度あった。\n吐き気もあって、水しか飲めていない。\n普段飲んでいる薬は〇〇です。"
)

# 実行ボタン
if st.button("医師に見せる画面を作成する", type="primary", use_container_width=True):
    if user_input:
        with st.spinner("医師向けに情報を整理中..."):
            prompt = f"""
            以下の患者の訴えを、医師が診療しやすいように【医療用サマリー】として整理してください。
            専門用語（例：お腹が痛い→腹痛、熱がある→発熱）への変換は適切に行ってください。
            
            出力フォーマット：
            ## 【患者サマリー】（医師提示用）
            
            **■ 主訴（一番辛いこと）**
            * （簡潔に記述）

            **■ 経過（いつから、どう変化したか）**
            * （時系列で整理）
            
            **■ 具体的な症状・バイタル**
            * （体温、痛みの強さ、部位など）
            
            **■ 既往歴・服薬・アレルギー（入力にある場合のみ）**
            * （なければ「記載なし」）
            
            **■ 患者からの懸念点・伝えたいこと**
            * （不安に思っていることなど）

            対象テキスト:
            {user_input}
            """
            
            try:
                response = model.generate_content(prompt)
                
                st.markdown("---")
                st.success("✅ 作成完了｜この画面を医師に見せてください")
                
                # 結果を目立たせる（コンテナ化）
                with st.container(border=True):
                    st.markdown(response.text)
                
                st.caption("※このサマリーはAIが作成しました。補足があれば口頭で医師にお伝えください。")
                
            except Exception as e:
                st.error(f"エラーが発生しました: {e}")
    else:
        st.warning("症状を入力してください。")