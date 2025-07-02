from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import pytesseract
import io
import base64
import re
from sympy import latex
from sympy.parsing.sympy_parser import parse_expr

app = Flask(__name__)
CORS(app)

def is_valid_equation(s):
    # 간단한 수식 필터링 (숫자, 알파벳, 연산자, 괄호 등만 허용)
    return bool(re.fullmatch(r"[0-9a-zA-Z+\-*/^=().\s]+", s))

@app.route("/convert", methods=["POST"])
def convert():
    try:
        # 📥 base64 이미지 수신
        data = request.get_json(force=True)
        image_data = data.get("image")

        if not image_data or not image_data.startswith("data:image"):
            return jsonify({"error": "Invalid image data"}), 400

        # 🔄 base64 → 이미지 변환
        header, encoded = image_data.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        image.save("debug_input.png")  # 디버깅용 저장

        # 📷 OCR 처리 (수식 특화 설정)
        custom_config = r"--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ=+-*/^()"
        raw_text = pytesseract.image_to_string(image, config=custom_config).strip()
        print("📷 OCR result:", raw_text)

        # 🧠 수식 후처리
        if is_valid_equation(raw_text):
            try:
                expr = parse_expr(raw_text.replace("^", "**"))
                expr_latex = latex(expr)
            except Exception as parse_err:
                print("⚠️ parse_expr 실패:", parse_err)
                expr_latex = raw_text
        else:
            expr_latex = raw_text

        print("📤 반환값:", expr_latex)
        return jsonify({"text": expr_latex})

    except Exception as e:
        print("❌ 서버 오류:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
