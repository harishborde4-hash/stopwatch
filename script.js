  /* =========================================================
     1. FIREBASE CONFIGURATION (EASILY CONFIGURABLE BY USER!)
     ========================================================= */
  const firebaseConfig = {
    apiKey: "AIzaSyDnXr-M1w6pg0QKeAcA_nSwwxl9lxYKt8M",
    authDomain: "jee-tracker-harsh.firebaseapp.com",
    projectId: "jee-tracker-harsh",
    storageBucket: "jee-tracker-harsh.firebasestorage.app",
    messagingSenderId: "638304954291",
    appId: "1:638304954291:web:47b6181f6b6f5c933ecdc6"
  };

  let isFirebaseInitialized = false;
  let isGuestMode = false;
  let currentUser = null;
  let localDatabase = []; // Used if offline / guest mode fallback

  // Check if credentials are correct placeholders or genuine
  const isPlaceholder = (firebaseConfig.apiKey.includes("YOUR_API_KEY") || firebaseConfig.projectId.includes("YOUR_PROJECT_ID"));

  try {
    if (!isPlaceholder) {
      firebase.initializeApp(firebaseConfig);
      isFirebaseInitialized = true;
      console.log("Firebase initialized successfully!");
    } else {
      console.warn("Using placeholder Firebase credentials. Falling back automatically to offline-sync LocalStorage mode!");
    }
  } catch (error) {
    console.error("Firebase setup failed to initialize:", error);
  }

  /* =========================================================
     2. SUBJECTS & JEE SYLLABUS DATA (COMPLETE LISTS)
     ========================================================= */
  const jeeSyllabus = {
    Physics: [
      "Physics & Measurement (Units & Dimensions)",
      "Kinematics",
      "Laws of Motion",
      "Work, Energy & Power",
      "Rotational Motion",
      "Gravitation",
      "Properties of Solids & Liquids",
      "Thermodynamics & Kinetic Theory",
      "Oscillations & Waves (SHM)",
      "Electrostatics",
      "Current Electricity",
      "Magnetic Effects of Current & Magnetism",
      "Electromagnetic Induction & AC",
      "Electromagnetic Waves",
      "Optics (Ray & Wave Optics)",
      "Dual Nature of Matter & Radiation",
      "Atoms & Nuclei",
      "Electronic Devices (Semiconductors)"
    ],
    Chemistry: [
      "Some Basic Concepts in Chemistry (Mole Concept)",
      "Atomic Structure",
      "Chemical Bonding & Molecular Structure",
      "Chemical Thermodynamics",
      "Solutions",
      "Equilibrium (Chemical & Ionic)",
      "Redox Reactions & Electrochemistry",
      "Chemical Kinetics",
      "Classification of Elements & Periodicity",
      "p-Block, d-Block & f-Block Elements",
      "Coordination Compounds",
      "General Organic Chemistry (GOC)",
      "Isomerism",
      "Hydrocarbons",
      "Haloalkanes & Haloarenes",
      "Alcohols, Phenols & Ethers",
      "Aldehydes, Ketones & Carboxylic Acids",
      "Organic Compounds Containing Nitrogen (Amines)",
      "Biomolecules & Polymers"
    ],
    Mathematics: [
      "Sets, Relations & Functions",
      "Complex Numbers & Quadratic Equations",
      "Matrices & Determinants",
      "Permutations & Combinations",
      "Binomial Theorem",
      "Sequences & Series",
      "Limit, Continuity & Differentiability",
      "Integral Calculus",
      "Differential Equations",
      "Coordinate Geometry (Straight Lines/Circles)",
      "Conic Sections",
      "Three Dimensional Geometry",
      "Vector Algebra",
      "Statistics & Probability",
      "Trigonometry"
    ]
  };

  /* =========================================================
     3. STOPWATCH CORE VARIABLES
     ========================================================= */
  let startTime = 0;
  let elapsed = 0;
  let stopwatchInterval = null;
  let stopwatchRunning = false;
  let timerStartedAt = null;
  let timerEndedAt = null;
  
  let currentSessionQuestions = []; // Active list of questions marked in current stopwatch session
  let questionIndexCounter = 0;
  let currentSessionId = null;
  let activeSessionTimestamp = null;

  // MOTIVATIONAL QUOTES FOR JEE ASPIRANTS
  const motivationalQuotes = [
    "\"Time is what we want most, but what we use worst.\" — William Penn",
    "\"The secret of getting ahead is getting started.\" — Mark Twain",
    "\"Every second counts. Make them count.\"",
    "\"Focus on progress, not perfection.\"",
    "\"One question at a time. One day at a time.\"",
    "\"Don't watch the clock; do what it does. Keep going.\" — Sam Levenson",
    "\"Consistency is the key to mastery.\"",
    "\"Your IIT-JEE dream is built with small blocks of daily effort.\"",
    "\"The clock is ticking. Make every second matter.\"",
    "\"Consistency beats intensity. Practice daily!\""
  ];

  /* =========================================================
     4. SYSTEM AUTHENTICATION MANAGEMENT
     ========================================================= */
  let isSignUpMode = false;

  function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const subtitle = document.getElementById("authSubtitle");
    const switchPrompt = document.getElementById("switchPrompt");
    const switchBtn = document.getElementById("switchBtn");
    const submitBtn = document.getElementById("authSubmitBtn");

    if (isSignUpMode) {
      subtitle.textContent = "Create an account to track your progress online";
      switchPrompt.textContent = "Already have an account?";
      switchBtn.textContent = "Log In";
      submitBtn.textContent = "Sign Up";
    } else {
      subtitle.textContent = "Log in to sync your practice online";
      switchPrompt.textContent = "Don't have an account?";
      switchBtn.textContent = "Sign Up";
      submitBtn.textContent = "Log In";
    }
  }

  function updateSyncStatusBanner() {
    // Distraction-free: status messages are logged to console instead of taking up screen space!
    if (isGuestMode) {
      console.log("Database Mode: Offline Guest Mode active (cached in localStorage).");
    } else if (currentUser) {
      console.log(`Database Mode: Synced online via Firebase for ${currentUser.email}.`);
    } else {
      console.log("Database Mode: Ready to initialize.");
    }
  }

  // Handle Log In / Sign Up form submission
  function handleAuth(event) {
    event.preventDefault();
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    if (!isFirebaseInitialized) {
      alert("Firebase was not initialized because placeholder keys are in use. Please use Guest Mode to practice locally, or edit index.html to paste your real API credentials!");
      return;
    }

    if (isSignUpMode) {
      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          loginUserSuccess(userCredential.user);
        })
        .catch((error) => {
          alert("Sign Up Error: " + error.message);
        });
    } else {
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          loginUserSuccess(userCredential.user);
        })
        .catch((error) => {
          alert("Log In Error: " + error.message);
        });
    }
  }

  function startGuestMode() {
    isGuestMode = true;
    currentUser = { email: "Guest Aspirant", uid: "guest_user" };
    
    // Load local storage DB
    const cached = localStorage.getItem("jee_tracker_sessions");
    if (cached) {
      localDatabase = JSON.parse(cached);
    }

    document.getElementById("authScreen").style.display = "none";
    document.getElementById("trackerDashboard").style.display = "block";
    document.getElementById("avatarLetter").textContent = "G";
    document.getElementById("welcomeUser").textContent = "Welcome, Guest Aspirant!";

    updateSyncStatusBanner();
    loadChapters();
    renderStats();
    renderHistory();
  }

  function loginUserSuccess(user) {
    isGuestMode = false;
    currentUser = user;

    document.getElementById("authScreen").style.display = "none";
    document.getElementById("trackerDashboard").style.display = "block";
    document.getElementById("avatarLetter").textContent = user.email.charAt(0).toUpperCase();
    document.getElementById("welcomeUser").textContent = `Welcome, ${user.email.split('@')[0]}!`;

    updateSyncStatusBanner();
    loadChapters();
    loadSessionsFromFirestore();
  }

  function handleLogout() {
    if (isFirebaseInitialized && !isGuestMode) {
      firebase.auth().signOut().then(() => {
        location.reload();
      });
    } else {
      location.reload();
    }
  }

  function handleGoogleLogin() {
    if (!isFirebaseInitialized) {
      alert("⚠️ Google Sign-In requires your real Firebase API configuration! To try the app immediately in local sandbox mode, click 'Practice Offline (Guest Mode)' at the bottom.");
      return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then((result) => {
        if (result.user) {
          loginUserSuccess(result.user);
        }
      })
      .catch((error) => {
        // Some sandboxed iframes or browsers block popups. Fallback to redirect:
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
          console.log("Popup blocked or closed. Falling back to signInWithRedirect...");
          firebase.auth().signInWithRedirect(provider);
        } else {
          alert("Google Log In Error: " + error.message);
        }
      });
  }

  // Check auth state on load
  window.addEventListener("DOMContentLoaded", () => {
    updateSyncStatusBanner();
    if (isFirebaseInitialized) {
      // First, handle redirect sign-in outcome (if page redirected back from Google authentication)
      firebase.auth().getRedirectResult()
        .then((result) => {
          if (result.user) {
            loginUserSuccess(result.user);
          }
        })
        .catch((error) => {
          console.error("Google Sign-In Redirect error: ", error);
        });

      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          loginUserSuccess(user);
        } else {
          document.getElementById("authScreen").style.display = "flex";
          document.getElementById("trackerDashboard").style.display = "none";
        }
      });
    } else {
      // If no Firebase config, show the auth screen but explain guest mode
      document.getElementById("authScreen").style.display = "flex";
      document.getElementById("trackerDashboard").style.display = "none";
    }
    
    // Init rotating quotes
    rotateMotivationalQuotes();
    setInterval(rotateMotivationalQuotes, 8000);
  });

  /* =========================================================
     5. DYNAMIC SYLLABUS MANAGEMENT
     ========================================================= */
  function loadChapters() {
    const subject = document.getElementById("subjectSelect").value;
    const chapterSelect = document.getElementById("chapterSelect");
    chapterSelect.innerHTML = "";

    if (jeeSyllabus[subject]) {
      jeeSyllabus[subject].forEach(chapter => {
        const option = document.createElement("option");
        option.value = chapter;
        option.textContent = chapter;
        chapterSelect.appendChild(option);
      });
    }
    onChapterChanged();
  }

  function addCustomChapter() {
    const input = document.getElementById("customChapterInput");
    const val = input.value.trim();
    if (!val) return;

    const subject = document.getElementById("subjectSelect").value;
    const chapterSelect = document.getElementById("chapterSelect");

    if (!jeeSyllabus[subject].includes(val)) {
      jeeSyllabus[subject].push(val);
    }

    loadChapters();
    chapterSelect.value = val;
    input.value = "";
    onChapterChanged();
  }

  function onChapterChanged() {
    updateChapterTally();
    
    // Switch active session if chapter changes mid-study
    if (currentSessionQuestions.length > 0) {
      if (confirm("You are switching chapters. This will finalize your current practice session and start a new one. Is that OK?")) {
        resetStopwatch();
      }
    }
  }

  function updateChapterTally() {
    const subject = document.getElementById("subjectSelect").value;
    const chapter = document.getElementById("chapterSelect").value;
    const tallyEl = document.getElementById("chapterTally");
    
    if (!chapter) {
      tallyEl.textContent = "📊 Practiced in this chapter: 0 questions";
      return;
    }

    let count = 0;
    localDatabase.forEach(session => {
      if (session.subject === subject && session.chapter === chapter) {
        const aliveQs = (session.questions || []).filter(q => q.alive).length;
        count += aliveQs;
      }
    });

    tallyEl.textContent = `📊 Practiced in this chapter: ${count} questions`;
  }

  /* =========================================================
     6. CORE STOPWATCH CONTROLS & EVENT MARKING
     ========================================================= */
  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return h + ':' + String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
    return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
  }

  function ordinal(n) {
    return n <= 3 ? ['1st','2nd','3rd'][n-1] : n + 'th';
  }

  function getLocalDate() {
    return new Date().toLocaleDateString('en-IN', { timeZone:'Asia/Kolkata', weekday:'short', day:'2-digit', month:'short', year:'numeric' });
  }

  function getLocalTime() {
    return new Date().toLocaleTimeString('en-IN', { timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true });
  }

  function getLocalFullTime() {
    return getLocalDate() + '  ' + getLocalTime();
  }

  function tickStopwatch() {
    document.getElementById("timerDisplay").textContent = formatTime(elapsed + Date.now() - startTime);
  }

  function startStopwatch() {
    if (stopwatchRunning) return;
    stopwatchRunning = true;
    startTime = Date.now();
    
    if (!timerStartedAt) {
      timerStartedAt = getLocalFullTime();
    }

    stopwatchInterval = setInterval(tickStopwatch, 50);
    
    const display = document.getElementById("timerDisplay");
    display.className = "timer-display running";

    document.getElementById("startBtn").disabled = true;
    document.getElementById("stopBtn").disabled = false;
  }

  function stopStopwatch() {
    if (!stopwatchRunning) return;
    stopwatchRunning = false;
    elapsed += Date.now() - startTime;
    clearInterval(stopwatchInterval);

    const display = document.getElementById("timerDisplay");
    display.className = "timer-display paused";
    display.textContent = formatTime(elapsed);
    
    timerEndedAt = getLocalFullTime();

    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;
  }

  function resetStopwatch() {
    stopStopwatch();
    elapsed = 0;
    document.getElementById("timerDisplay").textContent = "00:00";
    document.getElementById("timerDisplay").className = "timer-display paused";
    
    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;

    timerStartedAt = null;
    timerEndedAt = null;
    currentSessionQuestions = [];
    questionIndexCounter = 0;
    currentSessionId = null;
    activeSessionTimestamp = null;
    
    document.getElementById("sessionCount").textContent = "No questions";
    document.getElementById("queueList").innerHTML = `<div class="empty-msg" id="queueEmptyMsg">Click "Start" and press "Mark Q" to record practiced questions!</div>`;
  }

  function markQuestion() {
    // Automatically trigger stopwatch start if marked while paused and timer is 0
    if (!stopwatchRunning && elapsed === 0) {
      startStopwatch();
    }

    const em = document.getElementById("queueEmptyMsg");
    if (em) em.remove();

    const currentTime = stopwatchRunning ? elapsed + (Date.now() - startTime) : elapsed;
    const timerStr = formatTime(currentTime);
    const localStr = getLocalFullTime();

    const activeIndex = questionIndexCounter;
    questionIndexCounter++;

    currentSessionQuestions.push({
      timerTime: timerStr,
      localTime: localStr,
      alive: true
    });

    renderCurrentSessionQueue();
    autoSaveActiveSession();
  }

  // Renders the visual queue of currently practicing questions
  function renderCurrentSessionQueue() {
    const list = document.getElementById("queueList");
    list.innerHTML = "";

    let aliveCount = 0;

    currentSessionQuestions.forEach((q, originalIdx) => {
      if (!q.alive) {
        // Render dead elements nicely to keep a visual log, matching design
        const entry = document.createElement("div");
        entry.className = "entry dead";
        entry.innerHTML = `
          <span class="num">X)</span>
          <div class="wrap">
            <span class="qtext">Question Deleted</span>
            <span class="time">⏱ ${q.timerTime}  |  🕐 ${q.localTime}</span>
          </div>
        `;
        list.appendChild(entry);
        return;
      }

      aliveCount++;
      const ord = ordinal(aliveCount);

      const entry = document.createElement("div");
      entry.className = "entry";
      entry.dataset.qIndex = originalIdx;

      const numSpan = document.createElement("span");
      numSpan.className = "num";
      numSpan.textContent = aliveCount + ")";

      const wrap = document.createElement("div");
      wrap.className = "wrap";

      const qText = document.createElement("span");
      qText.className = "qtext";
      qText.textContent = `Practiced your ${ord} question`;

      const timeSpan = document.createElement("span");
      timeSpan.className = "time";
      timeSpan.textContent = `⏱ ${q.timerTime}  |  🕐 ${q.localTime}`;

      const delBtn = document.createElement("button");
      delBtn.className = "del-btn";
      delBtn.textContent = "🗑️";
      delBtn.title = "Delete Record";
      delBtn.onclick = () => deletePracticedQuestion(originalIdx);

      wrap.appendChild(qText);
      wrap.appendChild(timeSpan);

      entry.appendChild(numSpan);
      entry.appendChild(wrap);
      entry.appendChild(delBtn);

      list.appendChild(entry);
    });

    document.getElementById("sessionCount").textContent = aliveCount > 0 ? `(${aliveCount} Qs logged)` : "No questions";
    list.scrollTop = list.scrollHeight;
  }

  function deletePracticedQuestion(originalIdx) {
    if (currentSessionQuestions[originalIdx]) {
      currentSessionQuestions[originalIdx].alive = false;
      renderCurrentSessionQueue();
      autoSaveActiveSession();
    }
  }

  /* =========================================================
     7. DATABASE SYNCHRONIZATION (FIREBASE & STORAGE)
     ========================================================= */
  function autoSaveActiveSession() {
    const aliveQuestions = currentSessionQuestions.filter(q => q.alive);
    if (currentSessionQuestions.length === 0) return;

    const subject = document.getElementById("subjectSelect").value;
    const chapter = document.getElementById("chapterSelect").value;
    
    const finalTotalTimeMs = stopwatchRunning ? elapsed + (Date.now() - startTime) : elapsed;
    const finalTotalTimeStr = formatTime(finalTotalTimeMs);

    if (!currentSessionId) {
      currentSessionId = "session_" + Date.now();
      activeSessionTimestamp = new Date().toISOString();
    }

    const sessionRecord = {
      id: currentSessionId,
      subject: subject,
      chapter: chapter,
      startedAt: timerStartedAt || getLocalFullTime(),
      endedAt: getLocalFullTime(),
      totalTime: finalTotalTimeStr,
      totalTimeMs: finalTotalTimeMs,
      questionsCount: aliveQuestions.length,
      questions: currentSessionQuestions,
      timestamp: activeSessionTimestamp
    };

    if (isGuestMode || !isFirebaseInitialized) {
      // Save/Update in LocalStorage DB
      const existingIdx = localDatabase.findIndex(s => s.id === sessionRecord.id);
      if (existingIdx !== -1) {
        localDatabase[existingIdx] = sessionRecord;
      } else {
        localDatabase.unshift(sessionRecord);
      }
      localStorage.setItem("jee_tracker_sessions", JSON.stringify(localDatabase));
      
      renderStats();
      renderHistory();
      updateChapterTally();
    } else {
      // Save/Update directly in Firestore in Real-Time
      firebase.firestore()
        .collection("users")
        .doc(currentUser.uid)
        .collection("practice_sessions")
        .doc(sessionRecord.id)
        .set(sessionRecord)
        .then(() => {
          const existingIdx = localDatabase.findIndex(s => s.id === sessionRecord.id);
          if (existingIdx !== -1) {
            localDatabase[existingIdx] = sessionRecord;
          } else {
            localDatabase.unshift(sessionRecord);
          }
          renderStats();
          renderHistory();
          updateChapterTally();
        })
        .catch(err => {
          console.error("Firestore Auto-Save Error: ", err);
        });
    }
  }

  function finishSession() {
    const aliveQuestions = currentSessionQuestions.filter(q => q.alive);
    if (aliveQuestions.length === 0) {
      alert("⚠️ No active questions marked in this session yet. Practice some questions first!");
      return;
    }

    // Trigger one final auto-save to lock in timestamps and state
    autoSaveActiveSession();

    alert(`🎉 Session completed! Solved ${aliveQuestions.length} questions for ${document.getElementById("chapterSelect").value}. Synced with your online dashboard!`);
    resetStopwatch();
  }

  function loadSessionsFromFirestore() {
    if (!currentUser || isGuestMode || !isFirebaseInitialized) return;

    firebase.firestore()
      .collection("users")
      .doc(currentUser.uid)
      .collection("practice_sessions")
      .orderBy("timestamp", "desc")
      .get()
      .then(snapshot => {
        localDatabase = [];
        snapshot.forEach(doc => {
          localDatabase.push(doc.data());
        });
        
        renderStats();
        renderHistory();
        updateChapterTally();
      })
      .catch(err => {
        console.error("Firestore Loading Error: ", err);
        // Fallback to local db if loading fails
        const cached = localStorage.getItem("jee_tracker_sessions");
        if (cached) localDatabase = JSON.parse(cached);
        renderStats();
        renderHistory();
        updateChapterTally();
      });
  }

  function deleteSavedSession(sessionId) {
    if (!confirm("Are you sure you want to delete this practice session record? This cannot be undone!")) return;

    if (isGuestMode || !isFirebaseInitialized) {
      localDatabase = localDatabase.filter(s => s.id !== sessionId);
      localStorage.setItem("jee_tracker_sessions", JSON.stringify(localDatabase));
      renderStats();
      renderHistory();
    } else {
      firebase.firestore()
        .collection("users")
        .doc(currentUser.uid)
        .collection("practice_sessions")
        .doc(sessionId)
        .delete()
        .then(() => {
          loadSessionsFromFirestore();
        })
        .catch(err => {
          alert("Error deleting record online: " + err.message);
        });
    }
  }

  /* =========================================================
     8. METRIC CALCULATION & INTERACTIVE DASHBOARD
     ========================================================= */
  function renderStats() {
    let physicsCount = 0;
    let chemistryCount = 0;
    let mathsCount = 0;

    localDatabase.forEach(session => {
      const aliveQuestions = (session.questions || []).filter(q => q.alive).length;
      if (session.subject === "Physics") {
        physicsCount += aliveQuestions;
      } else if (session.subject === "Chemistry") {
        chemistryCount += aliveQuestions;
      } else if (session.subject === "Mathematics") {
        mathsCount += aliveQuestions;
      }
    });

    const totalCount = physicsCount + chemistryCount + mathsCount;

    document.getElementById("statsPhysics").textContent = physicsCount;
    document.getElementById("statsChemistry").textContent = chemistryCount;
    document.getElementById("statsMaths").textContent = mathsCount;
    document.getElementById("statsTotal").textContent = totalCount;
  }

  function renderHistory() {
    const container = document.getElementById("historyContainer");
    container.innerHTML = "";

    if (localDatabase.length === 0) {
      container.innerHTML = `<div class="empty-msg">No saved sessions found. Start practicing to sync with Firebase!</div>`;
      return;
    }

    localDatabase.forEach(session => {
      const activeQs = (session.questions || []).filter(q => q.alive).length;
      const subClass = "hist-" + session.subject.toLowerCase();
      
      const item = document.createElement("div");
      item.className = `history-item ${subClass}`;

      const dateObj = new Date(session.timestamp);
      const displayDate = dateObj.toLocaleDateString("en-IN", { day:'2-digit', month:'short', year:'numeric' }) + " at " + dateObj.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });

      item.innerHTML = `
        <div class="hist-details">
          <div class="hist-sub-chap">${session.subject} • ${session.chapter}</div>
          <div class="hist-meta">⏱ Session: ${session.totalTime} | 📅 ${displayDate}</div>
          <div class="hist-counts">✓ ${activeQs} Questions Solved</div>
        </div>
        <div class="hist-action-row">
          <button class="hist-pdf-btn" onclick="generateSessionPDF('${session.id}')">📄 PDF Report</button>
          <button class="hist-del-btn" onclick="deleteSavedSession('${session.id}')" title="Delete session record">🗑️</button>
        </div>
      `;

      container.appendChild(item);
    });
  }

  /* =========================================================
     9. DYNAMIC PDF GENERATION UTILITY
     ========================================================= */
  function generateSessionPDF(sessionId) {
    const session = localDatabase.find(s => s.id === sessionId);
    if (!session) return;

    const aliveQuestions = (session.questions || []).filter(q => q.alive);
    if (aliveQuestions.length === 0) {
      alert("No active question logs available to print.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    let y = 18;

    // Header Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    
    const docTitle = `JEE Practice Session: ${session.subject}`;
    doc.text(docTitle, pw / 2, y, { align: 'center' });
    y += 6;

    doc.setDrawColor(0, 150, 0);
    doc.setLineWidth(0.8);
    doc.line(15, y, pw - 15, y);
    y += 10;

    // Session Meta Data
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    doc.text(`📅 Date: ${new Date(session.timestamp).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}`, 15, y); y += 7;
    doc.text(`📚 Topic/Chapter: ${session.chapter}`, 15, y); y += 7;
    doc.text(`▶ Started: ${session.startedAt}`, 15, y); y += 7;
    doc.text(`⏹ Ended: ${session.endedAt}`, 15, y); y += 9;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 0);
    doc.text(`Total Time Practicing: ${session.totalTime} | Solved: ${aliveQuestions.length} Questions`, 15, y); y += 10;

    // Table Data Creation
    const tableData = [];
    let counter = 0;
    
    session.questions.forEach(q => {
      if (q.alive) {
        counter++;
        tableData.push([counter, `Question ${ordinal(counter)}`, q.timerTime, q.localTime]);
      }
    });

    doc.autoTable({
      startY: y,
      head: [['#', 'Question Description', 'Lap Time (Timer)', 'Local Chrono Time']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [34, 34, 34], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 12 }, 2: { halign: 'center' } },
      margin: { left: 15, right: 15 }
    });

    y = doc.lastAutoTable.finalY + 15;

    // Footer Motivation Message
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(60, 60, 60);
    doc.text('Keep going! Consistency beats intensity. Crack IIT-JEE!', pw / 2, y, { align: 'center' });

    // signature footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('by harsh', pw / 2, ph - 12, { align: 'center' });

    // Filename construction
    const formattedChapter = session.chapter.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `JEE_${session.subject}_${formattedChapter}_${aliveQuestions.length}_questions.pdf`;
    doc.save(filename);
  }

  /* =========================================================
     10. GLOBAL HOTKEY SHORTCUTS & MOTIVATION ROTATOR
     ========================================================= */
  document.addEventListener("keydown", function(e) {
    // Avoid capturing hotkeys when user is writing password or editing forms
    if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT") {
      return;
    }

    if (e.code === "Space") {
      e.preventDefault();
      stopwatchRunning ? stopStopwatch() : startStopwatch();
    }
    if (e.code === "Enter") {
      e.preventDefault();
      markQuestion();
    }
    if (e.code === "KeyR") {
      e.preventDefault();
      if (confirm("Reset current practicing stopwatch and clear unsaved logs?")) {
        resetStopwatch();
      }
    }
    if (e.code === "KeyS") {
      e.preventDefault();
      finishSession();
    }
  });

  function rotateMotivationalQuotes() {
    const el = document.getElementById("motivationalQuote");
    el.style.opacity = 0;
    setTimeout(() => {
      const idx = Math.floor(Math.random() * motivationalQuotes.length);
      el.textContent = motivationalQuotes[idx];
      el.style.opacity = 1;
    }, 400);
  }
