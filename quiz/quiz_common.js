document.addEventListener("DOMContentLoaded", function() {
  if (typeof QDATA === "undefined") return;
  var form = document.getElementById("quiz-form");
  var container = document.getElementById("quiz-container");
  if (!form || !container) return;
  var frag = document.createDocumentFragment();
  QDATA.forEach(function(q) {
    var block = document.createElement("div");
    block.className = "q-block";
    block.setAttribute("data-num", q.num);
    block.innerHTML =
      '<div class="q-num">Question ' + q.num + '</div>' +
      '<div class="q-desc">' + escapeHtml(q.desc) + '</div>';
    q.options.forEach(function(opt) {
      var label = document.createElement("label");
      label.innerHTML = '<input type="radio" name="q' + q.num + '" value="' + escapeAttr(opt.letter) + '">' +
        '<span>(' + escapeHtml(opt.letter) + ') ' + escapeHtml(opt.text) + '</span>';
      block.appendChild(label);
    });
    frag.appendChild(block);
  });
  form.insertBefore(frag, document.getElementById("submit-btn"));
  document.getElementById("submit-btn").addEventListener("click", runCheck);
});
function escapeHtml(s) {
  if (!s) return "";
  var div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}
function escapeAttr(s) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function runCheck() {
  var form = document.getElementById("quiz-form");
  var score = 0;
  var total = QDATA.length;
  QDATA.forEach(function(q) {
    var name = "q" + q.num;
    var selected = "";
    var radios = form.querySelectorAll('input[name="' + name + '"]');
    radios.forEach(function(r) { if (r.checked) selected = r.value; });
    var block = document.querySelector(".q-block[data-num=\"" + q.num + "\"]");
    if (!block) return;
    block.querySelectorAll(".result").forEach(function(el) { el.remove(); });
    var resultDiv = document.createElement("div");
    resultDiv.className = "result";
    if (selected === q.correct) {
      score++;
      resultDiv.classList.add("correct");
      resultDiv.textContent = "正解";
    } else {
      resultDiv.classList.add("incorrect");
      resultDiv.textContent = "不正解 " + (selected ? "（あなたの答え: " + selected + "）" : "（未回答）") + " → 正答: " + q.correct;
    }
    block.appendChild(resultDiv);
    var expDiv = document.createElement("div");
    expDiv.className = "result explanation";
    expDiv.textContent = "解説: " + q.explanation;
    block.appendChild(expDiv);
  });
  var box = document.getElementById("score-box");
  box.classList.add("show");
  document.getElementById("score-text").textContent = score + " / " + total + " 問正解";
  document.getElementById("submit-btn").textContent = "もう一度答え合わせ";
}
