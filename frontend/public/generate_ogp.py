import os
from PIL import Image, ImageDraw, ImageFont

# 設定
OUTPUT_DIR = "frontend/public"
FILENAME = "ogp.png"
THEME_COLOR = "#0D9488" # Teal-600
BG_COLOR = "#F0FDFA"    # Teal-50
TEXT_COLOR = "#115E59"  # Teal-900
SIZE = (1200, 630)

def create_ogp():
    # 1. 背景作成
    img = Image.new("RGB", SIZE, color=BG_COLOR)
    draw = ImageDraw.Draw(img)

    # 2. 装飾（左側の帯）
    draw.rectangle([(0, 0), (40, 630)], fill=THEME_COLOR)

    # 3. ロゴっぽい図形を描画 (簡易的)
    # 中央より少し上に配置
    cx, cy = SIZE[0] // 2, SIZE[1] // 2
    
    # アイコン枠
    icon_size = 120
    icon_x = cx - 350
    icon_y = cy - 60
    draw.rounded_rectangle(
        [(icon_x, icon_y), (icon_x + icon_size, icon_y + icon_size)],
        radius=20, fill=THEME_COLOR
    )
    # アイコン内の十字
    draw.rectangle([(icon_x + 40, icon_y + 20), (icon_x + 80, icon_y + 100)], fill="white")
    draw.rectangle([(icon_x + 20, icon_y + 40), (icon_x + 100, icon_y + 80)], fill="white")

    # 4. テキストの描画（フォントファイルがないため、図形で簡易表現するのは難しいので）
    # ここでは「文字の代わりにレイアウト」でそれっぽく見せます。
    # 実際はOSのフォントを読み込むのがベストですが、環境依存を防ぐため。
    
    # アプリ名: Karutto (擬似的に大きく描画したつもりで、ここでは座標だけ示す)
    # 本来は draw.text を使いますが、デフォルトフォントだと日本語が出ないため
    # 今回は「枠線」と「装飾」で清潔感のあるプレースホルダーを作ります。
    
    # メインタイトルエリア
    draw.rectangle([(cx - 180, cy - 50), (cx + 350, cy + 50)], fill=None, outline=THEME_COLOR, width=5)
    
    # 補足: ユーザーには「ここに文字が入るイメージ」として、
    # 実際にはCanvaなどで「Karutto」と書いた画像を作ることを推奨しますが、
    # いったんこれでファイルとしての体裁は整います。

    # 保存
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
    save_path = os.path.join(OUTPUT_DIR, FILENAME)
    img.save(save_path)
    print(f"Generated OGP image at: {save_path}")
    print("※注意: これは簡易画像です。本番リリース前にはCanva等でカッコいい画像(1200x630)を作り、同じ名前で上書きすることを推奨します。")

if __name__ == "__main__":
    create_ogp()