import React, { useState, useMemo, useEffect } from "react";
import schulioLogo from "./assets/schulio-logo.png";
import {
  LayoutGrid, GraduationCap, CalendarDays, ListChecks, StickyNote,
  Clock, Plus, X, Trash2, Pencil, Star, Moon, Sun, ChevronLeft,
  ChevronRight, Bell, BookOpenCheck, TrendingUp, TrendingDown,
  Search, CheckCircle2, Circle, Sparkles, UserCircle, Menu, GripVertical, Camera, KeyRound, Save, LogOut, UserPlus, Lock,
  Timer, Target, Zap, Brain, BookOpen, Flame, ArrowRight, CheckSquare2, RotateCcw, Mail, Settings as SettingsIcon, ShieldCheck, Users, Send, Languages, Palette, Monitor, BellRing
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  registerUser, loginUser, logoutUser, fetchMe, fetchProfile, saveProfile,
  fetchData, saveData, changePassword as apiChangePassword,
  getStoredSession, persistSession, clearSession, setToken, setUnauthorizedHandler,
  fetchMailbox, markMailboxRead, fetchAdminUsers, sendAdminBroadcast,
} from "./api.js";

const SUBJECT_COLORS = ["#3A5BFF", "#FF6B4A", "#1FAE6E", "#A855F7", "#F5A623", "#EC4899", "#14B8A6", "#6366F1"];
const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const REMINDER_OPTS = [
  { v: 5, l: "5 Min. vorher" }, { v: 15, l: "15 Min. vorher" }, { v: 30, l: "30 Min. vorher" },
  { v: 60, l: "1 Std. vorher" }, { v: 1440, l: "1 Tag vorher" }, { v: 4320, l: "3 Tage vorher" },
  { v: 10080, l: "1 Woche vorher" },
];
const EVENT_TYPES = ["Klassenarbeit","Klausur","Prüfung","Test","Präsentation","Referat","Abgabe","Projekt","Klassenfahrt","Wandertag","Schulveranstaltung","Sonstiges"];
const GRADE_TYPES = { written: ["Klassenarbeit","Klausur","Test","Hausaufgabe","Projekt"], oral: ["Mündlich","Präsentation","Referat","Sonstiges"] };

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => { const d = new Date(iso + "T00:00:00"); return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const fmtShort = (iso) => { const d = new Date(iso + "T00:00:00"); return `${d.getDate()}.${d.getMonth()+1}.`; };
const daysUntil = (iso) => Math.ceil((new Date(iso+"T00:00:00") - new Date(todayISO()+"T00:00:00")) / 86400000);

function seedData() {
  const subjects = [
    { id: "math", name: "Mathematik", color: SUBJECT_COLORS[0], writtenWeight: 60, oralWeight: 40 },
    { id: "de", name: "Deutsch", color: SUBJECT_COLORS[1], writtenWeight: 50, oralWeight: 50 },
    { id: "en", name: "Englisch", color: SUBJECT_COLORS[2], writtenWeight: 40, oralWeight: 60 },
    { id: "info", name: "Informatik", color: SUBJECT_COLORS[3], writtenWeight: 30, oralWeight: 70 },
    { id: "sport", name: "Sport", color: SUBJECT_COLORS[4], writtenWeight: 0, oralWeight: 100 },
  ];
  const grades = [
    { id: uid(), subjectId: "math", kind: "written", type: "Klassenarbeit", value: 3.0, date: "2026-06-10" },
    { id: uid(), subjectId: "math", kind: "written", type: "Klassenarbeit", value: 2.3, date: "2026-08-05" },
    { id: uid(), subjectId: "math", kind: "written", type: "Test", value: 1.7, date: "2026-09-01" },
    { id: uid(), subjectId: "math", kind: "oral", type: "Mündlich", value: 2.0, date: "2026-08-20" },
    { id: uid(), subjectId: "de", kind: "written", type: "Klassenarbeit", value: 2.7, date: "2026-07-15" },
    { id: uid(), subjectId: "de", kind: "oral", type: "Präsentation", value: 1.3, date: "2026-09-02" },
    { id: uid(), subjectId: "en", kind: "written", type: "Test", value: 2.0, date: "2026-08-12" },
    { id: uid(), subjectId: "en", kind: "oral", type: "Mündlich", value: 1.7, date: "2026-09-05" },
    { id: uid(), subjectId: "info", kind: "oral", type: "Projekt", value: 1.0, date: "2026-08-28" },
  ];
  const events = [
    { id: uid(), title: "Mathematik Klassenarbeit", subjectId: "math", date: "2026-09-24", from: "10:15", to: "11:00", location: "Raum 204", type: "Klassenarbeit", priority: "hoch", notes: "Themen: Ableitungen, Kurvendiskussion", reminders: [10080, 1440, 30] },
    { id: uid(), title: "Englisch Präsentation", subjectId: "en", date: "2026-09-18", from: "13:30", to: "14:15", location: "Raum 112", type: "Präsentation", priority: "normal", notes: "", reminders: [1440] },
    { id: uid(), title: "Klassenfahrt", subjectId: null, date: "2026-10-05", from: "08:00", to: "16:00", location: "Jugendherberge", type: "Klassenfahrt", priority: "normal", notes: "", reminders: [10080] },
  ];
  const tasks = [
    { id: uid(), title: "Matheaufgaben S. 42", subjectId: "math", due: "2026-09-16", priority: "hoch", status: "offen", subtasks: [] },
    { id: uid(), title: "Englisch Vokabeln lernen", subjectId: "en", due: "2026-09-17", priority: "normal", status: "in Bearbeitung", subtasks: [] },
    { id: uid(), title: "Deutsch Lektüre lesen", subjectId: "de", due: "2026-09-20", priority: "niedrig", status: "offen", subtasks: [] },
  ];
  const notes = [
    { id: uid(), title: "Mathe – wichtige Formeln", content: "Mitternachtsformel, binomische Formeln, Ableitungsregeln wiederholen.", subjectId: "math", favorite: true, createdAt: "2026-09-10" },
  ];
  const schedule = [
    { id: uid(), subjectId: "math", teacher: "Fr. Weber", room: "204", day: 0, start: "08:00", end: "08:45" },
    { id: uid(), subjectId: "math", teacher: "Fr. Weber", room: "204", day: 0, start: "08:45", end: "09:30" },
    { id: uid(), subjectId: "en", teacher: "Hr. Klein", room: "112", day: 0, start: "09:50", end: "10:35" },
    { id: uid(), subjectId: "de", teacher: "Fr. Bauer", room: "108", day: 1, start: "08:00", end: "08:45" },
    { id: uid(), subjectId: "info", teacher: "Hr. Roth", room: "EDV1", day: 1, start: "08:45", end: "09:30" },
    { id: uid(), subjectId: "math", teacher: "Fr. Weber", room: "204", day: 1, start: "09:50", end: "10:35" },
    { id: uid(), subjectId: "en", teacher: "Hr. Klein", room: "112", day: 2, start: "08:00", end: "08:45" },
    { id: uid(), subjectId: "sport", teacher: "Hr. Fuchs", room: "Halle", day: 2, start: "09:50", end: "11:20" },
  ];
  return { subjects, grades, events, tasks, notes, schedule, flashcards: [
    { id: uid(), question: "Was ist die Mitternachtsformel?", answer: "x = (-b ± √(b² - 4ac)) / (2a)", subjectId: "math" },
    { id: uid(), question: "Was bedeutet photosynthesis?", answer: "Fotosynthese: Pflanzen wandeln Lichtenergie in chemische Energie um.", subjectId: "" }
  ] };
}

function Avg(nums) { if (!nums.length) return null; return nums.reduce((a,b)=>a+b,0)/nums.length; }

export default function App() {
  const [dark, setDark] = useState(false);
  const [session, setSession] = useState(null); // { username, role }
  const [checkingSession, setCheckingSession] = useState(true);

  // Beim Start prüfen, ob noch ein gespeicherter Login existiert, damit man
  // sich nicht bei jedem Start neu anmelden muss.
  useEffect(() => {
    // Wenn der Server einen Token als ungültig/abgelaufen ablehnt -> abmelden.
    setUnauthorizedHandler(() => { clearSession(); setToken(null); setSession(null); });
    const stored = getStoredSession();
    if (!stored) { setCheckingSession(false); return; }
    setToken(stored.token);
    fetchMe()
      .then((me) => setSession({ username: me.username, role: me.role || "user" }))
      .catch((err) => {
        if (err.status === 401) return; // bereits vom Handler oben behandelt
        // Netzwerk-/Serverproblem (z. B. Server wacht gerade erst auf):
        // angemeldet bleiben statt den Login zu löschen.
        if (stored.username) setSession({ username: stored.username, role: stored.username.toLowerCase() === "organisator" ? "admin" : "user" });
        else { clearSession(); setToken(null); }
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogin = (username, token, remember, role = "user") => {
    persistSession({ token, username, remember });
    setSession({ username, role });
  };

  const handleLogout = async () => {
    await logoutUser();
    clearSession();
    setToken(null);
    setSession(null);
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
    html, body, #root { margin:0; min-height:100%; width:100%; }
    * { box-sizing: border-box; }
    .sapp { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height:100vh; height:100vh; width:100%; border-radius:0; overflow:hidden; display:flex; }
    .sapp h1, .sapp h2, .sapp h3, .sapp .disp { font-family: 'Space Grotesk', sans-serif; }
    .sapp[data-theme='light'] {
      --bg:#F4F5FA; --surface:#FFFFFF; --surface-alt:#EEF0FA; --border:#E2E4F0; --text:#14151F; --text-muted:#6B6F85;
      --primary:#147BEF; --primary-soft:#E8F3FF; --accent:#1FC7B5; --success:#20C997; --warning:#F5A623; --danger:#E5484D;
    }
    .sapp[data-theme='dark'] {
      --bg:#101018; --surface:#181A26; --surface-alt:#1F2233; --border:#2A2D40; --text:#F2F2F7; --text-muted:#9497AE;
      --primary:#1688F7; --primary-soft:#12304D; --accent:#24D7B8; --success:#35D28A; --warning:#F7B84B; --danger:#F26A6E;
    }
    .sidebar { width:230px; background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; padding:18px 12px; gap:8px; flex-shrink:0; }
    .sidebar .logo { width:44px; height:44px; border-radius:13px; object-fit:cover; box-shadow:0 8px 18px rgba(20,123,239,.18); flex-shrink:0; }
    .sidebar-head { display:flex; align-items:center; gap:10px; padding:2px 8px 16px; margin-bottom:4px; border-bottom:1px solid var(--border); }
    .sidebar-title { display:block; font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:20px; letter-spacing:-.4px; }
    .sidebar-close { display:none; }
    .sidebar-nav, .sidebar-foot { display:flex; flex-direction:column; align-items:stretch; gap:3px; width:100%; }
    .navbadge{margin-left:auto;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--primary);color:white;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800}
    .compact-mode .card{padding:12px}.compact-mode .content{padding-top:14px}.compact-mode .rowline{padding:7px 0}
    .reduced-motion *, .reduced-motion *::before, .reduced-motion *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
    .sidebar-foot { margin-top:auto; padding-top:10px; border-top:1px solid var(--border); }
    .navgroup-title { padding:10px 12px 5px; font-size:10px; font-weight:800; letter-spacing:.08em; color:var(--text-muted); text-transform:uppercase; }
    .navitem { width:100%; min-height:42px; padding:0 12px; border-radius:11px; display:flex; flex-direction:row; align-items:center; justify-content:flex-start; gap:11px; color:var(--text-muted); cursor:pointer; border:none; background:transparent; transition:.15s; font-family:inherit; -webkit-tap-highlight-color:transparent; text-align:left; }
    .navitem:hover { background:var(--surface-alt); color:var(--text); }
    .navitem.active { background:var(--primary-soft); color:var(--primary); }
    .navitem .navlabel { font-size:13px; font-weight:600; line-height:1.1; }
    .navbtn { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); cursor:pointer; border:none; background:transparent; transition:.15s; }
    .navbtn:hover { background:var(--surface-alt); color:var(--text); }
    .navbtn.active { background:var(--primary-soft); color:var(--primary); }
    .main { flex:1; display:flex; flex-direction:column; min-width:0; min-height:0; }
    .topbar { flex-shrink:0; display:flex; align-items:center; justify-content:space-between; padding:16px 28px; border-bottom:1px solid var(--border); }
    .content { flex:1; min-height:0; padding:24px 28px 34px; overflow-y:auto; max-height:none; }
    .card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:18px; }
    .btn { display:inline-flex; align-items:center; gap:6px; background:var(--primary); color:white; border:none; padding:9px 14px; border-radius:10px; font-weight:600; font-size:13px; cursor:pointer; }
    .btn.secondary { background:var(--surface-alt); color:var(--text); }
    .btn.ghost { background:transparent; color:var(--text-muted); padding:6px; }
    .pill { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:99px; font-size:11px; font-weight:600; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
    input, select, textarea { box-sizing:border-box; font-family:'Inter'; background:var(--surface-alt); border:1px solid var(--border); border-radius:8px; padding:8px 10px; color:var(--text); font-size:13px; width:100%; }
    label.fl { font-size:12px; color:var(--text-muted); font-weight:600; display:block; margin-bottom:4px; }
    .rowline { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border); }
    .rowline:last-child { border-bottom:none; }
    .iconbtn { border:none; background:transparent; cursor:pointer; color:var(--text-muted); padding:4px; border-radius:6px; }
    .iconbtn:hover { background:var(--surface-alt); color:var(--text); }
    .mobile-menu-btn{display:none}
    .mobile-backdrop{display:none}
    .profile-mini{display:flex;align-items:center;gap:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);padding:5px 9px 5px 5px;border-radius:999px;cursor:pointer;font-weight:600}
    .profile-mini img,.profile-mini>span:first-child{width:30px;height:30px;border-radius:50%;object-fit:cover;display:flex;align-items:center;justify-content:center;background:var(--primary-soft);color:var(--primary);font-weight:700}
    .profile-mini-name{font-size:12px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .subject-card{transition:transform .15s,box-shadow .15s,border-color .15s}
    .subject-card.dragging{opacity:.45;transform:scale(.99)}
    .subject-card.drag-over{border-color:var(--primary);box-shadow:0 0 0 2px var(--primary-soft)}
    .drag-handle{cursor:grab;color:var(--text-muted);display:flex;align-items:center;padding:5px;border-radius:7px;touch-action:none}
    .profile-avatar{width:96px;height:96px;border-radius:50%;object-fit:cover;background:var(--primary-soft);display:flex;align-items:center;justify-content:center;color:var(--primary);font-size:30px;font-weight:700;border:3px solid var(--border);overflow:hidden}
    .profile-avatar img{width:100%;height:100%;object-fit:cover}
    .profile-grid{display:grid;grid-template-columns:180px 1fr;gap:24px;align-items:start}
    .profile-section{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px}
    .hero-card{position:relative;overflow:hidden;background:linear-gradient(135deg,var(--primary),#7C4DFF);color:white;border:none;box-shadow:0 16px 34px rgba(58,91,255,.20)}
    .hero-card:after{content:"";position:absolute;width:220px;height:220px;border-radius:50%;right:-70px;top:-100px;background:rgba(255,255,255,.12)}
    .hero-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px;position:relative;z-index:1}
    .hero-btn{background:rgba(255,255,255,.16)!important;color:white!important;border:1px solid rgba(255,255,255,.18)!important;backdrop-filter:blur(6px)}
    .stat-card{position:relative;overflow:hidden;transition:transform .16s,box-shadow .16s}.stat-card:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.07)}
    .stat-icon{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:var(--primary-soft);color:var(--primary)}
    .section-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.section-head h3{margin:0;font-size:15px}
    .empty-state{padding:20px;text-align:center;color:var(--text-muted);background:var(--surface-alt);border-radius:12px}
    .focus-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:16px}.timer-ring{width:190px;height:190px;border-radius:50%;margin:10px auto 18px;background:conic-gradient(var(--primary) var(--progress),var(--surface-alt) 0);display:grid;place-items:center}.timer-ring:before{content:"";position:absolute}.timer-inner{width:156px;height:156px;border-radius:50%;background:var(--surface);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px var(--border)}
    .flashcard{min-height:220px;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;border:1px dashed var(--border);background:linear-gradient(145deg,var(--surface),var(--surface-alt));border-radius:16px;cursor:pointer;user-select:none}.flashcard:hover{border-color:var(--primary)}
    .kbd{font-size:10px;padding:3px 6px;border:1px solid var(--border);border-bottom-width:2px;border-radius:5px;background:var(--surface-alt);color:var(--text-muted)}
    @media(max-width:760px){
      html,body{-webkit-text-size-adjust:100%}
      .sapp{min-height:100vh;min-height:100dvh;height:auto;border-radius:0;width:100%;overflow:visible}
      .sidebar{position:fixed;z-index:70;left:0;top:0;bottom:0;width:min(310px,88vw);transform:translateX(-105%);transition:transform .22s ease,visibility 0s linear .22s;align-items:stretch;justify-content:flex-start;gap:0;overflow-y:auto;overscroll-behavior:contain;
        padding:calc(env(safe-area-inset-top,0px) + 14px) 12px calc(env(safe-area-inset-bottom,0px) + 14px);box-shadow:0 12px 40px rgba(0,0,0,.25);visibility:hidden}
      .sidebar.mobile-open{transform:translateX(0);visibility:visible;transition:transform .22s ease,visibility 0s}
      .sidebar-head{justify-content:flex-start;gap:12px;padding:4px 6px 14px;margin-bottom:4px;border-bottom:1px solid var(--border)}
      .sidebar-title{display:block;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:19px;flex:1}
      .sidebar .logo{width:42px;height:42px}
      .sidebar-close{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border:none;border-radius:10px;background:var(--surface-alt);color:var(--text);cursor:pointer}
      .sidebar-nav{align-items:stretch;gap:2px}
      .sidebar-foot{align-items:stretch;gap:3px;padding-top:12px;margin-top:auto;border-top:1px solid var(--border)}
      .navgroup-title{padding:11px 16px 5px;font-size:10px}
      .navitem{width:100%;flex-direction:row;justify-content:flex-start;gap:14px;min-height:48px;padding:0 16px;border-radius:12px;text-align:left}
      .navitem .navlabel{font-size:16px;font-weight:500;line-height:1.2}
      .navitem.active .navlabel{font-weight:600}
      .mobile-menu-btn{display:flex;position:fixed;z-index:45;top:calc(env(safe-area-inset-top,0px) + 12px);left:12px;width:42px;height:42px;padding:0;border:1px solid var(--border);border-radius:12px;background:var(--surface);color:var(--text);align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,.08);cursor:pointer}
      .mobile-backdrop{display:block;position:fixed;inset:0;z-index:65;background:rgba(0,0,0,.4)}
      .topbar{position:sticky;top:0;z-index:40;background:var(--bg);padding:calc(env(safe-area-inset-top,0px) + 12px) 14px 12px 66px;min-height:calc(env(safe-area-inset-top,0px) + 66px);border-bottom:1px solid var(--border)}
      .topbar-title h2{font-size:18px!important}
      .profile-mini-name{display:none}
      .iconbtn{padding:10px}
      .content{padding:14px 14px calc(env(safe-area-inset-bottom,0px) + 28px);max-height:none;overflow-y:visible}
      .grid2,.grid3,.focus-grid{grid-template-columns:1fr}
      .card{padding:15px}
      .btn{min-height:42px;padding:10px 16px;font-size:14px}
      /* 16px verhindert, dass iOS beim Antippen eines Feldes hineinzoomt */
      input,select,textarea{font-size:16px;padding:11px 12px;min-height:44px}
      input[type=checkbox],input[type=radio]{min-height:0}
      .profile-grid{grid-template-columns:1fr}
      .profile-avatar{margin:auto}
      .grade-entry{grid-template-columns:1fr!important}.grade-entry > *{min-width:0;width:100%}.grade-entry input,.grade-entry select{min-width:0;max-width:100%}
      .subject-header{align-items:flex-start!important;gap:8px!important}
      .subject-header > div:first-child{flex:1 1 auto;min-width:0;display:flex;flex-wrap:wrap!important;align-items:center!important;row-gap:5px!important}
      .subject-header > div:first-child b{flex:1 1 auto;min-width:0;max-width:none;overflow-wrap:anywhere;overflow:visible!important;text-overflow:clip!important;white-space:normal!important;word-break:break-word;font-size:14px!important}
      .subject-header > div:first-child > span:last-child{flex:0 0 100%;white-space:normal!important;line-height:1.25}
      .subject-header > div:last-child{flex-shrink:0!important}
      .grade-entry .btn{grid-column:1/-1}
      .cal-grid{grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:3px!important}
      .cal-cell{min-height:58px!important;padding:3px!important;border-radius:8px!important}
      /* Dialoge als "Bottom Sheet" von unten */
      .modal-overlay{align-items:flex-end!important}
      .modal-content{width:100%!important;max-width:none!important;max-height:90vh!important;max-height:90dvh!important;border-radius:20px 20px 0 0!important;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 18px)!important}
      .calendar-add-label{display:none}
      .calendar-add-btn{width:42px;height:42px;padding:0;justify-content:center;border-radius:12px}
    }
    .topbar{backdrop-filter:blur(12px)}\n    button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--primary-soft);outline-offset:2px}\n    @media(max-width:480px){
      .content{padding-left:10px;padding-right:10px}
      .topbar-title h2{font-size:16px!important}
      .profile-section{padding:16px}
    }

  `;

  return (
    <div>
      <style>{css}</style>
      {checkingSession ? (
        <div className="sapp" data-theme={dark ? "dark" : "light"} style={{ minHeight: 640, alignItems: "center", justifyContent: "center" }}>
          <div style={{ margin: "auto", padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Lade…</div>
        </div>
      ) : !session ? (
        <AuthScreen dark={dark} setDark={setDark} onLogin={handleLogin} />
      ) : (
        <MainApp username={session.username} role={session.role || "user"} dark={dark} setDark={setDark} onLogout={handleLogout} />
      )}
    </div>
  );
}

function AuthScreen({ dark, setDark, onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(true);

  const switchMode = (m) => { setMode(m); setError(""); setPassword(""); setConfirmPassword(""); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) { setError("Bitte Benutzername und Passwort eingeben."); return; }
    setBusy(true);
    try {
      if (mode === "register") {
        if (password !== confirmPassword) throw new Error("Die Passwörter stimmen nicht überein.");
        const { token, username: u, role } = await registerUser(username, password, name, remember);
        onLogin(u, token, remember, role);
      } else {
        const { token, username: u, role } = await loginUser(username, password, remember);
        onLogin(u, token, remember, role);
      }
    } catch (err) {
      setError(err.message || "Etwas ist schiefgelaufen. Bitte versuch es erneut.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sapp" data-theme={dark ? "dark" : "light"} style={{ minHeight: 640, alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ margin: "auto", width: 380, maxWidth: "100%" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <img src={schulioLogo} alt="Schulio" style={{ width: 76, height: 76, objectFit: "contain" }} />
          </div>
          <h2 style={{ textAlign: "center", margin: "0 0 4px", fontSize: 20 }}>
            {mode === "login" ? "Anmelden" : "Konto erstellen"}
          </h2>
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginBottom: 22 }}>
            {mode === "login" ? "Melde dich mit deinem Account an." : "Erstelle einen Account, um deine Daten zu speichern."}
          </div>
          <form onSubmit={submit}>
            {mode === "register" && (
              <div style={{ marginBottom: 10 }}>
                <label className="fl">Anzeigename</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Max" autoComplete="name" />
              </div>
            )}
            <div style={{ marginBottom: 10 }}>
              <label className="fl">Benutzername</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="z. B. max123" autoComplete="username" />
            </div>
            <div style={{ marginBottom: mode === "register" ? 10 : 14 }}>
              <label className="fl">Passwort</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
            </div>
            {mode === "register" && (
              <div style={{ marginBottom: 14 }}>
                <label className="fl">Passwort wiederholen</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
              </div>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, marginBottom: 16, cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                style={{ width: 20, height: 20, padding: 0, flexShrink: 0, accentColor: "var(--primary)" }} />
              Für immer angemeldet bleiben
            </label>
            {error && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 14 }}>{error}</div>}
            <button className="btn" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
              {busy ? "Bitte warten…" : mode === "login" ? <><Lock size={14}/> Anmelden</> : <><UserPlus size={14}/> Registrieren</>}
            </button>
          </form>
          <div style={{ textAlign: "center", fontSize: 12, marginTop: 18, color: "var(--text-muted)" }}>
            {mode === "login" ? (
              <>Noch kein Konto?{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); switchMode("register"); }} style={{ color: "var(--primary)", fontWeight: 600 }}>Registrieren</a>
              </>
            ) : (
              <>Schon ein Konto?{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); switchMode("login"); }} style={{ color: "var(--primary)", fontWeight: 600 }}>Anmelden</a>
              </>
            )}
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button className="navbtn" style={{ width: 40, height: 40 }} onClick={() => setDark((d) => !d)} title={dark ? tr(language,"light") : tr(language,"dark")}>
            {dark ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_SETTINGS = { language: "de", appearance: "dark", compactMode: false, reducedMotion: false, startPage: "dashboard" };

const LANGUAGES = [
  ["de", "Deutsch"], ["en", "English"], ["fr", "Français"], ["es", "Español"],
  ["it", "Italiano"], ["tr", "Türkçe"], ["hr", "Hrvatski"], ["pl", "Polski"],
  ["pt", "Português"], ["nl", "Nederlands"], ["sv", "Svenska"], ["ar", "العربية"]
];

const I18N = {
  de: { overview:"Übersicht", school:"Schule", learning:"Lernen", communication:"Kommunikation", account:"Konto", start:"Start", grades:"Noten", calendar:"Termine", tasks:"Aufgaben", schedule:"Stundenpläne", notes:"Notizen", study:"Lerncenter", mailbox:"MailBox", settings:"Einstellungen", profile:"Profil", admin:"Administration",
    overviewTitle:"Dein Überblick", calendarTitle:"Termine & Kalender", profileTitle:"Mein Profil", logout:"Abmelden", openProfile:"Profil öffnen", light:"Helles Design", dark:"Dunkles Design", openMenu:"Menü öffnen", closeMenu:"Menü schließen",
    generalSettings:"Allgemeine Einstellungen", settingsSaved:"Deine Einstellungen werden automatisch in deinem Schulio-Konto gespeichert.", language:"Sprache", languageHint:"Bevorzugte Sprache für Schulio", appearance:"Darstellung", appearanceHint:"Hell, dunkel oder automatisch", darkMode:"Dunkel", lightMode:"Hell", systemMode:"System", compact:"Kompakte Ansicht", compactHint:"Weniger Abstand für mehr Inhalt", reduced:"Animationen reduzieren", reducedHint:"Für eine ruhigere Bedienung", startPage:"Startseite", startPageHint:"Diese Seite wird nach dem Login geöffnet.", saved:"Gespeichert", savedHint:"Sprache, Darstellung und persönliche Anzeigeoptionen werden zusammen mit deinen Schulio-Daten auf deinem Konto gespeichert.",
    yourMailbox:"Deine MailBox", mailboxHint:"Mitteilungen von Schulio und der Organisation.", noMessages:"Du hast noch keine Nachrichten.", new:"Neu"
  },
  en: { overview:"Overview", school:"School", learning:"Learning", communication:"Communication", account:"Account", start:"Home", grades:"Grades", calendar:"Calendar", tasks:"Tasks", schedule:"Timetables", notes:"Notes", study:"Study Center", mailbox:"Mailbox", settings:"Settings", profile:"Profile", admin:"Administration", overviewTitle:"Your Overview", calendarTitle:"Calendar", profileTitle:"My Profile", logout:"Log out", openProfile:"Open profile", light:"Light design", dark:"Dark design", openMenu:"Open menu", closeMenu:"Close menu", generalSettings:"General settings", settingsSaved:"Your settings are saved automatically to your Schulio account.", language:"Language", languageHint:"Preferred language for Schulio", appearance:"Appearance", appearanceHint:"Light, dark or automatic", darkMode:"Dark", lightMode:"Light", systemMode:"System", compact:"Compact view", compactHint:"Less spacing for more content", reduced:"Reduce animations", reducedHint:"For a calmer interface", startPage:"Start page", startPageHint:"This page opens after login.", saved:"Saved", savedHint:"Language, appearance and personal display options are saved with your Schulio data.", yourMailbox:"Your Mailbox", mailboxHint:"Messages from Schulio and the organisation.", noMessages:"You have no messages yet.", new:"New" },
  fr: { overview:"Aperçu", school:"École", learning:"Apprentissage", communication:"Communication", account:"Compte", start:"Accueil", grades:"Notes", calendar:"Calendrier", tasks:"Tâches", schedule:"Emplois du temps", notes:"Notes", study:"Centre d’apprentissage", mailbox:"Boîte mail", settings:"Paramètres", profile:"Profil", admin:"Administration", overviewTitle:"Votre aperçu", calendarTitle:"Calendrier", profileTitle:"Mon profil", logout:"Se déconnecter", openProfile:"Ouvrir le profil", light:"Mode clair", dark:"Mode sombre", openMenu:"Ouvrir le menu", closeMenu:"Fermer le menu", generalSettings:"Paramètres généraux", settingsSaved:"Vos paramètres sont enregistrés automatiquement.", language:"Langue", languageHint:"Langue préférée pour Schulio", appearance:"Apparence", appearanceHint:"Clair, sombre ou automatique", darkMode:"Sombre", lightMode:"Clair", systemMode:"Système", compact:"Vue compacte", compactHint:"Moins d’espace pour plus de contenu", reduced:"Réduire les animations", reducedHint:"Pour une interface plus calme", startPage:"Page d’accueil", startPageHint:"Cette page s’ouvre après la connexion.", saved:"Enregistré", savedHint:"Vos préférences sont enregistrées avec vos données Schulio.", yourMailbox:"Votre boîte mail", mailboxHint:"Messages de Schulio et de l’organisation.", noMessages:"Vous n’avez pas encore de messages.", new:"Nouveau" },
  es: { overview:"Resumen", school:"Escuela", learning:"Aprendizaje", communication:"Comunicación", account:"Cuenta", start:"Inicio", grades:"Notas", calendar:"Calendario", tasks:"Tareas", schedule:"Horarios", notes:"Notas", study:"Centro de estudio", mailbox:"Buzón", settings:"Ajustes", profile:"Perfil", admin:"Administración", overviewTitle:"Tu resumen", calendarTitle:"Calendario", profileTitle:"Mi perfil", logout:"Cerrar sesión", openProfile:"Abrir perfil", light:"Diseño claro", dark:"Diseño oscuro", openMenu:"Abrir menú", closeMenu:"Cerrar menú", generalSettings:"Ajustes generales", settingsSaved:"Tus ajustes se guardan automáticamente.", language:"Idioma", languageHint:"Idioma preferido para Schulio", appearance:"Apariencia", appearanceHint:"Claro, oscuro o automático", darkMode:"Oscuro", lightMode:"Claro", systemMode:"Sistema", compact:"Vista compacta", compactHint:"Menos espacio para más contenido", reduced:"Reducir animaciones", reducedHint:"Para una interfaz más tranquila", startPage:"Página de inicio", startPageHint:"Esta página se abre después de iniciar sesión.", saved:"Guardado", savedHint:"Tus preferencias se guardan con tus datos de Schulio.", yourMailbox:"Tu buzón", mailboxHint:"Mensajes de Schulio y de la organización.", noMessages:"Aún no tienes mensajes.", new:"Nuevo" },
  it: { overview:"Panoramica", school:"Scuola", learning:"Apprendimento", communication:"Comunicazione", account:"Account", start:"Home", grades:"Voti", calendar:"Calendario", tasks:"Attività", schedule:"Orari", notes:"Note", study:"Centro studio", mailbox:"Posta", settings:"Impostazioni", profile:"Profilo", admin:"Amministrazione", overviewTitle:"La tua panoramica", calendarTitle:"Calendario", profileTitle:"Il mio profilo", logout:"Esci", openProfile:"Apri profilo", light:"Tema chiaro", dark:"Tema scuro", openMenu:"Apri menu", closeMenu:"Chiudi menu", generalSettings:"Impostazioni generali", settingsSaved:"Le tue impostazioni vengono salvate automaticamente.", language:"Lingua", languageHint:"Lingua preferita per Schulio", appearance:"Aspetto", appearanceHint:"Chiaro, scuro o automatico", darkMode:"Scuro", lightMode:"Chiaro", systemMode:"Sistema", compact:"Vista compatta", compactHint:"Meno spazio per più contenuti", reduced:"Riduci animazioni", reducedHint:"Per un’interfaccia più tranquilla", startPage:"Pagina iniziale", startPageHint:"Questa pagina viene aperta dopo l’accesso.", saved:"Salvato", savedHint:"Le preferenze vengono salvate con i tuoi dati Schulio.", yourMailbox:"La tua posta", mailboxHint:"Messaggi da Schulio e dall’organizzazione.", noMessages:"Non hai ancora messaggi.", new:"Nuovo" },
  tr: { overview:"Genel bakış", school:"Okul", learning:"Öğrenme", communication:"İletişim", account:"Hesap", start:"Ana sayfa", grades:"Notlar", calendar:"Takvim", tasks:"Görevler", schedule:"Ders programları", notes:"Notlar", study:"Çalışma merkezi", mailbox:"Posta kutusu", settings:"Ayarlar", profile:"Profil", admin:"Yönetim", overviewTitle:"Genel bakışın", calendarTitle:"Takvim", profileTitle:"Profilim", logout:"Çıkış yap", openProfile:"Profili aç", light:"Açık tema", dark:"Koyu tema", openMenu:"Menüyü aç", closeMenu:"Menüyü kapat", generalSettings:"Genel ayarlar", settingsSaved:"Ayarların Schulio hesabına otomatik kaydedilir.", language:"Dil", languageHint:"Schulio için tercih edilen dil", appearance:"Görünüm", appearanceHint:"Açık, koyu veya otomatik", darkMode:"Koyu", lightMode:"Açık", systemMode:"Sistem", compact:"Kompakt görünüm", compactHint:"Daha fazla içerik için daha az boşluk", reduced:"Animasyonları azalt", reducedHint:"Daha sakin bir arayüz için", startPage:"Başlangıç sayfası", startPageHint:"Girişten sonra bu sayfa açılır.", saved:"Kaydedildi", savedHint:"Dil, görünüm ve kişisel seçenekler Schulio verilerinle kaydedilir.", yourMailbox:"Posta kutun", mailboxHint:"Schulio ve organizasyondan mesajlar.", noMessages:"Henüz mesajın yok.", new:"Yeni" },
  hr: { overview:"Pregled", school:"Škola", learning:"Učenje", communication:"Komunikacija", account:"Račun", start:"Početna", grades:"Ocjene", calendar:"Kalendar", tasks:"Zadaci", schedule:"Rasporedi", notes:"Bilješke", study:"Centar za učenje", mailbox:"Pošta", settings:"Postavke", profile:"Profil", admin:"Administracija", overviewTitle:"Tvoj pregled", calendarTitle:"Kalendar", profileTitle:"Moj profil", logout:"Odjava", openProfile:"Otvori profil", light:"Svijetli dizajn", dark:"Tamni dizajn", openMenu:"Otvori izbornik", closeMenu:"Zatvori izbornik", generalSettings:"Opće postavke", settingsSaved:"Postavke se automatski spremaju.", language:"Jezik", languageHint:"Preferirani jezik za Schulio", appearance:"Izgled", appearanceHint:"Svijetlo, tamno ili automatski", darkMode:"Tamno", lightMode:"Svijetlo", systemMode:"Sustav", compact:"Kompaktni prikaz", compactHint:"Manje razmaka za više sadržaja", reduced:"Smanji animacije", reducedHint:"Za mirnije sučelje", startPage:"Početna stranica", startPageHint:"Ova se stranica otvara nakon prijave.", saved:"Spremljeno", savedHint:"Postavke jezika i prikaza spremaju se uz tvoje Schulio podatke.", yourMailbox:"Tvoja pošta", mailboxHint:"Poruke Schulija i organizacije.", noMessages:"Još nemaš poruka.", new:"Novo" },
  pl: { overview:"Przegląd", school:"Szkoła", learning:"Nauka", communication:"Komunikacja", account:"Konto", start:"Start", grades:"Oceny", calendar:"Kalendarz", tasks:"Zadania", schedule:"Plany lekcji", notes:"Notatki", study:"Centrum nauki", mailbox:"Skrzynka", settings:"Ustawienia", profile:"Profil", admin:"Administracja", overviewTitle:"Twój przegląd", calendarTitle:"Kalendarz", profileTitle:"Mój profil", logout:"Wyloguj", openProfile:"Otwórz profil", light:"Jasny wygląd", dark:"Ciemny wygląd", openMenu:"Otwórz menu", closeMenu:"Zamknij menu", generalSettings:"Ustawienia ogólne", settingsSaved:"Ustawienia są automatycznie zapisywane.", language:"Język", languageHint:"Preferowany język Schulio", appearance:"Wygląd", appearanceHint:"Jasny, ciemny lub automatyczny", darkMode:"Ciemny", lightMode:"Jasny", systemMode:"System", compact:"Widok kompaktowy", compactHint:"Mniej odstępów, więcej treści", reduced:"Ogranicz animacje", reducedHint:"Dla spokojniejszego interfejsu", startPage:"Strona startowa", startPageHint:"Ta strona otwiera się po zalogowaniu.", saved:"Zapisano", savedHint:"Preferencje są zapisywane z danymi Schulio.", yourMailbox:"Twoja skrzynka", mailboxHint:"Wiadomości od Schulio i organizacji.", noMessages:"Nie masz jeszcze wiadomości.", new:"Nowa" },
  pt: { overview:"Visão geral", school:"Escola", learning:"Aprendizagem", communication:"Comunicação", account:"Conta", start:"Início", grades:"Notas", calendar:"Calendário", tasks:"Tarefas", schedule:"Horários", notes:"Notas", study:"Centro de estudo", mailbox:"Caixa de entrada", settings:"Definições", profile:"Perfil", admin:"Administração", overviewTitle:"A tua visão geral", calendarTitle:"Calendário", profileTitle:"O meu perfil", logout:"Terminar sessão", openProfile:"Abrir perfil", light:"Tema claro", dark:"Tema escuro", openMenu:"Abrir menu", closeMenu:"Fechar menu", generalSettings:"Definições gerais", settingsSaved:"As definições são guardadas automaticamente.", language:"Idioma", languageHint:"Idioma preferido para Schulio", appearance:"Aparência", appearanceHint:"Claro, escuro ou automático", darkMode:"Escuro", lightMode:"Claro", systemMode:"Sistema", compact:"Vista compacta", compactHint:"Menos espaço para mais conteúdo", reduced:"Reduzir animações", reducedHint:"Para uma interface mais calma", startPage:"Página inicial", startPageHint:"Esta página abre após o início de sessão.", saved:"Guardado", savedHint:"As preferências são guardadas com os teus dados Schulio.", yourMailbox:"A tua caixa de entrada", mailboxHint:"Mensagens do Schulio e da organização.", noMessages:"Ainda não tens mensagens.", new:"Nova" },
  nl: { overview:"Overzicht", school:"School", learning:"Leren", communication:"Communicatie", account:"Account", start:"Start", grades:"Cijfers", calendar:"Agenda", tasks:"Taken", schedule:"Roosters", notes:"Notities", study:"Leercentrum", mailbox:"Postvak", settings:"Instellingen", profile:"Profiel", admin:"Beheer", overviewTitle:"Jouw overzicht", calendarTitle:"Agenda", profileTitle:"Mijn profiel", logout:"Uitloggen", openProfile:"Profiel openen", light:"Licht thema", dark:"Donker thema", openMenu:"Menu openen", closeMenu:"Menu sluiten", generalSettings:"Algemene instellingen", settingsSaved:"Je instellingen worden automatisch opgeslagen.", language:"Taal", languageHint:"Voorkeurstaal voor Schulio", appearance:"Weergave", appearanceHint:"Licht, donker of automatisch", darkMode:"Donker", lightMode:"Licht", systemMode:"Systeem", compact:"Compacte weergave", compactHint:"Minder ruimte voor meer inhoud", reduced:"Animaties verminderen", reducedHint:"Voor een rustigere interface", startPage:"Startpagina", startPageHint:"Deze pagina opent na het inloggen.", saved:"Opgeslagen", savedHint:"Voorkeuren worden samen met je Schulio-gegevens opgeslagen.", yourMailbox:"Je postvak", mailboxHint:"Berichten van Schulio en de organisatie.", noMessages:"Je hebt nog geen berichten.", new:"Nieuw" },
  sv: { overview:"Översikt", school:"Skola", learning:"Lärande", communication:"Kommunikation", account:"Konto", start:"Start", grades:"Betyg", calendar:"Kalender", tasks:"Uppgifter", schedule:"Scheman", notes:"Anteckningar", study:"Lärcenter", mailbox:"Inkorg", settings:"Inställningar", profile:"Profil", admin:"Administration", overviewTitle:"Din översikt", calendarTitle:"Kalender", profileTitle:"Min profil", logout:"Logga ut", openProfile:"Öppna profil", light:"Ljust tema", dark:"Mörkt tema", openMenu:"Öppna meny", closeMenu:"Stäng meny", generalSettings:"Allmänna inställningar", settingsSaved:"Dina inställningar sparas automatiskt.", language:"Språk", languageHint:"Föredraget språk för Schulio", appearance:"Utseende", appearanceHint:"Ljust, mörkt eller automatiskt", darkMode:"Mörkt", lightMode:"Ljust", systemMode:"System", compact:"Kompakt vy", compactHint:"Mindre mellanrum för mer innehåll", reduced:"Minska animationer", reducedHint:"För ett lugnare gränssnitt", startPage:"Startsida", startPageHint:"Den här sidan öppnas efter inloggning.", saved:"Sparat", savedHint:"Språk och visningsinställningar sparas med dina Schulio-data.", yourMailbox:"Din inkorg", mailboxHint:"Meddelanden från Schulio och organisationen.", noMessages:"Du har inga meddelanden ännu.", new:"Ny" },
  ar: { overview:"نظرة عامة", school:"المدرسة", learning:"التعلم", communication:"التواصل", account:"الحساب", start:"الرئيسية", grades:"الدرجات", calendar:"التقويم", tasks:"المهام", schedule:"الجداول", notes:"الملاحظات", study:"مركز التعلم", mailbox:"البريد", settings:"الإعدادات", profile:"الملف الشخصي", admin:"الإدارة", overviewTitle:"نظرتك العامة", calendarTitle:"التقويم", profileTitle:"ملفي الشخصي", logout:"تسجيل الخروج", openProfile:"فتح الملف الشخصي", light:"الوضع الفاتح", dark:"الوضع الداكن", openMenu:"فتح القائمة", closeMenu:"إغلاق القائمة", generalSettings:"الإعدادات العامة", settingsSaved:"يتم حفظ إعداداتك تلقائياً.", language:"اللغة", languageHint:"اللغة المفضلة في Schulio", appearance:"المظهر", appearanceHint:"فاتح أو داكن أو تلقائي", darkMode:"داكن", lightMode:"فاتح", systemMode:"النظام", compact:"عرض مضغوط", compactHint:"مسافات أقل لمحتوى أكثر", reduced:"تقليل الحركات", reducedHint:"لواجهة أكثر هدوءاً", startPage:"الصفحة الرئيسية", startPageHint:"تفتح هذه الصفحة بعد تسجيل الدخول.", saved:"تم الحفظ", savedHint:"يتم حفظ تفضيلاتك مع بيانات Schulio.", yourMailbox:"بريدك", mailboxHint:"رسائل من Schulio والتنظيم.", noMessages:"لا توجد رسائل بعد.", new:"جديد" }
};
const tr = (lang, key) => (I18N[lang] || I18N.de)[key] || I18N.de[key] || key;

function MainApp({ username, role, dark, setDark, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setDataRaw] = useState(null);
  const [profile, setProfileRaw] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [mailbox, setMailbox] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    (async () => {
      try {
        const [d, p] = await Promise.all([fetchData(), fetchProfile()]);
        if (cancelled) return;
        const migrated = { ...d };
        migrated.settings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };
        if (!Array.isArray(migrated.scheduleBooks) || migrated.scheduleBooks.length === 0) {
          migrated.scheduleBooks = [{ id: "schedule-main", name: "Mein Stundenplan", icon: "📚", color: "#147BEF", schedule: Array.isArray(migrated.schedule) ? migrated.schedule : [] }];
        }
        setDataRaw(migrated);
        setProfileRaw(p);
        const appearance = migrated.settings.appearance;
        if (appearance === "dark") setDark(true);
        else if (appearance === "light") setDark(false);
        else if (appearance === "system") setDark(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
        setTab(migrated.settings.startPage || "dashboard");
        fetchMailbox().then(setMailbox).catch(() => {});
      } catch (err) {
        // Wichtig: NICHT mit leeren Daten weitermachen, sonst würden die
        // echten Daten beim nächsten Speichern überschrieben.
        if (!cancelled && err.status !== 401) {
          setLoadError("Deine Daten konnten nicht geladen werden. Vielleicht wacht der Server gerade erst auf.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [username, reloadKey]);

  useEffect(() => {
    if (loading || !data) return;
    saveData(data).catch(() => {});
  }, [data, loading]);

  useEffect(() => {
    if (loading || !profile) return;
    saveProfile(profile).catch(() => {});
  }, [profile, loading]);

  const subjects = data?.subjects || [];
  const grades = data?.grades || [];
  const events = data?.events || [];
  const tasks = data?.tasks || [];
  const notes = data?.notes || [];
  const scheduleBooks = data?.scheduleBooks || [{ id: "schedule-main", name: "Mein Stundenplan", icon: "📚", color: "#147BEF", schedule: data?.schedule || [] }];
  const [activeScheduleId, setActiveScheduleId] = useState("schedule-main");
  const activeSchedule = scheduleBooks.find((book) => book.id === activeScheduleId) || scheduleBooks[0];
  const schedule = activeSchedule?.schedule || [];
  const flashcards = data?.flashcards || [];

  useEffect(() => {
    if (scheduleBooks.length && !scheduleBooks.some((book) => book.id === activeScheduleId)) setActiveScheduleId(scheduleBooks[0].id);
  }, [scheduleBooks, activeScheduleId]);

  const set = (key) => (fn) => setDataRaw((d) => d ? ({ ...d, [key]: typeof fn === "function" ? fn(d[key] ?? []) : fn }) : d);
  const setSubjects = set("subjects"), setGrades = set("grades"), setEvents = set("events"), setTasks = set("tasks"), setNotes = set("notes"), setFlashcards = set("flashcards");
  const settings = { ...DEFAULT_SETTINGS, ...(data?.settings || {}) };
  const setSettings = (fn) => setDataRaw((d) => d ? ({ ...d, settings: typeof fn === "function" ? fn({ ...DEFAULT_SETTINGS, ...(d.settings || {}) }) : fn }) : d);
  const setScheduleBooks = (fn) => setDataRaw((d) => {
    if (!d) return d;
    const current = d.scheduleBooks || scheduleBooks;
    const next = typeof fn === "function" ? fn(current) : fn;
    return { ...d, scheduleBooks: next, schedule: next[0]?.schedule || [] };
  });
  const setProfile = (fn) => setProfileRaw((p) => (typeof fn === "function" ? fn(p) : fn));

  const subjectById = (id) => subjects.find((s) => s.id === id);

  const subjectAverages = useMemo(() => {
    return subjects.map((s) => {
      const own = grades.filter((g) => g.subjectId === s.id);
      const w = Avg(own.filter((g) => g.kind === "written").map((g) => g.value));
      const o = Avg(own.filter((g) => g.kind === "oral").map((g) => g.value));
      let weighted = null;
      if (w != null && o != null) weighted = (w * s.writtenWeight + o * s.oralWeight) / 100;
      else if (w != null) weighted = w;
      else if (o != null) weighted = o;
      return { subject: s, written: w, oral: o, weighted };
    });
  }, [subjects, grades]);

  const overallAvg = useMemo(() => {
    const vals = subjectAverages.filter((a) => a.weighted != null).map((a) => a.weighted);
    return Avg(vals);
  }, [subjectAverages]);

  const upcomingEvents = useMemo(() => [...events].filter(e => daysUntil(e.date) >= 0).sort((a,b)=>a.date.localeCompare(b.date)), [events]);
  const todayDow = (new Date().getDay() + 6) % 7;
  const todaysLessons = useMemo(() => schedule.filter(s => s.day === todayDow).sort((a,b)=>a.start.localeCompare(b.start)), [schedule, todayDow]);
  const tasksToday = tasks.filter(t => t.due === todayISO() && t.status !== "erledigt");
  const openTasks = tasks.filter(t => t.status !== "erledigt").sort((a,b)=>a.due.localeCompare(b.due));
  const unreadMail = mailbox.filter(m => !m.readAt).length;
  const language = settings.language || "de";

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (loading) return;
    let stopped = false;
    const refreshMailbox = async () => {
      try {
        const latest = await fetchMailbox();
        if (!stopped) {
          setMailbox(prev => {
            const a = JSON.stringify(prev);
            const b = JSON.stringify(latest);
            return a === b ? prev : latest;
          });
        }
      } catch {}
    };
    refreshMailbox();
    const timer = setInterval(refreshMailbox, 1000);
    return () => { stopped = true; clearInterval(timer); };
  }, [loading, username]);

  if (loadError) {
    return (
      <div className="sapp" data-theme={dark ? "dark" : "light"} style={{ minHeight: 640, alignItems: "center", justifyContent: "center" }}>
        <div style={{ margin: "auto", padding: 32, textAlign: "center", maxWidth: 360 }}>
          <div style={{ color: "var(--text-muted)", marginBottom: 16, fontSize: 14 }}>{loadError}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="btn" onClick={() => setReloadKey((k) => k + 1)}>Erneut versuchen</button>
            <button className="btn secondary" onClick={onLogout}>Abmelden</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !data || !profile) {
    return (
      <div className="sapp" data-theme={dark ? "dark" : "light"} style={{ minHeight: 640, alignItems: "center", justifyContent: "center" }}>
        <div style={{ margin: "auto", padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Lade deine Daten…</div>
      </div>
    );
  }

  return (
    <div className={`sapp${settings.compactMode ? " compact-mode" : ""}${settings.reducedMotion ? " reduced-motion" : ""}`} data-theme={dark ? "dark" : "light"}>
      <Sidebar language={language} tab={tab} setTab={setTab} dark={dark} setDark={setDark} mobileNav={mobileNav} setMobileNav={setMobileNav} isAdmin={role === "admin"} unreadMail={unreadMail} />
      <div className="main">
        <Topbar language={language} tab={tab} profile={profile} setTab={setTab} username={username} onLogout={onLogout} />
        <div className="content">
          {tab === "dashboard" && (
            <Dashboard subjects={subjects} overallAvg={overallAvg} subjectAverages={subjectAverages}
              todaysLessons={todaysLessons} upcomingEvents={upcomingEvents} tasksToday={tasksToday} openTasks={openTasks} subjectById={subjectById} profile={profile} setTab={setTab} />
          )}
          {tab === "grades" && (
            <Grades subjects={subjects} setSubjects={setSubjects} grades={grades} setGrades={setGrades} subjectAverages={subjectAverages} overallAvg={overallAvg} />
          )}
          {tab === "calendar" && (
            <CalendarView events={events} setEvents={setEvents} subjects={subjects} subjectById={subjectById} />
          )}
          {tab === "tasks" && (
            <Tasks tasks={tasks} setTasks={setTasks} subjects={subjects} subjectById={subjectById} />
          )}
          {tab === "notes" && (
            <Notes notes={notes} setNotes={setNotes} subjects={subjects} subjectById={subjectById} />
          )}
          {tab === "schedule" && (
            <Schedule scheduleBooks={scheduleBooks} setScheduleBooks={setScheduleBooks} activeScheduleId={activeSchedule?.id} setActiveScheduleId={setActiveScheduleId} subjects={subjects} subjectById={subjectById} />
          )}
          {tab === "study" && (
            <StudyHub flashcards={flashcards} setFlashcards={setFlashcards} subjects={subjects} subjectById={subjectById} />
          )}
          {tab === "mailbox" && (
            <Mailbox language={language} messages={mailbox} setMessages={setMailbox} />
          )}
          {tab === "settings" && (
            <SettingsPage language={language} settings={settings} setSettings={setSettings} dark={dark} setDark={setDark} />
          )}
          {tab === "admin" && role === "admin" && (
            <AdminPanel />
          )}
          {tab === "profile" && (
            <Profile profile={profile} setProfile={setProfile} username={username} onLogout={onLogout} />
          )}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ language, tab, setTab, dark, setDark, mobileNav, setMobileNav, isAdmin, unreadMail }) {
  const groups = [
    { title: tr(language,"overview"), items: [{ id: "dashboard", icon: LayoutGrid, label: tr(language,"start") }] },
    { title: tr(language,"school"), items: [
      { id: "grades", icon: GraduationCap, label: tr(language,"grades") },
      { id: "calendar", icon: CalendarDays, label: tr(language,"calendar") },
      { id: "tasks", icon: ListChecks, label: tr(language,"tasks") },
      { id: "schedule", icon: Clock, label: tr(language,"schedule") },
    ] },
    { title: tr(language,"learning"), items: [
      { id: "notes", icon: StickyNote, label: tr(language,"notes") },
      { id: "study", icon: Timer, label: tr(language,"study") },
    ] },
    { title: tr(language,"communication"), items: [
      { id: "mailbox", icon: Mail, label: tr(language,"mailbox"), badge: unreadMail },
    ] },
    { title: tr(language,"account"), items: [
      { id: "settings", icon: SettingsIcon, label: tr(language,"settings") },
      { id: "profile", icon: UserCircle, label: tr(language,"profile") },
      ...(isAdmin ? [{ id: "admin", icon: ShieldCheck, label: tr(language,"admin") }] : []),
    ] },
  ];
  const navigate = (id) => { setTab(id); setMobileNav(false); };

  useEffect(() => {
    if (!mobileNav) return;
    const onKey = (e) => { if (e.key === "Escape") setMobileNav(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [mobileNav, setMobileNav]);

  return (
    <>
      {!mobileNav && <button className="mobile-menu-btn" onClick={() => setMobileNav(true)} aria-label={tr(language,"openMenu")}><Menu size={20}/></button>}
      {mobileNav && <div className="mobile-backdrop" onClick={() => setMobileNav(false)} />}
      <aside className={"sidebar " + (mobileNav ? "mobile-open" : "")}>
        <div className="sidebar-head">
          <img className="logo" src={schulioLogo} alt="Schulio Logo" />
          <span className="sidebar-title">Schulio</span>
          <button className="sidebar-close" onClick={() => setMobileNav(false)} aria-label={tr(language,"closeMenu")}><X size={20}/></button>
        </div>
        <nav className="sidebar-nav">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="navgroup-title">{group.title}</div>
              {group.items.map((it) => (
                <button key={it.id} className={"navitem" + (tab === it.id ? " active" : "")} onClick={() => navigate(it.id)} title={it.label}>
                  <it.icon size={19}/><span className="navlabel">{it.label}</span>{it.badge > 0 && <span className="navbadge">{it.badge > 9 ? "9+" : it.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button className="navitem" onClick={() => setDark((d) => !d)} title={dark ? tr(language,"light") : tr(language,"dark")}>{dark ? <Sun size={19}/> : <Moon size={19}/>}<span className="navlabel">{dark ? tr(language,"light") : tr(language,"dark")}</span></button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ language, tab, profile, setTab, username, onLogout }) {
  const titles = { dashboard:tr(language,"overviewTitle"), grades:tr(language,"grades"), calendar:tr(language,"calendarTitle"), tasks:tr(language,"tasks"), notes:tr(language,"notes"), study:tr(language,"study"), schedule:tr(language,"schedule"), mailbox:tr(language,"mailbox"), settings:tr(language,"settings"), admin:tr(language,"admin"), profile:tr(language,"profileTitle") };
  const now = new Date();
  const weekday = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"][now.getDay()];
  const initials = (profile.name || "S").trim().slice(0,1).toUpperCase();
  return (
    <div className="topbar">
      <div className="topbar-title">
        <h2 style={{margin:0,fontSize:20}}>{titles[tab]}</h2>
        <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{weekday}, {now.getDate()}. {MONTHS[now.getMonth()]} {now.getFullYear()}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button className="profile-mini" onClick={() => setTab("profile")} title={tr(language,"openProfile")}>
          {profile.avatar ? <img src={profile.avatar} alt="Profilbild"/> : <span>{initials}</span>}
          <span className="profile-mini-name">{profile.name || username}</span>
        </button>
        <button className="iconbtn" onClick={onLogout} title={tr(language,"logout")}><LogOut size={18}/></button>
      </div>
    </div>
  );
}

function GradeBadge({ value, color }) {
  return <span className="pill" style={{ background: color + "22", color }}>{value != null ? value.toFixed(2) : "–"}</span>;
}

function Dashboard({ subjects, overallAvg, subjectAverages, todaysLessons, upcomingEvents, tasksToday, openTasks, subjectById, profile, setTab }) {
  const nextLesson = todaysLessons[0];
  const dueSoon = [...openTasks].filter(t => daysUntil(t.due) >= 0).slice(0, 4);
  const completion = tasksToday.length === 0 ? 100 : 0;
  const firstName = (profile?.name || "Schüler").split(" ")[0];

  return (
    <div>
      <div className="card hero-card" style={{marginBottom:16,padding:24}}>
        <div style={{position:"relative",zIndex:1,maxWidth:650}}>
          <div style={{fontSize:12,opacity:.82,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em"}}>Dein Lernbereich</div>
          <h1 className="disp" style={{fontSize:30,margin:"6px 0 4px"}}>Hi {firstName} 👋</h1>
          <div style={{opacity:.9,fontSize:14,lineHeight:1.5}}>Alles Wichtige für Schule, Hausaufgaben und Prüfungsvorbereitung an einem Ort.</div>
          <div className="hero-actions">
            <button className="btn hero-btn" onClick={()=>setTab("study")}><Timer size={15}/> Lernsession starten</button>
            <button className="btn hero-btn" onClick={()=>setTab("tasks")}><CheckSquare2 size={15}/> Aufgaben ansehen</button>
            <button className="btn hero-btn" onClick={()=>setTab("calendar")}><CalendarDays size={15}/> Termine</button>
          </div>
        </div>
      </div>

      <div className="grid3" style={{marginBottom:16}}>
        <div className="card stat-card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:11,color:"var(--text-muted)",fontWeight:700}}>NOTENDURCHSCHNITT</div><div className="disp" style={{fontSize:30,fontWeight:700,marginTop:3}}>{overallAvg != null ? overallAvg.toFixed(2) : "–"}</div></div><div className="stat-icon"><GraduationCap size={18}/></div></div>
        </div>
        <div className="card stat-card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:11,color:"var(--text-muted)",fontWeight:700}}>OFFENE AUFGABEN</div><div className="disp" style={{fontSize:30,fontWeight:700,marginTop:3}}>{openTasks.length}</div></div><div className="stat-icon"><CheckSquare2 size={18}/></div></div>
          <div style={{fontSize:11,color:"var(--text-muted)",marginTop:8}}>{tasksToday.length ? `${tasksToday.length} heute fällig` : "Heute nichts offen 🎉"}</div>
        </div>
        <div className="card stat-card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:11,color:"var(--text-muted)",fontWeight:700}}>FÄCHER</div><div className="disp" style={{fontSize:30,fontWeight:700,marginTop:3}}>{subjects.length}</div></div><div className="stat-icon"><BookOpen size={18}/></div></div>
          <div style={{fontSize:11,color:"var(--text-muted)",marginTop:8}}>{subjects.length ? "Deine Fächer sind eingerichtet." : "Füge dein erstes Fach hinzu."}</div>
        </div>
      </div>

      <div className="focus-grid">
        <div className="card">
          <div className="section-head"><h3>Als Nächstes</h3><button className="btn secondary" onClick={()=>setTab("schedule")}>Stundenplan <ArrowRight size={13}/></button></div>
          {nextLesson ? (
            <div style={{padding:16,borderRadius:14,background:"var(--surface-alt)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{width:12,height:42,borderRadius:8,background:subjectById(nextLesson.subjectId)?.color||"var(--primary)"}}/><div><div style={{fontWeight:700,fontSize:16}}>{subjectById(nextLesson.subjectId)?.name || "Unterricht"}</div><div style={{fontSize:12,color:"var(--text-muted)",marginTop:3}}>{nextLesson.start}–{nextLesson.end} · Raum {nextLesson.room || "–"} · {nextLesson.teacher || "–"}</div></div></div>
              <span className="pill" style={{background:"var(--primary-soft)",color:"var(--primary)"}}>Heute</span>
            </div>
          ) : <div className="empty-state">Heute keine Stunden eingetragen.</div>}

          <div className="section-head" style={{marginTop:18}}><h3>Heutige Aufgaben</h3><button className="iconbtn" onClick={()=>setTab("tasks")}><ArrowRight size={16}/></button></div>
          {tasksToday.length ? tasksToday.slice(0,4).map(t=><div className="rowline" key={t.id}><div style={{display:"flex",alignItems:"center",gap:9}}><Circle size={15} color="var(--text-muted)"/><span style={{fontSize:13}}>{t.title}</span></div>{subjectById(t.subjectId)&&<span className="pill" style={{background:subjectById(t.subjectId).color+"22",color:subjectById(t.subjectId).color}}>{subjectById(t.subjectId).name}</span>}</div>) : <div className="empty-state">Alles für heute erledigt 🎉</div>}
        </div>

        <div className="card">
          <div className="section-head"><h3>Demnächst fällig</h3><button className="btn secondary" onClick={()=>setTab("calendar")}>Kalender <ArrowRight size={13}/></button></div>
          {dueSoon.length ? dueSoon.map(t=><div className="rowline" key={t.id}>
            <div style={{minWidth:0}}><div style={{fontWeight:600,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</div><div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{subjectById(t.subjectId)?.name || "Allgemein"} · {fmtDate(t.due)}</div></div>
            <span className="pill" style={{background:daysUntil(t.due)<=1?"var(--warning)22":"var(--surface-alt)",color:daysUntil(t.due)<=1?"var(--warning)":"var(--text-muted)"}}>{daysUntil(t.due)===0?"Heute":daysUntil(t.due)===1?"Morgen":`in ${daysUntil(t.due)} Tg.`}</span>
          </div>) : <div className="empty-state">Keine offenen Aufgaben mit Termin.</div>}

          <div style={{marginTop:18,padding:14,borderRadius:14,background:"var(--primary-soft)",display:"flex",gap:11,alignItems:"flex-start"}}>
            <div className="stat-icon" style={{flexShrink:0}}><Sparkles size={17}/></div>
            <div><div style={{fontWeight:700,fontSize:13}}>Lerntipp</div><div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.5,marginTop:3}}>25 Minuten konzentriert lernen, dann 5 Minuten Pause. Im Lerncenter kannst du direkt loslegen.</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudyHub({ flashcards, setFlashcards, subjects, subjectById }) {
  const [seconds, setSeconds] = useState(25*60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("focus");
  const [flipped, setFlipped] = useState(false);
  const [index, setIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({question:"",answer:"",subjectId:""});
  const modes = { focus:25*60, short:5*60, long:15*60 };
  const cards = flashcards || [];
  const current = cards[index % Math.max(cards.length,1)];

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(v => {
      if (v <= 1) { setRunning(false); return 0; }
      return v - 1;
    }),1000);
    return () => clearInterval(id);
  }, [running]);

  const setTimer = (m) => { setMode(m); setSeconds(modes[m]); setRunning(false); };
  const mm = String(Math.floor(seconds/60)).padStart(2,"0"), ss=String(seconds%60).padStart(2,"0");
  const progress = `${Math.max(0,Math.min(100,100-(seconds/modes[mode])*100))}%`;
  const addCard = () => { if(!form.question.trim() || !form.answer.trim()) return; setFlashcards(c=>[...(c||[]),{...form,id:uid()}]); setForm({question:"",answer:"",subjectId:""}); setShowForm(false); };
  const nextCard = () => { setFlipped(false); setIndex(i => cards.length ? (i+1)%cards.length : 0); };

  return (
    <div>
      <div className="grid3" style={{marginBottom:16}}>
        {[["focus","Fokus","25 Min."],["short","Kurze Pause","5 Min."],["long","Lange Pause","15 Min."]].map(([id,label,time])=>
          <button key={id} className={"card stat-card"} onClick={()=>setTimer(id)} style={{textAlign:"left",cursor:"pointer",border:mode===id?"2px solid var(--primary)":"1px solid var(--border)"}}>
            <div style={{fontWeight:700,fontSize:13}}>{label}</div><div style={{fontSize:11,color:"var(--text-muted)",marginTop:3}}>{time}</div>
          </button>
        )}
      </div>
      <div className="focus-grid">
        <div className="card" style={{textAlign:"center"}}>
          <div className="section-head"><h3><Timer size={16} style={{verticalAlign:"-3px"}}/> Fokus-Timer</h3><span className="pill" style={{background:running?"var(--success)22":"var(--surface-alt)",color:running?"var(--success)":"var(--text-muted)"}}>{running?"Läuft":"Bereit"}</span></div>
          <div className="timer-ring" style={{"--progress":progress}}><div className="timer-inner"><div className="disp" style={{fontSize:36,fontWeight:700}}>{mm}:{ss}</div><div style={{fontSize:11,color:"var(--text-muted)"}}>konzentriert bleiben</div></div></div>
          <div style={{display:"flex",justifyContent:"center",gap:8}}><button className="btn" onClick={()=>setRunning(v=>!v)}>{running?"Pause":"Start"} <Zap size={14}/></button><button className="btn secondary" onClick={()=>setTimer(mode)}><RotateCcw size={14}/> Reset</button></div>
          <div style={{fontSize:11,color:"var(--text-muted)",marginTop:12}}>Tipp: Handy weglegen und nur eine Aufgabe bearbeiten.</div>
        </div>

        <div className="card">
          <div className="section-head"><h3><Brain size={16} style={{verticalAlign:"-3px"}}/> Lernkarten</h3><button className="btn" onClick={()=>setShowForm(true)}><Plus size={14}/> Karte</button></div>
          {cards.length ? <>
            <div className="flashcard" onClick={()=>setFlipped(v=>!v)}>
              <div>
                <div style={{fontSize:10,color:"var(--text-muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>{flipped?"Antwort":"Frage"}</div>
                <div style={{fontSize:18,fontWeight:700,lineHeight:1.45}}>{flipped?current.answer:current.question}</div>
                {current.subjectId && subjectById(current.subjectId) && <span className="pill" style={{marginTop:12,background:subjectById(current.subjectId).color+"22",color:subjectById(current.subjectId).color}}>{subjectById(current.subjectId).name}</span>}
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
              <span style={{fontSize:11,color:"var(--text-muted)"}}>{index+1} / {cards.length} · <span className="kbd">Klick</span> zum Umdrehen</span>
              <div style={{display:"flex",gap:5}}><button className="iconbtn" onClick={nextCard}><ArrowRight size={17}/></button><button className="iconbtn" onClick={()=>setFlashcards(c=>c.filter(x=>x.id!==current.id))}><Trash2 size={14}/></button></div>
            </div>
          </> : <div className="empty-state"><Brain size={22}/><div style={{marginTop:7}}>Noch keine Lernkarten.</div></div>}
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <div className="section-head"><h3><Target size={16} style={{verticalAlign:"-3px"}}/> Lernroutine</h3><span className="pill" style={{background:"var(--success)22",color:"var(--success)"}}><Flame size={11}/> Fokus</span></div>
        <div className="grid3">
          <div style={{padding:14,borderRadius:12,background:"var(--surface-alt)"}}><div style={{fontSize:11,color:"var(--text-muted)"}}>Heute</div><b style={{fontSize:20}}>1</b><div style={{fontSize:11,color:"var(--text-muted)"}}>Session geplant</div></div>
          <div style={{padding:14,borderRadius:12,background:"var(--surface-alt)"}}><div style={{fontSize:11,color:"var(--text-muted)"}}>Ziel</div><b style={{fontSize:20}}>25 Min.</b><div style={{fontSize:11,color:"var(--text-muted)"}}>konzentriertes Lernen</div></div>
          <div style={{padding:14,borderRadius:12,background:"var(--surface-alt)"}}><div style={{fontSize:11,color:"var(--text-muted)"}}>Fortschritt</div><b style={{fontSize:20}}>0%</b><div style={{fontSize:11,color:"var(--text-muted)"}}>dieses Tagesziels</div></div>
        </div>
      </div>

      {showForm && <Modal onClose={()=>setShowForm(false)} title="Neue Lernkarte">
        <label className="fl">Frage</label><textarea rows={3} value={form.question} onChange={e=>setForm({...form,question:e.target.value})} placeholder="z. B. Was ist die pq-Formel?"/>
        <div style={{height:10}}/><label className="fl">Antwort</label><textarea rows={4} value={form.answer} onChange={e=>setForm({...form,answer:e.target.value})} placeholder="Kurze, klare Antwort"/>
        <div style={{height:10}}/><label className="fl">Fach</label><select value={form.subjectId} onChange={e=>setForm({...form,subjectId:e.target.value})}><option value="">Allgemein</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}><button className="btn" onClick={addCard}>Speichern</button></div>
      </Modal>}
    </div>
  );
}

function Grades({ subjects, setSubjects, grades, setGrades, subjectAverages, overallAvg }) {
  const [newSubject, setNewSubject] = useState(false);
  const [form, setForm] = useState({ name: "", writtenWeight: 50, oralWeight: 50 });
  const [gradeForm, setGradeForm] = useState({}); // subjectId -> form state
  const [activeChart, setActiveChart] = useState(subjects[0]?.id || null);
  const [draggedSubject, setDraggedSubject] = useState(null);
  const [dragOverSubject, setDragOverSubject] = useState(null);

  const moveSubject = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    setSubjects(list => {
      const next = [...list];
      const from = next.findIndex(x => x.id === fromId);
      const to = next.findIndex(x => x.id === toId);
      if (from < 0 || to < 0) return list;
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const addSubject = () => {
    if (!form.name.trim()) return;
    const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
    setSubjects((s) => [...s, { id: uid(), name: form.name, color, writtenWeight: Number(form.writtenWeight), oralWeight: Number(form.oralWeight) }]);
    setForm({ name: "", writtenWeight: 50, oralWeight: 50 });
    setNewSubject(false);
  };
  const removeSubject = (id) => { setSubjects((s) => s.filter((x) => x.id !== id)); setGrades((g) => g.filter((x) => x.subjectId !== id)); };
  const updateWeight = (id, key, val) => setSubjects((s) => s.map((x) => x.id === id ? { ...x, [key]: Number(val) } : x));

  const addGrade = (subjectId) => {
    const f = gradeForm[subjectId];
    if (!f || !f.value) return;
    setGrades((g) => [...g, { id: uid(), subjectId, kind: f.kind || "written", type: f.type || GRADE_TYPES.written[0], value: Number(f.value), date: f.date || todayISO() }]);
    setGradeForm((prev) => ({ ...prev, [subjectId]: { ...f, value: "" } }));
  };
  const removeGrade = (id) => setGrades((g) => g.filter((x) => x.id !== id));

  const chartData = useMemo(() => {
    if (!activeChart) return [];
    return grades.filter((g) => g.subjectId === activeChart).sort((a,b)=>a.date.localeCompare(b.date)).map((g, i) => ({ name: `#${i+1}`, wert: g.value }));
  }, [grades, activeChart]);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Gesamtdurchschnitt</div>
          <div className="disp" style={{ fontSize: 30, fontWeight: 700 }}>{overallAvg != null ? overallAvg.toFixed(2) : "–"}</div>
        </div>
        <button className="btn" onClick={() => setNewSubject(true)}><Plus size={14}/> Fach hinzufügen</button>
      </div>

      {newSubject && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="grid3">
            <div><label className="fl">Fachname</label><input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="z. B. Chemie" /></div>
            <div><label className="fl">Gewichtung schriftlich (%)</label><input type="number" value={form.writtenWeight} onChange={(e)=>setForm({...form,writtenWeight:e.target.value, oralWeight: 100-Number(e.target.value)})} /></div>
            <div><label className="fl">Gewichtung mündlich (%)</label><input type="number" value={form.oralWeight} onChange={(e)=>setForm({...form,oralWeight:e.target.value, writtenWeight: 100-Number(e.target.value)})} /></div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="btn" onClick={addSubject}>Speichern</button>
            <button className="btn secondary" onClick={() => setNewSubject(false)}>Abbrechen</button>
          </div>
        </div>
      )}

      {subjects.map((s) => {
        const avg = subjectAverages.find((a) => a.subject.id === s.id);
        const own = grades.filter((g) => g.subjectId === s.id);
        const f = gradeForm[s.id] || { kind: "written", type: GRADE_TYPES.written[0], value: "", date: todayISO() };
        return (
          <div
            className={"card subject-card" + (draggedSubject === s.id ? " dragging" : "") + (dragOverSubject === s.id ? " drag-over" : "")}
            key={s.id}
            draggable
            onDragStart={(e) => { setDraggedSubject(s.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", s.id); }}
            onDragOver={(e) => { e.preventDefault(); if (draggedSubject !== s.id) setDragOverSubject(s.id); }}
            onDragLeave={() => setDragOverSubject(null)}
            onDrop={(e) => { e.preventDefault(); moveSubject(draggedSubject, s.id); setDraggedSubject(null); setDragOverSubject(null); }}
            onDragEnd={() => { setDraggedSubject(null); setDragOverSubject(null); }}
            style={{ marginBottom: 14 }}
          >
            <div className="subject-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span className="drag-handle" title="Fach verschieben"><GripVertical size={18}/></span>
                <span style={{ width: 10, height: 10, borderRadius: 99, background: s.color, flexShrink:0 }} />
                <b style={{ fontSize: 15, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</b>
                <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace:"nowrap" }}>Schriftlich {s.writtenWeight}% · Mündlich {s.oralWeight}%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <GradeBadge value={avg?.weighted} color={s.color} />
                <button className="iconbtn" title="Nach oben" onClick={() => {
                  const i = subjects.findIndex(x => x.id === s.id);
                  if (i > 0) moveSubject(s.id, subjects[i - 1].id);
                }}>↑</button>
                <button className="iconbtn" title="Nach unten" onClick={() => {
                  const i = subjects.findIndex(x => x.id === s.id);
                  if (i < subjects.length - 1) moveSubject(s.id, subjects[i + 1].id);
                }}>↓</button>
                <button className="iconbtn" onClick={() => removeSubject(s.id)} title="Fach löschen"><Trash2 size={15} /></button>
              </div>
            </div>

            <div className="grid3" style={{ marginTop: 12 }}>
              <div className="card" style={{ background: "var(--surface-alt)", border: "none" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Schriftlich Ø</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{avg?.written != null ? avg.written.toFixed(2) : "–"}</div>
              </div>
              <div className="card" style={{ background: "var(--surface-alt)", border: "none" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Mündlich Ø</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{avg?.oral != null ? avg.oral.toFixed(2) : "–"}</div>
              </div>
              <div className="card" style={{ background: "var(--surface-alt)", border: "none" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Gewichtet</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: s.color }}>{avg?.weighted != null ? avg.weighted.toFixed(2) : "–"}</div>
              </div>
            </div>

            <div className="grade-entry" style={{ marginTop: 14, display: "grid", gridTemplateColumns: "90px 1fr 90px 120px auto", gap: 8, alignItems: "end" }}>
              <div><label className="fl">Art</label>
                <select value={f.kind} onChange={(e)=>setGradeForm({...gradeForm,[s.id]:{...f,kind:e.target.value,type:GRADE_TYPES[e.target.value][0]}})}>
                  <option value="written">Schriftlich</option><option value="oral">Mündlich</option>
                </select>
              </div>
              <div><label className="fl">Notenart</label>
                <select value={f.type} onChange={(e)=>setGradeForm({...gradeForm,[s.id]:{...f,type:e.target.value}})}>
                  {GRADE_TYPES[f.kind].map((t)=> <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="fl">Note</label><input type="number" step="0.1" value={f.value} onChange={(e)=>setGradeForm({...gradeForm,[s.id]:{...f,value:e.target.value}})} placeholder="2.3" /></div>
              <div><label className="fl">Datum</label><input type="date" value={f.date} onChange={(e)=>setGradeForm({...gradeForm,[s.id]:{...f,date:e.target.value}})} /></div>
              <button className="btn" onClick={() => addGrade(s.id)}><Plus size={14}/></button>
            </div>

            {own.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {own.sort((a,b)=>b.date.localeCompare(a.date)).map((g) => (
                  <div className="rowline" key={g.id}>
                    <div style={{ fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>{g.type}</span>
                      <span style={{ color: "var(--text-muted)" }}> · {fmtShort(g.date)} · {g.kind === "written" ? "schriftlich" : "mündlich"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <GradeBadge value={g.value} color={s.color} />
                      <button className="iconbtn" onClick={() => removeGrade(g.id)}><X size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {own.length > 1 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Notenverlauf</div>
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={own.sort((a,b)=>a.date.localeCompare(b.date)).map((g,i)=>({name:`#${i+1}`,wert:g.value}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis reversed domain={[1,6]} tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={20} />
                    <Tooltip contentStyle={{ fontSize: 12, background: "var(--surface)", border: "1px solid var(--border)" }} />
                    <Line type="monotone" dataKey="wert" stroke={s.color} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


function Profile({ profile, setProfile, username, onLogout }) {
  const [name, setName] = useState(profile.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const initials = (name || "S").trim().slice(0,1).toUpperCase();

  const chooseAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMessage("Bitte wähle eine Bilddatei aus.");
    if (file.size > 2 * 1024 * 1024) return setMessage("Das Bild darf maximal 2 MB groß sein.");
    const reader = new FileReader();
    reader.onload = () => {
      setProfile(p => ({...p, avatar:String(reader.result)}));
      setMessage("Profilbild aktualisiert.");
    };
    reader.readAsDataURL(file);
  };

  const saveName = () => {
    const clean = name.trim();
    if (!clean) return setMessage("Der Name darf nicht leer sein.");
    setProfile(p => ({...p, name:clean}));
    setMessage("Name gespeichert.");
  };

  const changePassword = async () => {
    setError(""); setMessage("");
    if (!currentPassword) return setError("Bitte gib dein aktuelles Passwort ein.");
    if (newPassword.length < 6) return setError("Das neue Passwort muss mindestens 6 Zeichen haben.");
    if (newPassword !== confirmPassword) return setError("Die neuen Passwörter stimmen nicht überein.");
    setBusy(true);
    try {
      await apiChangePassword(currentPassword, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setMessage("Passwort wurde in deinem Konto gespeichert.");
    } catch (err) {
      setError(err.message || "Passwort konnte nicht geändert werden.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="profile-section" style={{marginBottom:16}}>
        <div className="profile-grid">
          <div style={{textAlign:"center"}}>
            <div className="profile-avatar">
              {profile.avatar ? <img src={profile.avatar} alt="Profilbild"/> : initials}
            </div>
            <label className="btn" style={{marginTop:12,cursor:"pointer"}}>
              <Camera size={14}/> Bild auswählen
              <input type="file" accept="image/*" onChange={chooseAvatar} style={{display:"none"}}/>
            </label>
            {profile.avatar && <button className="btn secondary" style={{marginTop:8}} onClick={() => {
              setProfile(p => ({...p,avatar:""})); setMessage("Profilbild entfernt.");
            }}>Entfernen</button>}
          </div>
          <div>
            <h3 style={{margin:"0 0 4px"}}>Profil bearbeiten</h3>
            <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:18}}>Passe deinen Namen und dein Profilbild an.</div>
            <label className="fl">Name</label>
            <div style={{display:"flex",gap:8}}>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Dein Name"/>
              <button className="btn" onClick={saveName}><Save size={14}/> Speichern</button>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-section" style={{marginBottom:16}}>
        <h3 style={{margin:"0 0 4px",display:"flex",alignItems:"center",gap:7}}><UserCircle size={17}/> Konto</h3>
        <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:14}}>Angemeldet als <b>@{username}</b></div>
        <button className="btn secondary" onClick={onLogout}><LogOut size={14}/> Abmelden</button>
      </div>

      <div className="profile-section">
        <h3 style={{margin:"0 0 4px",display:"flex",alignItems:"center",gap:7}}><KeyRound size={17}/> Passwort ändern</h3>
        <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:18}}>Das Passwort wird sicher (gehasht) in deinem Konto gespeichert.</div>
        <div className="grid2">
          <div style={{gridColumn:"1 / -1"}}>
            <label className="fl">Aktuelles Passwort</label>
            <input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} autoComplete="current-password"/>
          </div>
          <div>
            <label className="fl">Neues Passwort</label>
            <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} autoComplete="new-password"/>
          </div>
          <div>
            <label className="fl">Passwort wiederholen</label>
            <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password"/>
          </div>
        </div>
        {error && <div style={{color:"var(--danger)",fontSize:12,marginTop:10}}>{error}</div>}
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
          <button className="btn" onClick={changePassword} disabled={busy}><KeyRound size={14}/> {busy ? "Speichere…" : "Passwort speichern"}</button>
        </div>
      </div>

      {message && <div className="pill" style={{marginTop:12,padding:"9px 12px",background:"var(--primary-soft)",color:"var(--primary)"}}>{message}</div>}
      <div style={{marginTop:16,fontSize:11,color:"var(--text-muted)"}}>
        Hinweis: Name, Profilbild, Noten, Termine, Aufgaben, Notizen und Stundenplan werden pro Konto in einer zentralen Datenbank gespeichert und sind beim nächsten Login auf jedem Gerät wieder verfügbar.
      </div>
    </div>
  );
}


function Mailbox({ language, messages, setMessages }) {
  const [selected, setSelected] = useState(null);
  const open = async (msg) => {
    setSelected(msg);
    if (!msg.readAt) {
      setMessages((list) => list.map((m) => m.id === msg.id ? { ...m, readAt: new Date().toISOString() } : m));
      try { await markMailboxRead(msg.id); } catch {}
    }
  };
  return <div>
    <div className="card" style={{marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
      <div className="stat-icon"><Mail size={18}/></div>
      <div><h3 style={{margin:0}}>{tr(language,"yourMailbox")}</h3><div style={{fontSize:12,color:"var(--text-muted)",marginTop:3}}>{tr(language,"mailboxHint")}</div></div>
    </div>
    {messages.length === 0 ? <div className="empty-state">{tr(language,"noMessages")}</div> : <div style={{display:"grid",gap:8}}>
      {messages.map((m) => <button key={m.id} onClick={() => open(m)} className="card" style={{textAlign:"left",border:"1px solid var(--border)",cursor:"pointer",display:"grid",gridTemplateColumns:"40px 1fr auto",gap:12,alignItems:"center"}}>
        <div className="stat-icon"><Mail size={16}/></div>
        <div style={{minWidth:0}}><div style={{fontWeight:m.readAt?600:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.subject}</div><div style={{fontSize:11,color:"var(--text-muted)",marginTop:3}}>{m.sender} · {new Date(m.createdAt).toLocaleDateString("de-DE")}</div></div>
        {!m.readAt && <span className="pill" style={{background:"var(--primary-soft)",color:"var(--primary)"}}>{tr(language,"new")}</span>}
      </button>)}
    </div>}
    {selected && <Modal onClose={() => setSelected(null)} title={selected.subject}><div style={{fontSize:12,color:"var(--text-muted)",marginBottom:14}}>Von {selected.sender} · {new Date(selected.createdAt).toLocaleString("de-DE")}</div><div style={{whiteSpace:"pre-wrap",lineHeight:1.65,fontSize:14}}>{selected.body}</div></Modal>}
  </div>;
}

function SettingsPage({ language, settings, setSettings, dark, setDark }) {
  const update = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
    if (key === "appearance") {
      if (value === "dark") setDark(true);
      else if (value === "light") setDark(false);
      else setDark(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  };
  return <div>
    <div className="profile-section" style={{marginBottom:16}}>
      <h3 style={{margin:"0 0 4px",display:"flex",alignItems:"center",gap:8}}><SettingsIcon size={18}/> {tr(language,"generalSettings")}</h3>
      <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:18}}>{tr(language,"settingsSaved")}</div>
      <div className="rowline"><div style={{display:"flex",gap:10,alignItems:"center"}}><Languages size={18}/><div><b>{tr(language,"language")}</b><div style={{fontSize:11,color:"var(--text-muted)"}}>{tr(language,"languageHint")}</div></div></div><select value={settings.language} onChange={e=>update("language",e.target.value)} style={{width:170}}>{LANGUAGES.map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></div>
      <div className="rowline"><div style={{display:"flex",gap:10,alignItems:"center"}}><Palette size={18}/><div><b>{tr(language,"appearance")}</b><div style={{fontSize:11,color:"var(--text-muted)"}}>{tr(language,"appearanceHint")}</div></div></div><select value={settings.appearance} onChange={e=>update("appearance",e.target.value)} style={{width:150}}><option value="dark">{tr(language,"darkMode")}</option><option value="light">{tr(language,"lightMode")}</option><option value="system">{tr(language,"systemMode")}</option></select></div>
      <div className="rowline"><div style={{display:"flex",gap:10,alignItems:"center"}}><Monitor size={18}/><div><b>{tr(language,"compact")}</b><div style={{fontSize:11,color:"var(--text-muted)"}}>{tr(language,"compactHint")}</div></div></div><input type="checkbox" checked={settings.compactMode} onChange={e=>update("compactMode",e.target.checked)} style={{width:20,accentColor:"var(--primary)"}}/></div>
      <div className="rowline"><div style={{display:"flex",gap:10,alignItems:"center"}}><Zap size={18}/><div><b>{tr(language,"reduced")}</b><div style={{fontSize:11,color:"var(--text-muted)"}}>{tr(language,"reducedHint")}</div></div></div><input type="checkbox" checked={settings.reducedMotion} onChange={e=>update("reducedMotion",e.target.checked)} style={{width:20,accentColor:"var(--primary)"}}/></div>
      <div className="rowline"><div><b>{tr(language,"startPage")}</b><div style={{fontSize:11,color:"var(--text-muted)"}}>{tr(language,"startPageHint")}</div></div><select value={settings.startPage} onChange={e=>update("startPage",e.target.value)} style={{width:180}}><option value="dashboard">{tr(language,"start")}</option><option value="grades">{tr(language,"grades")}</option><option value="calendar">{tr(language,"calendar")}</option><option value="tasks">{tr(language,"tasks")}</option><option value="schedule">{tr(language,"schedule")}</option><option value="mailbox">{tr(language,"mailbox")}</option><option value="profile">{tr(language,"profile")}</option></select></div>
    </div>
    <div className="profile-section"><h3 style={{margin:"0 0 4px"}}>{tr(language,"saved")}</h3><div style={{fontSize:12,color:"var(--text-muted)"}}>{tr(language,"savedHint")}</div></div>
  </div>;
}

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); fetchAdminUsers().then(setUsers).catch(e=>setStatus(e.message)).finally(()=>setLoading(false)); };
  useEffect(load, []);
  const send = async () => {
    if (!subject.trim() || !body.trim()) return setStatus("Bitte Betreff und Nachricht ausfüllen.");
    try { const r = await sendAdminBroadcast(subject, body); setStatus(`Nachricht an ${r.recipients} Konto${r.recipients === 1 ? "" : "en"} gesendet.`); setSubject(""); setBody(""); load(); } catch(e) { setStatus(e.message || "Senden fehlgeschlagen."); }
  };
  return <div>
    <div className="hero-card card" style={{marginBottom:16}}><div style={{position:"relative",zIndex:1}}><div style={{fontSize:11,fontWeight:800,letterSpacing:1,textTransform:"uppercase",opacity:.8}}>Schulio Administration</div><h2 style={{margin:"7px 0 4px"}}>Organisator</h2><div style={{fontSize:13,opacity:.9}}>Konten verwalten und Mitteilungen an alle Schulio-Nutzer senden.</div></div></div>
    <div className="grid2" style={{marginBottom:16}}>
      <div className="profile-section"><h3 style={{margin:"0 0 4px",display:"flex",gap:7,alignItems:"center"}}><Users size={17}/> Erstellte Accounts</h3><div style={{fontSize:11,color:"var(--text-muted)",marginBottom:12}}>{users.length} Konto{users.length===1?"":"en"}</div>{loading?<div className="empty-state">Lade…</div>:<div style={{maxHeight:360,overflowY:"auto"}}>{users.map(u=><div className="rowline" key={u.username}><div style={{minWidth:0}}><b style={{display:"block",overflow:"hidden",textOverflow:"ellipsis"}}>{u.name || u.username}</b><div style={{fontSize:11,color:"var(--text-muted)"}}>@{u.username} · {new Date(u.createdAt).toLocaleDateString("de-DE")}</div></div><span className="pill" style={{background:u.role==="admin"?"var(--primary-soft)":"var(--surface-alt)",color:u.role==="admin"?"var(--primary)":"var(--text-muted)"}}>{u.role === "admin" ? "Admin" : "Schüler"}</span></div>)}</div>}</div>
      <div className="profile-section"><h3 style={{margin:"0 0 4px",display:"flex",gap:7,alignItems:"center"}}><Send size={17}/> Mitteilung an alle</h3><div style={{fontSize:11,color:"var(--text-muted)",marginBottom:12}}>Die Nachricht landet bei allen anderen Accounts in der MailBox.</div><label className="fl">Betreff</label><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="z. B. Wartungsarbeiten"/><label className="fl" style={{marginTop:10}}>Nachricht</label><textarea rows={7} value={body} onChange={e=>setBody(e.target.value)} placeholder="Deine Mitteilung…"/><button className="btn" style={{marginTop:12}} onClick={send}><Send size={14}/> An alle senden</button>{status&&<div style={{marginTop:10,fontSize:12,color:"var(--primary)"}}>{status}</div>}</div>
    </div>
  </div>;
}

function CalendarView({ events, setEvents, subjects, subjectById }) {
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState("month");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const year = cursor.getFullYear(), month = cursor.getMonth();
  const grid = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      return d;
    });
  }, [year, month]);

  const iso = (d) => d.toISOString().slice(0, 10);
  const eventsOn = (d) => events.filter((e) => e.date === iso(d));

  const emptyForm = { title: "", subjectId: "", date: todayISO(), from: "10:00", to: "11:00", location: "", type: "Sonstiges", priority: "normal", notes: "", reminders: [] };
  const [form, setForm] = useState(emptyForm);

  const openNew = (date) => { setForm({ ...emptyForm, date: date || todayISO() }); setEditing(null); setShowForm(true); };
  const openEdit = (e) => { setForm(e); setEditing(e.id); setShowForm(true); };
  const save = () => {
    if (!form.title.trim()) return;
    if (editing) setEvents((evs) => evs.map((e) => e.id === editing ? { ...form, id: editing } : e));
    else setEvents((evs) => [...evs, { ...form, id: uid() }]);
    setShowForm(false);
  };
  const remove = (id) => { setEvents((evs) => evs.filter((e) => e.id !== id)); setShowForm(false); };
  const toggleReminder = (v) => setForm((f) => ({ ...f, reminders: f.reminders.includes(v) ? f.reminders.filter((r)=>r!==v) : [...f.reminders, v] }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="iconbtn" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft size={18} /></button>
          <b className="disp" style={{ fontSize: 16 }}>{MONTHS[month]} {year}</b>
          <button className="iconbtn" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight size={18} /></button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={"btn " + (view==="month"?"":"secondary")} onClick={()=>setView("month")}>Monat</button>
          <button className={"btn " + (view==="agenda"?"":"secondary")} onClick={()=>setView("agenda")}>Agenda</button>
          <button className="btn calendar-add-btn" onClick={() => openNew()} aria-label="Termin hinzufügen"><Plus size={16}/><span className="calendar-add-label">Termin</span></button>
        </div>
      </div>

      {view === "month" && (
        <div className="card" style={{ padding: 10, overflowX:"auto" }}>
          <div className="cal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(48px,1fr))", gap: 6, marginBottom: 6 }}>
            {WEEKDAYS.map((w) => <div key={w} style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{w}</div>)}
          </div>
          <div className="cal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(48px,1fr))", gap: 6 }}>
            {grid.map((d, i) => {
              const inMonth = d.getMonth() === month;
              const dayEvents = eventsOn(d);
              const isToday = iso(d) === todayISO();
              return (
                <div key={i} className="cal-cell" onClick={() => openNew(iso(d))} style={{
                  minHeight: 72, borderRadius: 10, padding: 6, cursor: "pointer",
                  background: inMonth ? "var(--surface-alt)" : "transparent",
                  opacity: inMonth ? 1 : 0.4,
                  border: isToday ? "2px solid var(--primary)" : "1px solid transparent"
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{d.getDate()}</div>
                  {dayEvents.slice(0, 2).map((e) => {
                    const s = subjectById(e.subjectId);
                    return (
                      <div key={e.id} onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                        style={{ fontSize: 10, background: (s?.color || "#888") + "26", color: s?.color || "var(--text)", borderRadius: 5, padding: "2px 4px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {e.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && <div style={{ fontSize: 9, color: "var(--text-muted)" }}>+{dayEvents.length - 2} mehr</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "agenda" && (
        <div className="card">
          {[...events].sort((a,b)=>a.date.localeCompare(b.date)).map((e) => {
            const s = subjectById(e.subjectId);
            return (
              <div className="rowline" key={e.id} style={{ cursor: "pointer" }} onClick={() => openEdit(e)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: s?.color || "var(--text-muted)" }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtDate(e.date)} · {e.from}–{e.to} · {e.location}</div>
                  </div>
                </div>
                <span className="pill" style={{ background: "var(--surface-alt)", color: "var(--text-muted)" }}>{e.type}</span>
              </div>
            );
          })}
          {events.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Keine Termine vorhanden.</div>}
        </div>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editing ? "Termin bearbeiten" : "Neuer Termin"}>
          <div className="grid2">
            <div style={{gridColumn:"1 / -1"}}><label className="fl">Titel</label><input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} /></div>
            <div><label className="fl">Fach</label>
              <select value={form.subjectId || ""} onChange={(e)=>setForm({...form,subjectId:e.target.value || null})}>
                <option value="">Kein Fach</option>
                {subjects.map((s)=> <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="fl">Terminart</label>
              <select value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})}>
                {EVENT_TYPES.map((t)=> <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="fl">Datum</label><input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} /></div>
            <div><label className="fl">Priorität</label>
              <select value={form.priority} onChange={(e)=>setForm({...form,priority:e.target.value})}>
                <option value="niedrig">Niedrig</option><option value="normal">Normal</option><option value="hoch">Hoch</option>
              </select>
            </div>
            <div><label className="fl">Von</label><input type="time" value={form.from} onChange={(e)=>setForm({...form,from:e.target.value})} /></div>
            <div><label className="fl">Bis</label><input type="time" value={form.to} onChange={(e)=>setForm({...form,to:e.target.value})} /></div>
            <div style={{gridColumn:"1 / -1"}}><label className="fl">Ort</label><input value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})} /></div>
            <div style={{gridColumn:"1 / -1"}}><label className="fl">Notizen</label><textarea rows={2} value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} /></div>
            <div style={{gridColumn:"1 / -1"}}>
              <label className="fl">Erinnerungen</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {REMINDER_OPTS.map((r) => (
                  <span key={r.v} onClick={() => toggleReminder(r.v)} className="pill" style={{
                    cursor: "pointer", background: form.reminders.includes(r.v) ? "var(--primary)" : "var(--surface-alt)",
                    color: form.reminders.includes(r.v) ? "white" : "var(--text-muted)"
                  }}><Bell size={10}/> {r.l}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "space-between" }}>
            {editing ? <button className="btn secondary" onClick={() => remove(editing)}><Trash2 size={14}/> Löschen</button> : <span />}
            <button className="btn" onClick={save}>Speichern</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div className="card modal-content" style={{ width: 460, maxHeight: "80vh", overflowY: "auto", background: "var(--surface)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <b style={{ fontSize: 15 }}>{title}</b>
          <button className="iconbtn" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Tasks({ tasks, setTasks, subjects, subjectById }) {
  const [showForm, setShowForm] = useState(false);
  const empty = { title: "", description: "", subjectId: "", due: todayISO(), priority: "normal", status: "offen" };
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState("alle");

  const add = () => { if (!form.title.trim()) return; setTasks((t) => [...t, { ...form, id: uid(), subtasks: [] }]); setForm(empty); setShowForm(false); };
  const cycle = (t) => {
    const order = ["offen", "in Bearbeitung", "erledigt"];
    const next = order[(order.indexOf(t.status) + 1) % order.length];
    setTasks((ts) => ts.map((x) => x.id === t.id ? { ...x, status: next } : x));
  };
  const remove = (id) => setTasks((t) => t.filter((x) => x.id !== id));

  const prioColor = { niedrig: "var(--text-muted)", normal: "var(--primary)", hoch: "var(--warning)", dringend: "var(--danger)" };
  const filtered = tasks.filter((t) => filter === "alle" ? true : t.status === filter).sort((a,b)=>a.due.localeCompare(b.due));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {["alle","offen","in Bearbeitung","erledigt"].map((f) => (
            <button key={f} className={"btn " + (filter===f?"":"secondary")} onClick={()=>setFilter(f)}>{f}</button>
          ))}
        </div>
        <button className="btn" onClick={() => setShowForm(true)}><Plus size={14}/> Aufgabe</button>
      </div>

      <div className="card">
        {filtered.map((t) => {
          const s = subjectById(t.subjectId);
          return (
            <div className="rowline" key={t.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button className="iconbtn" onClick={() => cycle(t)}>
                  {t.status === "erledigt" ? <CheckCircle2 size={17} color="var(--success)" /> : <Circle size={17} color={t.status==="in Bearbeitung" ? "var(--warning)" : "var(--text-muted)"} />}
                </button>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, textDecoration: t.status === "erledigt" ? "line-through" : "none", color: t.status === "erledigt" ? "var(--text-muted)" : "var(--text)" }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Fällig {fmtDate(t.due)} {s ? "· " + s.name : ""}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="pill" style={{ background: prioColor[t.priority] + "22", color: prioColor[t.priority] }}>{t.priority}</span>
                <button className="iconbtn" onClick={() => remove(t.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Keine Aufgaben in dieser Kategorie.</div>}
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Neue Aufgabe">
          <div className="grid2">
            <div style={{gridColumn:"1 / -1"}}><label className="fl">Titel</label><input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} /></div>
            <div style={{gridColumn:"1 / -1"}}><label className="fl">Beschreibung</label><textarea rows={2} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} /></div>
            <div><label className="fl">Fach</label>
              <select value={form.subjectId} onChange={(e)=>setForm({...form,subjectId:e.target.value})}>
                <option value="">Kein Fach</option>
                {subjects.map((s)=> <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="fl">Fälligkeitsdatum</label><input type="date" value={form.due} onChange={(e)=>setForm({...form,due:e.target.value})} /></div>
            <div><label className="fl">Priorität</label>
              <select value={form.priority} onChange={(e)=>setForm({...form,priority:e.target.value})}>
                <option value="niedrig">Niedrig</option><option value="normal">Normal</option><option value="hoch">Hoch</option><option value="dringend">Dringend</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn" onClick={add}>Speichern</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Notes({ notes, setNotes, subjects, subjectById }) {
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const empty = { title: "", content: "", subjectId: "" };
  const [form, setForm] = useState(empty);

  const add = () => { if (!form.title.trim()) return; setNotes((n) => [...n, { ...form, id: uid(), favorite: false, createdAt: todayISO() }]); setForm(empty); setShowForm(false); };
  const remove = (id) => setNotes((n) => n.filter((x) => x.id !== id));
  const toggleFav = (id) => setNotes((n) => n.map((x) => x.id === id ? { ...x, favorite: !x.favorite } : x));

  const filtered = notes.filter((n) => (n.title + n.content).toLowerCase().includes(query.toLowerCase()))
    .sort((a,b) => (b.favorite - a.favorite) || b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "var(--text-muted)" }} />
          <input style={{ paddingLeft: 30 }} placeholder="Notizen durchsuchen…" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </div>
        <button className="btn" onClick={() => setShowForm(true)}><Plus size={14}/> Notiz</button>
      </div>

      <div className="grid3">
        {filtered.map((n) => {
          const s = subjectById(n.subjectId);
          return (
            <div className="card" key={n.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <b style={{ fontSize: 13 }}>{n.title}</b>
                <button className="iconbtn" onClick={() => toggleFav(n.id)}><Star size={14} fill={n.favorite ? "var(--warning)" : "none"} color={n.favorite ? "var(--warning)" : "var(--text-muted)"} /></button>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{n.content}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                {s ? <span className="pill" style={{ background: s.color + "22", color: s.color }}>{s.name}</span> : <span />}
                <button className="iconbtn" onClick={() => remove(n.id)}><Trash2 size={13} /></button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Keine Notizen gefunden.</div>}
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Neue Notiz">
          <label className="fl">Titel</label><input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} style={{ marginBottom: 10 }} />
          <label className="fl">Fach</label>
          <select value={form.subjectId} onChange={(e)=>setForm({...form,subjectId:e.target.value})} style={{ marginBottom: 10 }}>
            <option value="">Kein Fach</option>
            {subjects.map((s)=> <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <label className="fl">Inhalt</label><textarea rows={4} value={form.content} onChange={(e)=>setForm({...form,content:e.target.value})} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn" onClick={add}>Speichern</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Schedule({ scheduleBooks, setScheduleBooks, activeScheduleId, setActiveScheduleId, subjects, subjectById }) {
  const [showForm, setShowForm] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookName, setBookName] = useState("");
  const [bookIcon, setBookIcon] = useState("📚");
  const [bookColor, setBookColor] = useState("#147BEF");
  const activeBook = scheduleBooks.find((book) => book.id === activeScheduleId) || scheduleBooks[0];
  const empty = { subjectId: subjects[0]?.id || "", teacher: "", room: "", day: 0, start: "08:00", end: "08:45" };
  const [form, setForm] = useState(empty);
  const times = Array.from(new Set((activeBook?.schedule || []).map((s) => s.start))).sort();

  const updateActive = (updater) => {
    setScheduleBooks((books) => books.map((book) => book.id === activeBook.id ? { ...book, schedule: typeof updater === "function" ? updater(book.schedule || []) : updater } : book));
  };
  const add = () => { if (!activeBook) return; updateActive((s) => [...s, { ...form, id: uid() }]); setForm(empty); setShowForm(false); };
  const remove = (id) => updateActive((s) => s.filter((x) => x.id !== id));

  const openNewBook = () => { setEditingBook(null); setBookName(""); setBookIcon("📚"); setBookColor("#147BEF"); setShowBookForm(true); };
  const openEditBook = (book) => { setEditingBook(book.id); setBookName(book.name); setBookIcon(book.icon || "📚"); setBookColor(book.color || "#147BEF"); setShowBookForm(true); };
  const saveBook = () => {
    if (!bookName.trim()) return;
    if (editingBook) setScheduleBooks((books) => books.map((book) => book.id === editingBook ? { ...book, name: bookName.trim(), icon: bookIcon || "📚", color: bookColor } : book));
    else { const id = uid(); setScheduleBooks((books) => [...books, { id, name: bookName.trim(), icon: bookIcon || "📚", color: bookColor, schedule: [] }]); setActiveScheduleId(id); }
    setShowBookForm(false);
  };
  const deleteBook = (id) => {
    if (scheduleBooks.length <= 1) return;
    const next = scheduleBooks.find((book) => book.id !== id);
    setScheduleBooks((books) => books.filter((book) => book.id !== id));
    if (id === activeScheduleId && next) setActiveScheduleId(next.id);
  };
  const duplicateBook = (book) => {
    const id = uid();
    setScheduleBooks((books) => [...books, { ...book, id, name: `${book.name} – Kopie`, schedule: (book.schedule || []).map((lesson) => ({ ...lesson, id: uid() })) }]);
    setActiveScheduleId(id);
  };

  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,marginBottom:18}}>
      {scheduleBooks.map((book) => <div key={book.id} className="card" onClick={() => setActiveScheduleId(book.id)} style={{cursor:"pointer",border:activeBook?.id===book.id?`2px solid ${book.color||"var(--primary)"}`:undefined,padding:0,overflow:"hidden"}}>
        <div style={{height:64,background:`linear-gradient(135deg,${book.color||"#147BEF"},#20CDB7)`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px",color:"white"}}>
          <span style={{fontSize:30}}>{book.icon||"📚"}</span>
          <div style={{display:"flex",gap:2}}>
            <button className="iconbtn" style={{color:"white",background:"rgba(255,255,255,.14)"}} onClick={(e)=>{e.stopPropagation();openEditBook(book)}} title="Umbenennen"><Pencil size={14}/></button>
            <button className="iconbtn" style={{color:"white",background:"rgba(255,255,255,.14)"}} onClick={(e)=>{e.stopPropagation();duplicateBook(book)}} title="Duplizieren"><Camera size={14}/></button>
            {scheduleBooks.length>1&&<button className="iconbtn" style={{color:"white",background:"rgba(255,255,255,.14)"}} onClick={(e)=>{e.stopPropagation();deleteBook(book.id)}} title="Löschen"><Trash2 size={14}/></button>}
          </div>
        </div>
        <div style={{padding:"12px 14px"}}><div style={{fontWeight:700,fontSize:14}}>{book.name}</div><div style={{color:"var(--text-muted)",fontSize:11,marginTop:3}}>{(book.schedule||[]).length} Unterrichtsstunden</div></div>
      </div>)}
      <button className="card" onClick={openNewBook} style={{border:"1px dashed var(--border)",background:"var(--surface-alt)",minHeight:124,cursor:"pointer",color:"var(--text-muted)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}><Plus size={22}/><span style={{fontWeight:700,fontSize:13}}>Stundenplan hinzufügen</span><span style={{fontSize:11,textAlign:"center"}}>z. B. Schule, neues Schuljahr oder Prüfungsplan</span></button>
    </div>

    <div className="section-head"><div><h3>{activeBook?.icon||"📚"} {activeBook?.name||"Stundenplan"}</h3><div style={{fontSize:11,color:"var(--text-muted)",marginTop:3}}>Eigener Stundenplan – unabhängig von deinen anderen Plänen</div></div><button className="btn" onClick={()=>{setForm({...empty,subjectId:subjects[0]?.id||""});setShowForm(true)}}><Plus size={14}/> Stunde</button></div>

    <div className="card" style={{overflowX:"auto"}}><div style={{display:"grid",gridTemplateColumns:"70px repeat(5,1fr)",gap:6,minWidth:640}}><div/>{WEEKDAYS.slice(0,5).map(w=><div key={w} style={{textAlign:"center",fontWeight:700,fontSize:12,padding:6}}>{w}</div>)}
      {times.map((time)=><React.Fragment key={time}><div style={{fontSize:11,color:"var(--text-muted)",paddingTop:10}}>{time}</div>{[0,1,2,3,4].map(day=>{const lesson=(activeBook?.schedule||[]).find(s=>s.day===day&&s.start===time);const sub=lesson?subjectById(lesson.subjectId):null;return <div key={day} style={{minHeight:56,borderRadius:8,background:sub?sub.color+"22":"var(--surface-alt)",padding:6,position:"relative"}}>{lesson&&<div><div style={{fontSize:12,fontWeight:700,color:sub?.color||"var(--text)"}}>{sub?.name||"Fach"}</div><div style={{fontSize:10,color:"var(--text-muted)"}}>{lesson.room} · {lesson.teacher}</div><button className="iconbtn" style={{position:"absolute",top:2,right:2}} onClick={()=>remove(lesson.id)}><X size={11}/></button></div>}</div>})}</React.Fragment>)}
      {times.length===0&&<div style={{gridColumn:"1 / -1"}} className="empty-state">Noch keine Unterrichtsstunden. Füge oben deine erste Stunde hinzu.</div>}
    </div></div>

    {showForm&&<Modal onClose={()=>setShowForm(false)} title="Neue Unterrichtsstunde"><div className="grid2">
      <div><label className="fl">Fach</label><select value={form.subjectId} onChange={e=>setForm({...form,subjectId:e.target.value})}>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div><label className="fl">Wochentag</label><select value={form.day} onChange={e=>setForm({...form,day:Number(e.target.value)})}>{WEEKDAYS.slice(0,5).map((w,i)=><option key={w} value={i}>{w}</option>)}</select></div>
      <div><label className="fl">Lehrer</label><input value={form.teacher} onChange={e=>setForm({...form,teacher:e.target.value})}/></div><div><label className="fl">Raum</label><input value={form.room} onChange={e=>setForm({...form,room:e.target.value})}/></div>
      <div><label className="fl">Start</label><input type="time" value={form.start} onChange={e=>setForm({...form,start:e.target.value})}/></div><div><label className="fl">Ende</label><input type="time" value={form.end} onChange={e=>setForm({...form,end:e.target.value})}/></div>
    </div><div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}><button className="btn" onClick={add}>Speichern</button></div></Modal>}

    {showBookForm&&<Modal onClose={()=>setShowBookForm(false)} title={editingBook?"Stundenplan bearbeiten":"Neuen Stundenplan erstellen"}><div style={{display:"grid",gap:12}}>
      <div><label className="fl">Name</label><input autoFocus value={bookName} onChange={e=>setBookName(e.target.value)} placeholder="z. B. Schuljahr 2026/27"/></div>
      <div><label className="fl">Symbol</label><input value={bookIcon} onChange={e=>setBookIcon(e.target.value)} maxLength={4} placeholder="📚"/></div>
      <div><label className="fl">Farbe</label><input type="color" value={bookColor} onChange={e=>setBookColor(e.target.value)} style={{height:44,padding:4}}/></div>
    </div><div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}><button className="btn" onClick={saveBook}>Speichern</button></div></Modal>}
  </div>;
}
