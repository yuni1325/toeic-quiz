var TARGET_MINUTES = { part5: 10, part6: 10, part7: 55 };
var timerStart = null;
var timerInterval = null;
function formatTime(seconds) {
  var m = Math.floor(seconds / 60);
  var s = Math.floor(seconds % 60);
  return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
}
function updateTimerDisplay() {
  var box = document.getElementById("timer-box");
  if (!box || !timerStart) return;
  var elapsed = Math.floor((Date.now() - timerStart) / 1000);
  var meta = getExamAndPart();
  var targetSec = (TARGET_MINUTES[meta.part] || 10) * 60;
  var over = elapsed > targetSec;
  document.getElementById("timer-elapsed").textContent = formatTime(elapsed);
  document.getElementById("timer-target").textContent = formatTime(targetSec);
  box.classList.toggle("timer-over", over);
}
function startTimer() {
  if (timerInterval) return;
  timerStart = Date.now();
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}
document.addEventListener("DOMContentLoaded", function() {
  if (typeof QDATA === "undefined") return;
  var form = document.getElementById("quiz-form");
  var container = document.getElementById("quiz-container");
  if (!form || !container) return;
  var meta = getExamAndPart();
  var targetMin = TARGET_MINUTES[meta.part] || 10;
  var timerBox = document.createElement("div");
  timerBox.id = "timer-box";
  timerBox.className = "quiz-timer";
  timerBox.innerHTML = '<span class="timer-label">経過</span> <span id="timer-elapsed">0:00</span> <span class="timer-sep">/</span> <span class="timer-label">目標</span> <span id="timer-target">' + formatTime(targetMin * 60) + '</span>';
  if (!document.getElementById("quiz-timer-style")) {
    var style = document.createElement("style");
    style.id = "quiz-timer-style";
    style.textContent = "#timer-box.quiz-timer { position: fixed; top: 0; left: 0; right: 0; max-width: 720px; margin: 0 auto; background: #fff; padding: 10px 16px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.12); z-index: 9999; font-size: 1rem; } body.quiz-timer-active { padding-top: 48px !important; } #timer-box.quiz-timer .timer-label { color: #666; } #timer-box.quiz-timer #timer-elapsed { font-weight: bold; color: #1a73e8; } #timer-box.quiz-timer.timer-over #timer-elapsed { color: #c5221f; } #timer-box.quiz-timer .timer-sep { color: #999; margin: 0 4px; }";
    document.head.appendChild(style);
  }
  document.body.classList.add("quiz-timer-active");
  form.parentNode.insertBefore(timerBox, form);
  startTimer();
  var frag = document.createDocumentFragment();
  QDATA.forEach(function(q) {
    if (q.passage) {
      var passageBox = document.createElement("div");
      passageBox.className = "passage-box";
      passageBox.innerHTML = '<div class="passage-label">Reading passage</div><div class="passage-text">' + escapeHtml(q.passage).replace(/\n/g, "<br>") + '</div>';
      frag.appendChild(passageBox);
    }
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
function getExamAndPart() {
  var path = (window.location.pathname || "").replace(/^\//, "");
  var exam = "quiz";
  if (path.indexOf("exam2") !== -1) exam = "exam2";
  else if (path.indexOf("exam3") !== -1) exam = "exam3";
  else if (path.indexOf("exam4") !== -1) exam = "exam4";
  else if (path.indexOf("exam5") !== -1) exam = "exam5";
  var part = "part5";
  if (path.indexOf("part6") !== -1) part = "part6";
  else if (path.indexOf("part7") !== -1) part = "part7";
  return { exam: exam, part: part };
}
var STORAGE_KEY = "toeic_wrong_answers";
function saveWrongAnswers(wrongList) {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    var list = raw ? JSON.parse(raw) : [];
    wrongList.forEach(function(item) { list.push(item); });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}
function runCheck() {
  var form = document.getElementById("quiz-form");
  var score = 0;
  var total = QDATA.length;
  var wrongList = [];
  var meta = getExamAndPart();
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
      wrongList.push({
        exam: meta.exam,
        part: meta.part,
        num: q.num,
        desc: q.desc,
        correct: q.correct,
        userAnswer: selected || "",
        explanation: q.explanation,
        options: q.options ? q.options.slice() : [],
        passage: q.passage || "",
        date: new Date().toISOString()
      });
    }
    block.appendChild(resultDiv);
    var expDiv = document.createElement("div");
    expDiv.className = "result explanation";
    expDiv.textContent = "解説: " + q.explanation;
    block.appendChild(expDiv);
  });
  if (wrongList.length > 0) saveWrongAnswers(wrongList);
  var box = document.getElementById("score-box");
  box.classList.add("show");
  document.getElementById("score-text").textContent = score + " / " + total + " 問正解";
  document.getElementById("submit-btn").textContent = "もう一度答え合わせ";
  var reviewLink = document.getElementById("review-link-wrap");
  if (reviewLink) reviewLink.remove();
  if (wrongList.length > 0) {
    var wrap = document.createElement("p");
    wrap.id = "review-link-wrap";
    wrap.style.marginTop = "12px";
    wrap.innerHTML = '間違えた問題を記録しました。<a href="../review.html">振り返りページで確認する</a>';
    box.appendChild(wrap);
  }
}
