document.addEventListener("DOMContentLoaded",()=>{

const photo = document.getElementById("photo");
const name = document.getElementById("name");
const roll = document.getElementById("roll");
const login = document.getElementById("login");
const overall = document.getElementById("overall");
const bar = document.getElementById("bar");
const stats = document.getElementById("stats");
const subjectsDiv = document.getElementById("subjects");
const toggleBtn = document.getElementById("toggleBtn");
const themeBtn = document.getElementById("themeToggle");

let visible = false;

/* ===== THEME ===== */
if(localStorage.getItem("theme")==="dark"){
  document.body.classList.add("dark");
  themeBtn.innerText="☀️";
}
themeBtn.onclick=()=>{
  document.body.classList.toggle("dark");
  const dark=document.body.classList.contains("dark");
  localStorage.setItem("theme",dark?"dark":"light");
  themeBtn.innerText=dark?"☀️":"🌙";
};

/* ===== DATA ===== */
chrome.tabs.query({active:true,currentWindow:true},tabs=>{
  if(!tabs[0]) return;

  chrome.tabs.sendMessage(tabs[0].id,{action:"getAttendance"},data=>{
	if(chrome.runtime.lastError){
		console.log("Content script not ready:", chrome.runtime.lastError.message);
		return;
  }


    /* ===== PROFILE ===== */
    name.innerText = data.profile.name || "Student";
    roll.innerText = data.profile.roll || "—";
    login.innerText = "Last login: " + (data.profile.lastLogin || "—");

    /* ===== PROFILE PHOTO (FIXED) ===== */
    if(
      data.profile.photo &&
      !data.profile.photo.includes("customer_logo") &&
      !data.profile.photo.includes("advaya") &&
      !data.profile.photo.includes("mits")
    ){
      // real user photo
      photo.src = data.profile.photo;
    }else{
      // clean default outline avatar
      photo.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    }

    /* ===== TOTAL ===== */
    let ta=0, tc=0;
    data.subjects.forEach(s=>{
      ta += Number(s.attended || 0);
      tc += Number(s.conducted || 0);
    });

    if(tc === 0){
      overall.innerText="--%";
      return;
    }

    const percent=(ta/tc)*100;
    overall.innerText=percent.toFixed(2)+"%";
    bar.style.width=Math.min(percent,100)+"%";
    bar.style.background=percent>=75?"#16a34a":"#dc2626";

    let need=0,a=ta,c=tc;
    while((a/c)*100<75){a++;c++;need++;}

    stats.innerHTML=`
      📚 Attended: <b>${ta}</b><br>
      🧮 Conducted: <b>${tc}</b><br>
      ${percent<75?`⚠️ Need <b>${need}</b> more classes`:`✅ Attendance is safe`}
    `;

    /* ===== SUBJECTS (FIXED FORMAT) ===== */
    subjectsDiv.innerHTML="";
    data.subjects.forEach(s=>{
      const div=document.createElement("div");
      div.className="subject "+(s.percent>=75?"good":"bad");

      // ✅ SUBJECT NAME + (CODE) + %
      div.innerText = `${s.name} (${s.code}) : ${s.percent.toFixed(2)}%`;

      subjectsDiv.appendChild(div);
    });
  });
});

/* ===== TOGGLE ===== */
toggleBtn.onclick=()=>{
  visible=!visible;
  subjectsDiv.style.display=visible?"block":"none";
  toggleBtn.innerText=visible?"Hide Subject Details":"Show Subject Details";
};

});
