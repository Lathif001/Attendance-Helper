let cachedData = null;

/* ================= GLOBAL SUBJECT MAP ================= */
let subjectNameMap = {};

/* ================= CACHE ================= */
function loadCachedMap(){
  try{
    const saved = localStorage.getItem("subjectNameMap");
    if(saved) subjectNameMap = JSON.parse(saved);
  }catch(e){}
}

function saveMap(){
  try{
    localStorage.setItem("subjectNameMap", JSON.stringify(subjectNameMap));
  }catch(e){}
}

/* ================= SUBJECT DETAILS ================= */
function collectSubjectDetails(){
  const lines = document.body.innerText.split("\n").map(l=>l.trim()).filter(Boolean);
  let updated = false;

  for(let i=0;i<lines.length-2;i++){
    const a = lines[i];
    const b = lines[i+1];
    const c = lines[i+2];

    if(
      /^\d+$/.test(a) &&
      /^[0-9A-Z]+$/.test(b) &&
      c.length > 3 &&
      !c.includes("Email") &&
      !c.includes("@")
    ){
      if(!subjectNameMap[b]){
        subjectNameMap[b] = c;
        updated = true;
      }
    }
  }

  if(updated) saveMap();
}

/* ================= ATTENDANCE ================= */
function collectAttendance(){
  const lines = document.body.innerText.split("\n").map(l=>l.trim()).filter(Boolean);
  const subjects = [];
  let i = 0;

  while(i < lines.length){
    if(!/^\d+$/.test(lines[i])){
      i++;
      continue;
    }

    const code = lines[i+1];
    const attended = Number(lines[i+2]);
    const conducted = Number(lines[i+3]);
    const percent = Number(lines[i+4]);

    if(
      typeof code === "string" &&
      Number.isFinite(attended) &&
      Number.isFinite(conducted) &&
      Number.isFinite(percent)
    ){
      let need = 0, a = attended, c = conducted;
      while((a/c)*100 < 75){
        a++; c++; need++;
      }

      subjects.push({
        code,
        attended,
        conducted,
        percent,
        need,
        name: subjectNameMap[code] || code
      });

      i += 5;
    }else{
      i++;
    }
  }

  /* ===== PROFILE DATA ===== */
  const pageText = document.body.innerText;
  const nameMatch = pageText.match(/^[A-Z ]{3,}$/m);
  const rollMatch = pageText.match(/\b\d{5}[A-Z]\d{2}[A-Z]\d\b/);
  const loginMatch = pageText.match(/Last Login:\s*([0-9A-Za-z:\/ ]+)/i);

  /* ===== PROFILE PHOTO ===== */
  let photo = null;
  const allImgs = document.querySelectorAll("img");

  allImgs.forEach(img=>{
    const rect = img.getBoundingClientRect();
    const src = img.src || "";

    if(
      rect.left < 300 &&
      rect.top > 200 &&
      rect.width > 60 &&
      rect.height > 60 &&
      src &&
      !src.includes("logo") &&
      !src.includes("icon") &&
      !src.includes("banner")
    ){
      photo = src;
    }
  });

  cachedData = {
    profile:{
      name: nameMatch ? nameMatch[0] : "Student",
      roll: rollMatch ? rollMatch[0] : "—",
      lastLogin: loginMatch ? loginMatch[1] : "—",
      photo
    },
    subjects
  };

  updateFloatingUI();
}

/* ================= BACKDROP ================= */

let backdrop = null;

function createBackdrop(){
  if(document.getElementById("att-backdrop")) return;

  backdrop = document.createElement("div");
  backdrop.id = "att-backdrop";
  Object.assign(backdrop.style,{
    position:"fixed",
    top:"0",
    left:"0",
    width:"100%",
    height:"100%",
    background:"rgba(15, 23, 42, 0.45)",
    backdropFilter:"blur(10px)",
    zIndex:"999998",
    display:"none",
    opacity:"0",
    transition:"opacity 0.3s ease"
  });

  document.body.appendChild(backdrop);
  backdrop.onclick = ()=> closePanel();
}

/* ================= FLOATING UI ================= */

let floatingBtn = null;
let floatingPanel = null;
let subjectDiv = null;
let toggleBtn = null;
let themeBtn = null;
let panelVisible = false;
let lock = false;

function isMobile(){
  return window.innerWidth <= 768;
}

function createFloatingUI(){
  if(document.getElementById("att-float-btn")) return;

  floatingBtn = document.createElement("button");
  floatingBtn.id = "att-float-btn";
  floatingBtn.textContent = "Attendance";
  Object.assign(floatingBtn.style,{
    position:"fixed",
    bottom:"20px",
    left:"50%",
    transform:"translateX(-50%)",
    padding:"14px 32px",
    borderRadius:"999px",
    border:"none",
    background:"#2563eb",
    color:"#fff",
    fontSize:isMobile()?"17px":"15px",
    fontWeight:"bold",
    cursor:"pointer",
    zIndex:"999999",
    boxShadow:"0 6px 16px rgba(0,0,0,.3)"
  });
  document.body.appendChild(floatingBtn);

  floatingPanel = document.createElement("div");
  floatingPanel.id = "att-panel";

  const mobile = isMobile();

  Object.assign(floatingPanel.style,{
    position:"fixed",
    top: mobile ? "0" : "50%",
    left: mobile ? "0" : "50%",
    transform: mobile ? "none" : "translate(-50%,-60%)",
    width: mobile ? "100%" : "380px",
    height: mobile ? "100%" : "auto",
    maxHeight: mobile ? "100%" : "80vh",
    overflowY:"auto",
    background:"#f8fafc",
    borderRadius: mobile ? "0px" : "18px",
    padding: mobile ? "16px" : "14px",
    boxShadow:"0 12px 30px rgba(0,0,0,.4)",
    zIndex:"999999",
    display:"none",
    fontFamily:"Arial",
    opacity:"0",
    transition:"opacity 0.3s ease, transform 0.3s ease"
  });

  floatingPanel.innerHTML = `
    <div style="position:relative;">
      
      <!-- THEME BUTTON TOP RIGHT -->
      <button id="themeToggle" 
        style="
          position:absolute;
          top:6px;
          right:8px;
          border:none;
          background:transparent;
          font-size:20px;
          cursor:pointer;
          opacity:0.85;
        ">
        🌙
      </button>

      <!-- PROFILE HEADER -->
      <div style="display:flex;gap:12px;align-items:center;padding-top:6px;">
        <img id="photo" style="width:56px;height:56px;border-radius:50%;">
        
        <div>
          <div id="name" style="font-weight:bold;font-size:17px;">Student</div>
          <div id="roll" style="font-size:14px;">—</div>
          <div id="login" style="font-size:13px;">Last login: —</div>
        </div>
      </div>

      <!-- OVERALL -->
      <div style="text-align:center;margin-top:16px;">
        <div id="overall" style="font-size:40px;font-weight:bold;">--%</div>
        <div id="barWrap" style="height:12px;background:#e5e7eb;border-radius:10px;margin:10px 0;">
          <div id="bar" style="height:12px;border-radius:10px;width:0%;"></div>
        </div>
        <div id="stats" style="font-size:15px;line-height:1.6;"></div>
      </div>

      <!-- BUTTON -->
      <button id="toggleBtn" style="width:100%;margin-top:16px;padding:14px;border:none;border-radius:12px;background:#3b82f6;color:#fff;font-weight:bold;font-size:16px;cursor:pointer;">
        Show Subject Details
      </button>

      <!-- SUBJECTS -->
      <div id="subjects" style="display:none;margin-bottom:80px;"></div>

      <div style="text-align:center;font-size:11px;margin-top:12px;opacity:.6;">Attendance Helper</div>
    </div>
  `;

  document.body.appendChild(floatingPanel);

  subjectDiv = floatingPanel.querySelector("#subjects");
  toggleBtn = floatingPanel.querySelector("#toggleBtn");
  themeBtn = floatingPanel.querySelector("#themeToggle");

  floatingBtn.onclick = ()=>{
    panelVisible = !panelVisible;
    panelVisible ? openPanel() : closePanel();
  };

  toggleBtn.onclick = ()=>{
    const show = subjectDiv.style.display === "none";
    subjectDiv.style.display = show ? "block" : "none";
    toggleBtn.textContent = show ? "Hide Subject Details" : "Show Subject Details";
  };

  if(localStorage.getItem("theme") === "dark"){
    themeBtn.textContent = "☀️";
    setTimeout(()=>applyTheme(true),50);
  }

  themeBtn.onclick = ()=>{
    const dark = localStorage.getItem("theme") !== "dark";
    localStorage.setItem("theme", dark ? "dark" : "light");
    themeBtn.textContent = dark ? "☀️" : "🌙";
    applyTheme(dark);
  };
}

/* ================= THEME ENGINE ================= */

function applyTheme(dark){
  const barWrap = floatingPanel.querySelector("#barWrap");

  if(dark){
    floatingPanel.style.background = "#020617";
    floatingPanel.style.color = "#e5e7eb";
    barWrap.style.background = "#1e293b";
  }else{
    floatingPanel.style.background = "#f8fafc";
    floatingPanel.style.color = "#020617";
    barWrap.style.background = "#e5e7eb";
  }

  const cards = subjectDiv.querySelectorAll("div");
  cards.forEach(card=>{
    const safe = card.dataset.safe === "true";
    if(dark){
      card.style.background = safe ? "#064e3b" : "#450a0a";
      card.style.color = "#f8fafc";
    }else{
      card.style.background = safe ? "#d1fae5" : "#fee2e2";
      card.style.color = safe ? "#065f46" : "#7f1d1d";
    }
  });
}

/* ================= PANEL CONTROL ================= */

function openPanel(){
  floatingPanel.style.display = "block";
  backdrop.style.display = "block";

  setTimeout(()=>{
    floatingPanel.style.opacity = "1";
    floatingPanel.style.transform = "translate(-50%,-50%)";
    backdrop.style.opacity = "1";
  },10);
}

function closePanel(){
  panelVisible = false;
  floatingPanel.style.opacity = "0";
  floatingPanel.style.transform = "translate(-50%,-60%)";
  backdrop.style.opacity = "0";

  setTimeout(()=>{
    floatingPanel.style.display = "none";
    backdrop.style.display = "none";
  },300);
}

/* ================= UPDATE UI ================= */

function updateFloatingUI(){
  if(!cachedData || !floatingPanel || lock) return;
  lock = true;

  try{
    const nameEl = floatingPanel.querySelector("#name");
    const rollEl = floatingPanel.querySelector("#roll");
    const loginEl = floatingPanel.querySelector("#login");
    const photoEl = floatingPanel.querySelector("#photo");
    const overallEl = floatingPanel.querySelector("#overall");
    const barEl = floatingPanel.querySelector("#bar");
    const statsEl = floatingPanel.querySelector("#stats");

    nameEl.textContent = cachedData.profile.name;
    rollEl.textContent = cachedData.profile.roll;
    loginEl.textContent = "Last login: " + cachedData.profile.lastLogin;
    photoEl.src = cachedData.profile.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    let ta = 0, tc = 0;
    cachedData.subjects.forEach(s=>{
      ta += s.attended;
      tc += s.conducted;
    });

    if(tc > 0){
      const percent = (ta/tc)*100;
      overallEl.textContent = percent.toFixed(2)+"%";
      barEl.style.width = Math.min(percent,100) + "%";
      barEl.style.background = percent >= 75 ? "#22c55e" : "#ef4444";

      let need = 0, a = ta, c = tc;
      while((a/c)*100 < 75){ a++; c++; need++; }

      statsEl.innerHTML = `
        📚 Attended: <b>${ta}</b><br>
        🧮 Conducted: <b>${tc}</b><br>
        ${percent < 75 ? `⚠️ Need <b>${need}</b> more classes` : `✅ Attendance is safe`}
      `;
    }

    subjectDiv.innerHTML = "";
    cachedData.subjects.forEach(s=>{
      const d = document.createElement("div");
      d.dataset.safe = s.percent >= 75 ? "true" : "false";
      d.style.fontSize = "15px";
      d.style.padding = "10px";
      d.style.margin = "6px 0";
      d.style.borderRadius = "8px";
      d.textContent = `${s.name} (${s.code}) : ${s.percent.toFixed(2)}%`;
      subjectDiv.appendChild(d);
    });

    applyTheme(localStorage.getItem("theme") === "dark");

  }finally{
    setTimeout(()=>{ lock = false; }, 80);
  }
}

/* ================= SMART RUN ================= */

let lastHash = "";

function smartRun(){
  const hash = document.body.innerText.length + location.href;
  if(hash === lastHash) return;
  lastHash = hash;
  collectSubjectDetails();
  collectAttendance();
}

/* ================= INIT ================= */

function init(){
  loadCachedMap();
  createFloatingUI();
  createBackdrop();
  smartRun();

  const observer = new MutationObserver(()=>{
    smartRun();
  });

  observer.observe(document.body,{ childList:true, subtree:true });
}

init();

/* ================= ESC CLOSE ================= */

document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape"){
    if(panelVisible){
      closePanel();
    }
  }
});

/* ================= MESSAGE HANDLER ================= */

chrome.runtime.onMessage.addListener((req,sender,sendResponse)=>{
  if(req.action === "getAttendance"){
    sendResponse(cachedData);
  }
});
