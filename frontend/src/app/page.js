"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Trash2,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  Languages,
  X,
  Hand,
  Upload,
  Users,
  Square,
  BookOpen,
} from "lucide-react";
import { loadMediaPipeScripts, HAND_CONNECTIONS } from "@/lib/mediapipe";
import { extractPositions, detectGesture, detectDualHandGesture } from "@/lib/gestureDetector";
import { TemporalGestureStabilizer } from "@/lib/gestureStabilizer";
import { speakText, stopSpeech } from "@/lib/speech";

const LinkedinIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 1 0-.01-3.3 1.66 1.66 0 0 0 .01 3.3m1.39 9.74v-8.37H5.07v8.37h2.78z" />
  </svg>
);

const GithubIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

// ============================================================================
// 1. I18N LOCALIZATION DICTIONARY (English & Sinhala)
// ============================================================================
const i18n = {
  en: {
    langName: "EN / සිංහල",
    tagline: "Every Sign Has a Voice.",
    badgeAi: "Real-time Edge Vision & Neural Speech",
    heroTitle: "Real-Time Sign Language Translation & Speech Synthesis",
    heroDesc:
      "Bridging the silence with artificial intelligence. Point your camera, sign naturally, and experience immediate phrase recognition and crystal-clear synthetic speech.",
    cameraTitle: "Live Sign Recognition",
    cameraLive: "LIVE FEED (60 FPS)",
    cameraOffline: "STANDBY",
    startCamera: "Start Camera",
    stopCamera: "Stop Camera",
    cameraPermissionError: "Camera permission denied or camera device not found. Please verify permissions.",
    cameraOffTitle: "Hardware Camera is Inactive",
    cameraOffDesc: 'Click "Start Camera" to initialize your browser webcam with 21-joint spatial hand tracking.',
    detectedSignHeader: "1. Detected Gesture",
    confidenceLabel: "Confidence Match",
    evaluatingStatus: "Awaiting hand gestures in camera field...",
    translatedHeader: "2. Translated Speech Text",
    textPlaceholder: "Synthesized phrase will appear here in real time...",
    voiceHeader: "3. Voice Output & Playback",
    playVoice: "Play Voice",
    stopVoice: "Stop Voice",
    autoSpeak: "Auto-Speak",
    copyText: "Copy Text",
    copiedText: "Copied!",
    clearText: "Clear",
    recentActivity: "Recent Recognition Log",
    clearHistory: "Clear History",
    noActivity: "No recognition events recorded in this session yet.",
    howItWorks: "How HASTHA Operates",
    step1Title: "High-Speed Knuckle Tracking",
    step1Desc: "Real-time 21-point spatial landmarks track hand orientations at 60 FPS directly in your browser.",
    step2Title: "Neural Sign Classification",
    step2Desc: "Spatial temporal models map dynamic hand shapes to natural language phrases.",
    step3Title: "Natural Voice Synthesis",
    step3Desc: "Decoded phrasing is instantly read aloud through neural speech synthesis.",
    teamTitle: "Meet the Team Behind HASTHA AI",
    teamSub: "Passionate engineering & computer science innovators bridging technology and accessibility",
    changePhotoTooltip: "Click to upload new photo",
    photoUpdatedToast: "Profile photo updated for",
    accessibilityStatement: "Accessibility Statement",
    accessibilityText:
      "HASTHA is designed according to WCAG 2.1 AA standards, featuring screen reader support, keyboard navigability, high-contrast modes, and reduced-motion compatibility.",
    profileModalTitle: "User Profile & Identity",
    fullNameLabel: "Full Name",
    emailLabel: "Email Address",
    phoneLabel: "Mobile Phone",
    saveProfile: "Save Profile Information",
    toastCopied: "Copied synthesized text to clipboard!",
    toastCleared: "Current speech buffer cleared.",
    toastProfileSaved: "Profile changes successfully saved.",
    resetPhotos: "Reset Team Photos",
    photosResetToast: "All team photos have been reset to default.",
    dictionaryTitle: "Distinct Sign Language Reference",
    allSigns: "All Signs",
    dualHandSigns: "Two-Handed Signs",
    singleHandSigns: "Single-Hand Signs",
  },
  si: {
    langName: "සිංහල / EN",
    tagline: "සෑම සංඥාවකටම හඬක් ඇත.",
    badgeAi: "තත්‍ය කාලීන පරිගණක දෘෂ්ටි සහ කටහඬ සංස්ලේෂණය",
    heroTitle: "සංඥා භාෂාව තත්‍ය කාලීනව හඬ සහ අකුරු බවට පරිවර්තනය",
    heroDesc:
      "කෘතිම බුද්ධිය මඟින් සංඥා භාෂාව තත්‍ය කාලීනව හඳුනාගෙන, පැහැදිලි කටහඬකින් හා ලිඛිත වචනවලින් ක්ෂණික සන්නිවේදනයක් ලබා දෙයි.",
    cameraTitle: "සජීවී සංඥා හඳුනාගැනීම",
    cameraLive: "සජීවී විකාශය (60 FPS)",
    cameraOffline: "අක්‍රියයි",
    startCamera: "කැමරාව අරඹන්න",
    stopCamera: "කැමරාව නවතන්න",
    cameraPermissionError: "කැමරාව සම්බන්ධ කරගත නොහැක. කරුණාකර බ්‍රවුසරයේ කැමරා අවසරය පරීක්ෂා කරන්න.",
    cameraOffTitle: "කැමරාව අක්‍රියව පවතී",
    cameraOffDesc: "ඔබේ වෙබ් කැමරාව ක්‍රියාත්මක කර 21-සන්ධි අත් සලකුණු හඳුනාගැනීම සඳහා ඉහත බොත්තම ඔබන්න.",
    detectedSignHeader: "1. හඳුනාගත් සංඥාව",
    confidenceLabel: "විශ්වාසනීයතාව",
    evaluatingStatus: "කැමරාව ඉදිරියේ අත් සංඥා ඉදිරිපත් කරන්න...",
    translatedHeader: "2. පරිවර්තනය වූ වාක්‍ය",
    textPlaceholder: "හඳුනාගත් වාක්‍ය මෙහි ස්වයංක්‍රීයව දිස්වේ...",
    voiceHeader: "3. කටහඬ හා ශ්‍රව්‍ය ප්‍රතිදානය",
    playVoice: "කටහඬින් අසන්න",
    stopVoice: "කටහඬ නවතන්න",
    autoSpeak: "ස්වයංක්‍රීය කටහඬ",
    copyText: "පිටපත්",
    copiedText: "පිටපත් විය!",
    clearText: "මකන්න",
    recentActivity: "මෑතකදී හඳුනාගත් ඉතිහාසය",
    clearHistory: "ඉතිහාසය මකන්න",
    noActivity: "මෙම සැසියේදී මෙතෙක් සංඥා වාර්තා වී නොමැත.",
    howItWorks: "හස්ත AI ක්‍රියාකාරීත්වය",
    step1Title: "ක්ෂණික සන්ධි හඳුනාගැනීම",
    step1Desc: "තත්පරයට රාමු 60ක වේගයෙන් අත්ලෙහි පිහිටීම් හා සන්ධි 21ක පිහිටීම නිරීක්ෂණය කරයි.",
    step2Title: "ස්නායුක සංඥා වර්ගීකරණය",
    step2Desc: "හඳුනාගත් චලනයන් ස්වභාවික භාෂා වචන හා වාක්‍ය බවට AI මොඩලය හරහා පරිවර්තනය කරයි.",
    step3Title: "ස්වභාවික කටහඬ උත්පාදනය",
    step3Desc: "පරිවර්තනය වූ වාක්‍ය ක්ෂණිකව ශබ්ද නඟා කියවමින් සන්නිවේදනය පහසු කරයි.",
    teamTitle: "හස්ත AI නිර්මාණ කණ්ඩායම (Our Team)",
    teamSub: "තාක්ෂණය සහ ප්‍රවේශ්‍යතාව එක්තැන් කරන නව නිපැයුම් ඉංජිනේරු හා පරිගණක විද්‍යා කණ්ඩායම",
    changePhotoTooltip: "ඡායාරූපය වෙනස් කිරීමට ක්ලික් කරන්න",
    photoUpdatedToast: "ඡායාරූපය සාර්ථකව යාවත්කාලීන විය:",
    accessibilityStatement: "ප්‍රවේශ්‍යතා ප්‍රකාශය",
    accessibilityText:
      "HASTHA පද්ධතිය WCAG 2.1 AA ප්‍රමිතීන්ට අනුකූලව නිර්මාණය කර ඇති අතර තිර කියවීමේ පහසුකම් සහ ඉහළ වර්ණ ප්‍රතිවිරෝධතා සපයයි.",
    profileModalTitle: "පරිශීලක ගිණුම හා තොරතුරු",
    fullNameLabel: "සම්පූර්ණ නම",
    emailLabel: "විද්‍යුත් තැපෑල",
    phoneLabel: "ජංගම දුරකථන අංකය",
    saveProfile: "තොරතුරු සුරකින්න",
    toastCopied: "පෙළ ක්ලිප්බෝඩ් එකට සාර්ථකව පිටපත් විය!",
    toastCleared: "වාක්‍ය මකා දමන ලදී.",
    toastProfileSaved: "ගිණුමේ තොරතුරු සාර්ථකව යාවත්කාලීන විය.",
    resetPhotos: "කණ්ඩායමේ ඡායාරූප මුල් තත්ත්වයට පත් කරන්න",
    photosResetToast: "කණ්ඩායමේ ඡායාරූප සාර්ථකව පෙරනිමියට සකසන ලදී.",
    dictionaryTitle: "සංඥා භාෂා මාර්ගෝපදේශය",
    allSigns: "සියලු සංඥා",
    dualHandSigns: "දෑතින්ම කරන සංඥා",
    singleHandSigns: "තනි අතින් කරන සංඥා",
  },
};

// Sinhala phrase mapping for our 17 distinct signs
const SIGN_SINHALA_MAP = {
  HELP: { nameSi: "උදව් (දෑතින්ම)", textSi: "කරුණාකර මට උදව් කරන්න" },
  TIME_WATCH: { nameSi: "වේලාව (දෑතින්ම)", textSi: "දැන් වේලාව කීයද?" },
  PRAY: { nameSi: "ස්තූතියි / ගෞරවය (දෑතින්ම)", textSi: "බොහොම ස්තූතියි, ගෞරවය පුද කරමි" },
  BOOK: { nameSi: "පොත (දෑතින්ම)", textSi: "පොත විවෘත කරන්න" },
  TOGETHER: { nameSi: "එකමුතුව (දෑතින්ම)", textSi: "අපි එකමුතුව වැඩ කරමු" },
  HOUSE: { nameSi: "නිවස (දෑතින්ම)", textSi: "නිවස හෝ ගෙදර" },
  MORE: { nameSi: "තවත් (දෑතින්ම)", textSi: "කරුණාකර තවත් ටිකක් දෙන්න" },
  OPEN_HAND: { nameSi: "ආයුබෝවන්", textSi: "ආයුබෝවන්! ඔබට සුබ දවසක්!" },
  FIST: { nameSi: "නවත්වන්න / රැඳෙන්න", textSi: "නවත්වන්න හෝ රැඳී සිටින්න" },
  THUMBS_UP: { nameSi: "ඔව් / ඉතා හොඳයි", textSi: "ඔව්, ඉතා හොඳයි" },
  THUMBS_DOWN: { nameSi: "නැත / එපා", textSi: "නැත, එය සුදුසු නැත" },
  PEACE: { nameSi: "සාමය / අංක 2", textSi: "සාමය සහ සතුට" },
  ILY: { nameSi: "මම ඔබට ආදරෙයි", textSi: "මම ඔබට හදවතින්ම ආදරෙයි" },
  OK: { nameSi: "සියල්ල හොඳින්", textSi: "සියල්ල හොඳින් සිදු වේ" },
  CALL_ME: { nameSi: "මට අමතන්න", textSi: "කරුණාකර මට ඇමතුමක් දෙන්න" },
  POINTING: { nameSi: "මෙය බලන්න", textSi: "මෙය හොඳින් බලන්න" },
  ROCK_ON: { nameSi: "විශිෂ්ටයි / ජයවේවා", textSi: "ඉතා විශිෂ්ටයි!" },
};

// ============================================================================
// DEFAULT DATA CONSTANTS
// ============================================================================
const DEFAULT_TEAM_MEMBERS = [
  {
    id: "member-1",
    name: "Isira Piumath",
    nameSi: "ඉසිර පියුමත්",
    degree: "BSC. COMPUTER SCIENCE(UG)",
    institution: "UNIVERSITY OF COLOMBO",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=350&q=80",
    linkedin: "https://linkedin.com",
    github: "https://github.com/isirapiumath",
  },
  {
    id: "member-2",
    name: "Themiya Madushanka",
    nameSi: "තේමිය මධුශංක",
    degree: "BSC. COMPUTER SCIENCE(UG)",
    institution: "UNIVERSITY OF COLOMBO",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=350&q=80",
    linkedin: "https://linkedin.com",
    github: "https://github.com/themiyamadushanka",
  },
  {
    id: "member-3",
    name: "Thuvishka Dasanayaka",
    nameSi: "තුවිෂ්ක දසනායක",
    degree: "BSC. COMPUTER SCIENCE(UG)",
    institution: "UNIVERSITY OF COLOMBO",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=350&q=80",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  },
  {
    id: "member-4",
    name: "Harindu Hansaja",
    nameSi: "හරිඳු හංසජ",
    degree: "BSC.(HONS) ENGINEERING(UG)",
    institution: "UNIVERSITY OF MORATUWA",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=350&q=80",
    linkedin: "https://linkedin.com",
    github: null,
  },
];

const DEFAULT_USER_PROFILE = {
  name: "Thuvishka Dasanayaka",
  email: "thuvishka@hastha.ai",
  phone: "+94 77 123 4567",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
};

// ============================================================================
// 2. VECTOR HASTHA LOGO COMPONENT
// ============================================================================
function HasthaFullLogo({ lang, className = "" }) {
  return (
    <div className={`flex items-center gap-3.5 select-none ${className}`}>
      <div className="relative group flex-shrink-0">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-purple-700 via-violet-600 to-indigo-500 p-0.5 shadow-xl shadow-purple-600/30">
          <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center relative overflow-hidden">
            <svg
              viewBox="0 0 100 100"
              className="w-9 h-9 sm:w-10 sm:h-10 transition-transform duration-300 group-hover:scale-110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="hasthaGrad" x1="15%" y1="10%" x2="85%" y2="90%">
                  <stop offset="0%" stopColor="#d8b4fe" />
                  <stop offset="45%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>

              <path
                d="M32 64 C25 56 24 45 28 36 C30 31 34 30 37 34 C37 38 38 46 41 49 C41 38 42 22 45 17 C48 13 53 14 54 18 C56 24 56 36 56 42 C58 35 60 27 63 26 C66 25 69 28 69 33 C69 40 68 49 68 54 C70 49 74 46 77 47 C80 48 81 53 79 58 C74 72 65 82 50 82 C38 82 34 74 32 64 Z"
                fill="url(#hasthaGrad)"
              />
              <ellipse cx="48" cy="56" rx="9" ry="12" fill="#3b0764" opacity="0.25" />

              <path
                d="M74 34 C78 38 81 44 81 50 C81 56 78 62 74 66"
                stroke="url(#waveGrad)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M82 26 C88 32 92 41 92 50 C92 59 88 68 82 74"
                stroke="url(#waveGrad)"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-800 dark:from-purple-300 dark:via-purple-200 dark:to-indigo-300 bg-clip-text text-transparent drop-shadow-sm">
            හස්ත
          </span>
          <span className="text-xs sm:text-sm font-extrabold tracking-[0.25em] text-purple-700 dark:text-purple-400">
            HASTHA
          </span>
        </div>
        <p className="text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-purple-200/70 tracking-wider">
          {lang === "si" ? "සෑම සංඥාවකටම හඬක් ඇත." : "Every Sign Has a Voice."}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 3. FAST COSMIC LIVE WALLPAPER CANVAS COMPONENT
// ============================================================================
function CosmicLiveWallpaper({ theme, scrollY }) {
  const canvasRef = useRef(null);
  const animFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let time = 0;
    const isDark = theme === "dark";

    const particles = Array.from({ length: 36 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 1,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      phase: Math.random() * Math.PI * 2,
    }));

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const render = () => {
      time += 0.035;
      ctx.clearRect(0, 0, width, height);

      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (isDark) {
        bgGrad.addColorStop(0, "#080613");
        bgGrad.addColorStop(0.5, "#100a20");
        bgGrad.addColorStop(1, "#07040e");
      } else {
        bgGrad.addColorStop(0, "#f9f8fe");
        bgGrad.addColorStop(0.5, "#f3edff");
        bgGrad.addColorStop(1, "#f9f6fc");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.beginPath();
      ctx.moveTo(0, height * 0.45);
      for (let x = 0; x <= width; x += 15) {
        const y =
          height * 0.45 +
          Math.sin(x * 0.003 + time) * 60 +
          Math.sin(x * 0.007 - time * 0.9) * 30 +
          scrollY * 0.15;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const ribbonGrad1 = ctx.createLinearGradient(0, height * 0.3, width, height);
      ribbonGrad1.addColorStop(0, isDark ? "rgba(168, 85, 247, 0.20)" : "rgba(192, 132, 252, 0.22)");
      ribbonGrad1.addColorStop(1, isDark ? "rgba(99, 102, 241, 0.06)" : "rgba(147, 51, 234, 0.05)");
      ctx.fillStyle = ribbonGrad1;
      ctx.fill();

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += 0.06;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const alpha = (Math.sin(p.phase) + 1) * 0.4 + 0.15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? `rgba(216, 180, 254, ${alpha})` : `rgba(147, 51, 234, ${alpha * 0.7})`;
        ctx.fill();
      });

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [theme, scrollY]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
}

// ============================================================================
// 4. MAIN EXPORT COMPONENT
// ============================================================================
export default function App() {
  const [lang, setLang] = useState("en");
  const [theme, setTheme] = useState("dark");

  const t = i18n[lang];

  // --------------------------------------------------------------------------
  // PERSISTENT TEAM MEMBERS STATE (LocalStorage)
  // --------------------------------------------------------------------------
  const [teamMembers, setTeamMembers] = useState(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("hastha_team_members") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        return DEFAULT_TEAM_MEMBERS.map((dm) => {
          const matched = parsed.find((p) => p.id === dm.id);
          return matched ? { ...dm, avatar: matched.avatar || dm.avatar } : dm;
        });
      }
    } catch (err) {
      console.warn("Could not read team members from localStorage:", err);
    }
    return DEFAULT_TEAM_MEMBERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("hastha_team_members", JSON.stringify(teamMembers));
    } catch (err) {
      console.warn("Failed to save team members to localStorage:", err);
    }
  }, [teamMembers]);

  const memberFileInputRefs = useRef({});

  const handleTeamPhotoUpload = (memberId, memberName, event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeamMembers((prev) => {
          const updated = prev.map((m) => (m.id === memberId ? { ...m, avatar: reader.result } : m));
          try {
            localStorage.setItem("hastha_team_members", JSON.stringify(updated));
          } catch (e) {
            console.warn("Storage save failed:", e);
          }
          return updated;
        });
        showToast(`${t.photoUpdatedToast} ${memberName}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetTeamPhotos = () => {
    setTeamMembers(DEFAULT_TEAM_MEMBERS);
    try {
      localStorage.removeItem("hastha_team_members");
    } catch (e) {
      console.warn("Storage reset failed:", e);
    }
    showToast(t.photosResetToast);
  };

  // --------------------------------------------------------------------------
  // PERSISTENT USER PROFILE STATE (LocalStorage)
  // --------------------------------------------------------------------------
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("hastha_user_profile") : null;
      if (saved) {
        return { ...DEFAULT_USER_PROFILE, ...JSON.parse(saved) };
      }
    } catch (err) {
      console.warn("Could not read user profile from localStorage:", err);
    }
    return DEFAULT_USER_PROFILE;
  });

  useEffect(() => {
    try {
      localStorage.setItem("hastha_user_profile", JSON.stringify(userProfile));
    } catch (err) {
      console.warn("Failed to save user profile to localStorage:", err);
    }
  }, [userProfile]);

  // Camera & Recognition States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Active Recognition State
  const [activeGesture, setActiveGesture] = useState(null);
  const [handsPositions, setHandsPositions] = useState([]);

  // Session History
  const [history, setHistory] = useState([
    { id: 1, signEn: "Hello", signSi: "ආයුබෝවන්", time: "14:15" },
    { id: 2, signEn: "Help", signSi: "උදව්", time: "14:18" },
  ]);

  // UI Modals & Toasts
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Video / Canvas / Stabilizer Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  const handsInstanceRef = useRef(null);
  const stabilizerRef = useRef(new TemporalGestureStabilizer({ stabilizationMs: 320, minConsensusFrames: 6 }));
  const lastTerminalLogRef = useRef(0);
  const committedGestureRef = useRef(null);
  const profileFileInputRef = useRef(null);

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Parallax Scroll Tracker
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --------------------------------------------------------------------------
  // TERMINAL LOGGING STREAM (npm run dev console)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (handsPositions.length === 0) return;
    const now = Date.now();
    if (now - lastTerminalLogRef.current >= 400) {
      lastTerminalLogRef.current = now;
      fetch("/api/log-positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hands: handsPositions,
          gesture: activeGesture,
        }),
      }).catch(() => {});
    }
  }, [handsPositions, activeGesture]);

  // --------------------------------------------------------------------------
  // AUTO SPEECH & HISTORY COMMIT ON VERIFIED GESTURE
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!activeGesture || !activeGesture.isVerified || activeGesture.gesture === "Unknown" || activeGesture.gesture === "TRACKING") {
      return;
    }

    const currentKey = activeGesture.gesture;
    if (committedGestureRef.current !== currentKey) {
      committedGestureRef.current = currentKey;

      const siInfo = SIGN_SINHALA_MAP[currentKey] || {};
      const speechPhrase = lang === "si" ? (siInfo.textSi || activeGesture.speechText) : activeGesture.speechText;

      // Speak text
      if (autoSpeak && speechPhrase) {
        speakText(speechPhrase);
      }

      // Add to session history
      setHistory((prev) => [
        {
          id: Date.now(),
          signEn: activeGesture.label || activeGesture.gesture,
          signSi: siInfo.nameSi || activeGesture.label,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev.slice(0, 5),
      ]);
    }
  }, [activeGesture, autoSpeak, lang]);

  // --------------------------------------------------------------------------
  // MEDIAPIPE COMPUTER VISION PIPELINE
  // --------------------------------------------------------------------------
  const startCamera = async () => {
    setCameraError(null);
    try {
      await loadMediaPipeScripts();
      if (!videoRef.current || !canvasRef.current) return;

      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.45,
        minTrackingConfidence: 0.45,
      });

      hands.onResults(onMediaPipeResults);
      handsInstanceRef.current = hands;

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && videoRef.current.readyState >= 2 && handsInstanceRef.current) {
            try {
              await handsInstanceRef.current.send({ image: videoRef.current });
            } catch (err) {
              console.warn("MediaPipe frame error:", err);
            }
          }
        },
        width: 1280,
        height: 720,
      });

      await camera.start();
      cameraInstanceRef.current = camera;
      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(t.cameraPermissionError);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraInstanceRef.current) {
      cameraInstanceRef.current.stop();
      cameraInstanceRef.current = null;
    }
    if (handsInstanceRef.current) {
      handsInstanceRef.current.close();
      handsInstanceRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    stabilizerRef.current.reset();
    setActiveGesture(null);
    setHandsPositions([]);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const lastUiUpdateRef = useRef(0);
  const onMediaPipeResults = (results) => {
    const now = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const detectedCount = results.multiHandLandmarks?.length || 0;

    if (detectedCount > 0) {
      const primaryLandmarks = results.multiHandLandmarks[0];
      const extractedHands = results.multiHandLandmarks
        .map((landmarks, index) => {
          const rawLabel = results.multiHandedness?.[index]?.label;
          const handedness = rawLabel || (index === 0 ? "Left" : "Right");
          const pos = extractPositions(landmarks, handedness);
          if (pos) {
            pos.gesture = detectGesture(landmarks, pos);
          }
          return pos;
        })
        .filter(Boolean);

      if (now - lastUiUpdateRef.current >= 40) {
        lastUiUpdateRef.current = now;
        const positions = extractedHands[0];
        let rawGesture = null;

        // Check for two-handed gestures first
        if (extractedHands.length >= 2 && results.multiHandLandmarks.length >= 2) {
          rawGesture = detectDualHandGesture(
            results.multiHandLandmarks[0],
            extractedHands[0],
            results.multiHandLandmarks[1],
            extractedHands[1]
          );
        }
        if (!rawGesture) {
          rawGesture = positions?.gesture || detectGesture(primaryLandmarks, positions);
        }

        // Pass through temporal stabilizer
        const stabilized = stabilizerRef.current.update(rawGesture, now);
        const finalGesture = stabilized.gesture
          ? {
              ...stabilized.gesture,
              isVerified: stabilized.isVerified,
              isVerifying: stabilized.isVerifying,
              verificationProgress: stabilized.verificationProgress,
              pendingLabel: stabilized.pendingLabel,
            }
          : stabilized.isVerifying
          ? {
              gesture: "VERIFYING",
              label: `Verifying: ${stabilized.pendingLabel || "Sign"}...`,
              isVerifying: true,
              verificationProgress: stabilized.verificationProgress,
              confidence: 50,
            }
          : null;

        setHandsPositions(extractedHands);
        setActiveGesture(finalGesture);
      }

      // Draw Glowing Skeleton on Canvas (60 FPS)
      results.multiHandLandmarks.forEach((landmarks) => {
        ctx.lineWidth = 3.5;
        HAND_CONNECTIONS.forEach(([i, j]) => {
          const p1 = landmarks[i];
          const p2 = landmarks[j];
          const grad = ctx.createLinearGradient(p1.x * width, p1.y * height, p2.x * width, p2.y * height);
          grad.addColorStop(0, "rgba(168, 85, 247, 0.85)");
          grad.addColorStop(1, "rgba(99, 102, 241, 0.85)");
          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(p1.x * width, p1.y * height);
          ctx.lineTo(p2.x * width, p2.y * height);
          ctx.stroke();
        });

        landmarks.forEach((pt) => {
          ctx.beginPath();
          ctx.arc(pt.x * width, pt.y * height, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = "#c084fc";
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();
        });
      });
    } else {
      if (now - lastUiUpdateRef.current >= 150) {
        lastUiUpdateRef.current = now;
        stabilizerRef.current.reset();
        setHandsPositions([]);
        setActiveGesture(null);
      }
    }

    ctx.restore();
  };

  // --------------------------------------------------------------------------
  // TEXT-TO-SPEECH
  // --------------------------------------------------------------------------
  const speakCurrentPhrase = (override) => {
    const textToSpeak = override || currentPhraseText;
    if (textToSpeak) {
      speakText(textToSpeak);
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 2000);
    }
  };

  const handleStopSpeaking = () => {
    stopSpeech();
    setIsSpeaking(false);
  };

  const copyPhraseToClipboard = () => {
    if (currentPhraseText) {
      navigator.clipboard.writeText(currentPhraseText);
      setIsCopied(true);
      showToast(t.toastCopied);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const clearPhrase = () => {
    setActiveGesture(null);
    showToast(t.toastCleared);
  };

  const handleProfileImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile((prev) => {
          const updated = { ...prev, avatar: reader.result };
          try {
            localStorage.setItem("hastha_user_profile", JSON.stringify(updated));
          } catch (err) {
            console.warn("Failed to save profile image:", err);
          }
          return updated;
        });
        showToast(t.toastProfileSaved);
      };
      reader.readAsDataURL(file);
    }
  };

  // Current localized display info
  const siInfo = activeGesture?.gesture ? SIGN_SINHALA_MAP[activeGesture.gesture] || {} : {};
  const currentSignTitle =
    activeGesture
      ? activeGesture.isVerifying
        ? `⏳ ${activeGesture.label}`
        : lang === "si"
        ? siInfo.nameSi || activeGesture.label
        : activeGesture.label
      : null;

  const currentPhraseText =
    activeGesture && activeGesture.isVerified
      ? lang === "si"
        ? siInfo.textSi || activeGesture.speechText
        : activeGesture.speechText
      : "";

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden font-sans transition-colors duration-500 selection:bg-purple-500 selection:text-white ${
        theme === "dark" ? "bg-[#090714] text-white" : "bg-[#f8f6fd] text-slate-900"
      }`}
    >
      {/* Dynamic Cosmic Live Wallpaper Engine */}
      <CosmicLiveWallpaper theme={theme} scrollY={scrollY} />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-purple-900/90 text-white backdrop-blur-xl border border-purple-400/30 shadow-2xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          TOP NAVIGATION HEADER (Clean, High-Contrast)
      ========================================================================= */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-2xl transition-all border-b ${
          theme === "dark"
            ? "bg-[#100b24]/80 border-purple-900/40 shadow-xl shadow-black/30"
            : "bg-white/80 border-purple-200/60 shadow-[0_4px_30px_rgba(147,51,234,0.06)]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <HasthaFullLogo lang={lang} />

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === "en" ? "si" : "en")}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-black tracking-wide backdrop-blur-md transition-all shadow-sm border ${
                theme === "dark"
                  ? "bg-purple-950/60 hover:bg-purple-900/70 text-purple-200 border-purple-800/60"
                  : "bg-purple-50/90 hover:bg-purple-100 text-purple-950 border-purple-200"
              }`}
              title="Toggle Language"
            >
              <Languages className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{t.langName}</span>
            </button>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`p-2.5 rounded-2xl backdrop-blur-md transition-all border shadow-sm ${
                theme === "dark"
                  ? "bg-white/10 hover:bg-white/15 text-yellow-300 border-white/15"
                  : "bg-purple-50 hover:bg-purple-100 text-purple-950 border-purple-200"
              }`}
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-purple-950" />}
            </button>

            {/* User Profile Pill */}
            <button
              onClick={() => setShowProfileModal(true)}
              className={`flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-2xl backdrop-blur-xl border transition-all shadow-sm ${
                theme === "dark"
                  ? "bg-white/10 border-white/15 hover:bg-white/20"
                  : "bg-white/90 border-purple-200 hover:bg-white"
              }`}
            >
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border-2 border-purple-500"
              />
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 max-w-[110px] truncate hidden sm:inline-block">
                {userProfile.name}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN WORKSPACE
      ========================================================================= */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* Hero Title Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/80 dark:bg-purple-950/60 border border-purple-300/50 text-purple-950 dark:text-purple-300 text-xs font-black backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
            <span>{t.badgeAi}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">
            {t.heroTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-purple-200/80 font-medium max-w-2xl mx-auto leading-relaxed">
            {t.heroDesc}
          </p>
        </div>

        {/* 2-COLUMN MAIN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: HARDWARE WEBCAM & MEDIAPIPE TRACKING */}
          <div
            className={`lg:col-span-7 rounded-3xl p-6 backdrop-blur-3xl border transition-all shadow-[0_20px_50px_rgba(147,51,234,0.08)] relative overflow-hidden ${
              theme === "dark" ? "bg-[#130e2a]/80 border-purple-900/40" : "bg-white/80 border-white/90 ring-1 ring-purple-100"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${cameraActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  {cameraActive ? t.cameraLive : t.cameraOffline}
                </span>
              </div>
              <h2 className="text-xs font-extrabold text-purple-800 dark:text-purple-300 uppercase tracking-widest">
                {t.cameraTitle}
              </h2>
            </div>

            {/* Video Viewport with Skeletal Canvas Overlay */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border-2 border-purple-500/20 shadow-inner">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
              />
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {!cameraActive && (
                <div className="text-center p-6 space-y-3 max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto text-purple-300">
                    <CameraOff className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white">{t.cameraOffTitle}</h3>
                  <p className="text-xs text-slate-300 font-normal leading-relaxed">{t.cameraOffDesc}</p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {cameraError}
              </div>
            )}

            {/* Hardware Controls */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              {cameraActive ? (
                <button
                  onClick={stopCamera}
                  className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>{t.stopCamera}</span>
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t.startCamera}</span>
                </button>
              )}

              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                  autoSpeak
                    ? "bg-purple-100/90 dark:bg-purple-900/50 text-purple-950 dark:text-purple-200 border-purple-300/50"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-transparent"
                }`}
              >
                {autoSpeak ? <Volume2 className="w-4 h-4 text-purple-700 dark:text-purple-400" /> : <VolumeX className="w-4 h-4" />}
                <span>{t.autoSpeak}</span>
              </button>
            </div>
          </div>

          {/* RIGHT: DETECTION, TRANSLATION & SPEECH */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. DETECTED GESTURE CARD */}
            <div
              className={`rounded-3xl p-6 backdrop-blur-3xl border transition-all shadow-[0_20px_50px_rgba(147,51,234,0.08)] space-y-4 ${
                theme === "dark" ? "bg-[#130e2a]/80 border-purple-900/40" : "bg-white/80 border-white/90 ring-1 ring-purple-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-300">
                  {t.detectedSignHeader}
                </span>
                <div className="flex items-center gap-2">
                  {activeGesture?.isDualHand && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-purple-700 text-white font-extrabold shadow-sm">
                      👐 {t.dualHandSigns}
                    </span>
                  )}
                  {activeGesture?.isVerified ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold">
                      {activeGesture.confidence}% Match
                    </span>
                  ) : activeGesture?.isVerifying ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold">
                      ⏳ {activeGesture.verificationProgress}%
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/30">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-600/30">
                  <Hand className="w-6 h-6 text-purple-100" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white truncate">
                    {currentSignTitle || (cameraActive ? t.evaluatingStatus : "---")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-purple-300/80 font-medium">
                    {activeGesture?.meaning || (cameraActive ? "3D knuckle tracking active" : t.evaluatingStatus)}
                  </p>
                </div>
              </div>

              {/* Verification Progress Bar */}
              {activeGesture?.isVerifying && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <span>Stabilizing Sign...</span>
                    <span>{activeGesture.verificationProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-purple-950/20 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-75"
                      style={{ width: `${activeGesture.verificationProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. TRANSLATED SPEECH TEXT CARD */}
            <div
              className={`rounded-3xl p-6 backdrop-blur-3xl border transition-all shadow-[0_20px_50px_rgba(147,51,234,0.08)] space-y-4 ${
                theme === "dark" ? "bg-[#130e2a]/80 border-purple-900/40" : "bg-white/80 border-white/90 ring-1 ring-purple-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-300">
                  {t.translatedHeader}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyPhraseToClipboard}
                    className="flex items-center gap-1.5 text-xs text-purple-800 dark:text-purple-300 hover:underline font-bold"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? t.copiedText : t.copyText}</span>
                  </button>
                  <button
                    onClick={clearPhrase}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500"
                    title={t.clearText}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/90 dark:bg-black/30 border border-purple-100 dark:border-purple-900/30 min-h-[90px] flex items-center">
                <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  &quot;{currentPhraseText || t.textPlaceholder}&quot;
                </p>
              </div>

              {/* 3. VOICE CONTROLS */}
              <div className="pt-2">
                {isSpeaking ? (
                  <button
                    onClick={handleStopSpeaking}
                    className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <Square className="w-4 h-4" />
                    <span>{t.stopVoice}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => speakCurrentPhrase()}
                    disabled={!currentPhraseText}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-600 hover:opacity-95 disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{t.playVoice}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RECENT ACTIVITY LOG
        ========================================================================= */}
        <section
          className={`rounded-3xl p-6 backdrop-blur-3xl border transition-all shadow-[0_20px_50px_rgba(147,51,234,0.08)] ${
            theme === "dark" ? "bg-[#130e2a]/80 border-purple-900/40" : "bg-white/80 border-white/90 ring-1 ring-purple-100"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
              {t.recentActivity}
            </h3>
            {history.length > 0 && (
              <button onClick={() => setHistory([])} className="text-xs text-purple-700 dark:text-purple-400 hover:underline font-bold">
                {t.clearHistory}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white">
                    {lang === "si" ? item.signSi : item.signEn}
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.time}</span>
                </div>
                <button
                  onClick={() => speakCurrentPhrase(lang === "si" ? item.signSi : item.signEn)}
                  className="p-2 rounded-xl bg-white dark:bg-white/10 hover:bg-purple-100 text-purple-800 dark:text-purple-300 transition-all shadow-sm"
                  title="Play Phrase"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            HOW IT WORKS (3-STEP PIPELINE)
        ========================================================================= */}
        <section className="space-y-6 pt-4">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-2xl font-black text-slate-950 dark:text-white">{t.howItWorks}</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-purple-200/70">
              From hand gestures to neural synthesized voice in 3 high-speed stages
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`p-6 rounded-3xl backdrop-blur-3xl border ${
                theme === "dark" ? "bg-[#130e2a]/70 border-purple-900/30" : "bg-white/70 border-white/80 shadow-md ring-1 ring-purple-100"
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-black mb-4">
                1
              </div>
              <h4 className="font-black text-slate-900 dark:text-white mb-2">{t.step1Title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.step1Desc}</p>
            </div>

            <div
              className={`p-6 rounded-3xl backdrop-blur-3xl border ${
                theme === "dark" ? "bg-[#130e2a]/70 border-purple-900/30" : "bg-white/70 border-white/80 shadow-md ring-1 ring-purple-100"
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-black mb-4">
                2
              </div>
              <h4 className="font-black text-slate-900 dark:text-white mb-2">{t.step2Title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.step2Desc}</p>
            </div>

            <div
              className={`p-6 rounded-3xl backdrop-blur-3xl border ${
                theme === "dark" ? "bg-[#130e2a]/70 border-purple-900/30" : "bg-white/70 border-white/80 shadow-md ring-1 ring-purple-100"
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black mb-4">
                3
              </div>
              <h4 className="font-black text-slate-900 dark:text-white mb-2">{t.step3Title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.step3Desc}</p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            MEET THE TEAM SECTION
        ========================================================================= */}
        <section className="space-y-6 pt-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 text-purple-900 dark:text-purple-300 text-xs font-bold border border-purple-300/40">
              <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Core Innovators</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {t.teamTitle}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">{t.teamSub}</p>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleResetTeamPhotos}
                className="text-[11px] font-semibold text-slate-500 hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-300 underline underline-offset-4 transition-colors"
              >
                {t.resetPhotos}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className={`group relative rounded-[28px] p-6 text-center transition-all duration-300 flex flex-col items-center justify-between backdrop-blur-3xl border hover:-translate-y-1 ${
                  theme === "dark"
                    ? "bg-[#121626]/80 border-slate-700/40 shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:border-cyan-400/50 hover:shadow-[0_20px_45px_rgba(6,182,212,0.15)]"
                    : "bg-white/80 border-white/90 shadow-[0_12px_36px_rgba(147,51,234,0.08)] ring-1 ring-purple-100/80 hover:border-purple-300 hover:shadow-[0_18px_40px_rgba(147,51,234,0.16)]"
                }`}
              >
                {/* Profile Picture with Persistent Upload */}
                <div className="relative mb-5">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-4 ring-cyan-400/40 dark:ring-cyan-400/60 shadow-xl group-hover:scale-105 transition-transform duration-300 bg-slate-900">
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover object-top" />
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    ref={(el) => (memberFileInputRefs.current[member.id] = el)}
                    onChange={(e) => handleTeamPhotoUpload(member.id, member.name, e)}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => memberFileInputRefs.current[member.id]?.click()}
                    title={t.changePhotoTooltip}
                    className="absolute bottom-0 right-0 p-2.5 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 text-white shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200 border-2 border-white dark:border-slate-900"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Member Details */}
                <div className="space-y-2 w-full flex-1 flex flex-col justify-center">
                  <h4 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {lang === "si" ? member.nameSi : member.name}
                  </h4>

                  <div className="space-y-0.5">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                      {member.degree}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700/80 dark:text-cyan-300/80">
                      {member.institution}
                    </p>
                  </div>
                </div>

                {/* Social Media Link Icons */}
                <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-white/10 w-full flex items-center justify-center gap-2.5">
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name} LinkedIn`}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-cyan-50 dark:bg-white/5 dark:hover:bg-cyan-950/40 text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                    >
                      <LinkedinIcon className="w-4 h-4" />
                    </a>
                  )}

                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name} GitHub`}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-cyan-50 dark:bg-white/5 dark:hover:bg-cyan-950/40 text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
                    >
                      <GithubIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* =========================================================================
          FOOTER
      ========================================================================= */}
      <footer
        className={`mt-20 border-t backdrop-blur-2xl py-12 transition-all ${
          theme === "dark" ? "bg-[#0b0818]/90 border-purple-900/40" : "bg-white/80 border-purple-200/60"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <HasthaFullLogo lang={lang} />

          <div className="text-center md:text-right space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              © 2026 HASTHA AI Inc. All rights reserved.
            </p>
            <p className="text-[11px] text-purple-700 dark:text-purple-400 font-bold">
              {t.accessibilityStatement} • WCAG 2.1 AA Compliant
            </p>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          USER PROFILE & IMAGE UPLOAD MODAL
      ========================================================================= */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div
            className={`w-full max-w-md rounded-3xl backdrop-blur-3xl p-6 sm:p-8 shadow-2xl relative border ${
              theme === "dark" ? "bg-[#15102e]/95 border-purple-800/50" : "bg-white/95 border-purple-200"
            }`}
          >
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">{t.profileModalTitle}</h3>

            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="relative group">
                <img
                  src={userProfile.avatar}
                  alt="User Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-purple-500 shadow-xl"
                />
                <button
                  type="button"
                  onClick={() => profileFileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2.5 rounded-full bg-purple-700 text-white shadow-lg hover:bg-purple-800 transition-all border-2 border-white dark:border-slate-900"
                  title="Upload picture"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>

              <input
                ref={profileFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => profileFileInputRef.current?.click()}
                className="text-xs text-purple-700 dark:text-purple-300 font-black hover:underline"
              >
                Upload Custom Photo
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-300">{t.fullNameLabel}</label>
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-white/70 dark:bg-black/30 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-300">{t.emailLabel}</label>
                <input
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-white/70 dark:bg-black/30 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-300">{t.phoneLabel}</label>
                <input
                  type="text"
                  value={userProfile.phone}
                  onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-white/70 dark:bg-black/30 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={() => {
                  setShowProfileModal(false);
                  showToast(t.toastProfileSaved);
                }}
                className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-600/25 transition-all"
              >
                {t.saveProfile}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
