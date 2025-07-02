const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.lineWidth = 5;
ctx.lineCap = "round";
let drawing = false;

// ✏️ 필기 입력 처리
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});
canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});
canvas.addEventListener("mouseup", () => (drawing = false));
canvas.addEventListener("mouseleave", () => (drawing = false));

// 🔘 버튼 이벤트
document.getElementById("submit").addEventListener("click", handleSubmit);
document.getElementById("clear").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// 📤 서버로 전송
async function handleSubmit() {
  // ✅ 1. 흰 배경 캔버스에 그림 복사
  const whiteCanvas = document.createElement("canvas");
  whiteCanvas.width = canvas.width;
  whiteCanvas.height = canvas.height;

  const whiteCtx = whiteCanvas.getContext("2d");
  whiteCtx.fillStyle = "#FFFFFF";
  whiteCtx.fillRect(0, 0, whiteCanvas.width, whiteCanvas.height);

  whiteCtx.drawImage(canvas, 0, 0); // 기존 canvas 덧입힘

  const base64Image = whiteCanvas.toDataURL("image/png");

  try {
    const response = await fetch("http://localhost:5001/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image }),
    });

    const result = await response.json();
    console.log("🧪 서버 응답:", result);

    // ✅ 2. 결과 렌더링
    if (result.text && result.text.trim().length > 0) {
      document.getElementById("markdown").innerText = result.text;

      const rendered = document.getElementById("rendered");
      rendered.innerHTML = `\\(${result.text}\\)`;

      if (window.MathJax) {
        window.MathJax.typesetClear?.();  // 이전 렌더링 제거
        window.MathJax.typesetPromise([rendered])
          .catch((err) => console.error("MathJax 렌더링 실패:", err));
      }
    } else {
      document.getElementById("markdown").innerText = "❌ 수식 인식 실패";
      document.getElementById("rendered").innerHTML = "";
    }

  } catch (err) {
    console.error("❌ 에러 발생:", err);
    document.getElementById("markdown").innerText = "❌ 서버 오류";
  }
}
