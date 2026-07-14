let currentLang = ['sk', 'cs'].includes((navigator.language || 'en').slice(0, 2).toLowerCase()) ? 'SK' : 'EN', currentState = 'READY', timeLeft = 0, timerId = null, selectedTime = null, selectedFocus = null, currentGameIndex = 0, currentActiveGames = [];
let currentBlockPlan = [], currentBlockIndex = 0, timePassedInBlock = 0, audioCtx = null;
let currentTargets = [], targetInterval = 0, currentTargetIndex = 0;
const bellSound = new Audio("https://raw.githubusercontent.com/dcpoprad/dc-poprad-assets/main/ship-bell-two-chimes-102730%20(1).mp3");

// PREDVOLENE NASTAVENÝ REÁLNY ČAS (1 = Real time, 60 = Test mode)
let TIME_MULTIPLIER = 1; 

const dict = {
    EN: { welcomeTitle: "WELCOME TO OCHE COACH", welcomeText: "This is your pure, zen training tool. No counting, no scoring, no pressure. Just you, the board, and the time flowing.", btnUnderstand: "GOT IT", duration: "DURATION", focus: "FOCUS", tournament: "TOURNAMENT", btnGoToOche: "GO TO OCHE", back: "BACK", exit: "EXIT", btnChange: "CHANGE", btnGameOn: "GAME ON!", btnPause: "|| PAUSE", btnResume: "► RESUME", btnNextBlock: "NEXT BLOCK", btnDone: "DONE", coachTip: "Take a short break between blocks. Switch off your focus, hydrate, and rest your arm. Matches take about 10-20 minutes, so it's important to practice resting and restarting your concentration.", summaryTitle: "SESSION COMPLETE", ultimateTitle: "ULTIMATE SURVIVOR", summaryQuote: "\"You are on a great path. All this practice will pay off 100% in your tournaments and matches. Maybe not tomorrow, maybe not next week, but it will absolutely come.\"", tourneyQuote: "\"Good luck in the tournament! Let them fly and enjoy the darts.\"", statsWeek: "This week", statsMonth: "This month", seqText: "SEQUENCE", freeText: "FREE CHOICE" },
    SK: { welcomeTitle: "VITAJ V OCHE COACH", welcomeText: "Toto je tvoj tréner na čiare. Bez zapisovania, bez hodnotenia, žiaden tlak. Len ty, šípky, terč a plynúci čas.", btnUnderstand: "GOT IT", duration: "DURATION", focus: "FOCUS", tournament: "TOURNAMENT", btnGoToOche: "GO TO OCHE", back: "BACK", exit: "EXIT", btnChange: "CHANGE", btnGameOn: "GAME ON!", btnPause: "|| PAUSE", btnResume: "► RESUME", btnNextBlock: "NEXT BLOCK", btnDone: "DONE", coachTip: "Medzi blokmi si daj krátku pauzu. Vypni sústredenie, napi sa a zves ruky. Zápasy trvajú cca 10-20 minút, preto je dôležité trénovať aj oddych a reštart koncentrácie.", summaryTitle: "TRÉNING UKONČENÝ", ultimateTitle: "ULTIMATE SURVIVOR", summaryQuote: "\"Si na skvelej ceste. Všetok tento tréning sa ti 100% vráti v turnajoch a zápasoch. Možno nie zajtra, ani o týždeň, ale určite to príde.\"", tourneyQuote: "\"Držím palce v turnaji! Nech to lieta a hlavne sa bav šípkami.\"", statsWeek: "Tento týždeň", statsMonth: "Tento mesiac", seqText: "SEKVENCIA", freeText: "VOĽNÝ VÝBER" }
};

let gamesDB = { Singles: [], Scoring: [], Doubles: [], Checkouts: [], Mix: [], Tournament: [] };
let isDbLoaded = false;
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlZbjJjH1cgIPJAB_dythYDtgd4joUx6ujzPBQUK_VSe3OhSEzzUvLNzOGGA6_EBuuqWd22KJMuKzC/pub?output=csv";

document.addEventListener('DOMContentLoaded', () => { applyLanguage(); checkOnboarding(); setupEventListeners(); });

function applyLanguage() {
    document.getElementById('t_welcomeTitle').innerText = dict[currentLang].welcomeTitle; document.getElementById('t_welcomeText').innerText = dict[currentLang].welcomeText;
    document.getElementById('btnUnderstand').innerText = dict[currentLang].btnUnderstand; document.getElementById('t_duration').innerText = dict[currentLang].duration;
    document.getElementById('t_focus').innerText = dict[currentLang].focus; document.getElementById('t_tournament').innerText = dict[currentLang].tournament;
    document.getElementById('enterBtn').innerText = dict[currentLang].btnGoToOche; document.getElementById('t_back').innerText = dict[currentLang].back;
    document.getElementById('t_exit').innerText = dict[currentLang].exit; document.getElementById('btnChangeGame').innerText = dict[currentLang].btnChange;
    document.getElementById('hintReadyBtn').innerText = dict[currentLang].btnGameOn;
    if(document.getElementById('t_coachTipText')) document.getElementById('t_coachTipText').innerText = dict[currentLang].coachTip;

    if(document.getElementById('t_summaryQuote')) {
        document.getElementById('t_summaryQuote').innerText = (selectedFocus === 'Tournament') ? dict[currentLang].tourneyQuote : dict[currentLang].summaryQuote;
    }
    if(document.getElementById('t_seq')) document.getElementById('t_seq').innerText = dict[currentLang].seqText;
    if(document.getElementById('t_free')) document.getElementById('t_free').innerText = dict[currentLang].freeText;
    if(document.getElementById('t_statsWeek')) document.getElementById('t_statsWeek').innerText = dict[currentLang].statsWeek + ":";
    if(document.getElementById('t_statsMonth')) document.getElementById('t_statsMonth').innerText = dict[currentLang].statsMonth + ":";
    if(document.getElementById('btnDone')) document.getElementById('btnDone').innerText = dict[currentLang].btnDone;

    let isUlt = selectedTime === 180;
    if(document.getElementById('t_summaryTitle')) document.getElementById('t_summaryTitle').innerText = isUlt ? dict[currentLang].ultimateTitle : dict[currentLang].summaryTitle;

    if(selectedFocus && selectedTime) {
        let dynText = currentLang === 'EN' ? `Great ${selectedTime}-minute session focused on ${selectedFocus.toUpperCase()}!` : `Skvelá ${selectedTime}-minútovka zameraná na ${selectedFocus.toUpperCase()}!`;
        if (isUlt) dynText = currentLang === 'EN' ? "Brutal! You survived the ULTIMATE training!" : "Brutálne! Zvládol si ULTIMATE tréning!";
        if (selectedFocus === 'Tournament') dynText = currentLang === 'EN' ? "Great Warm-Up! You are match-ready." : "Skvelé rozohriatie! Si pripravený na zápas.";
        if(document.getElementById('summaryDynamicText')) document.getElementById('summaryDynamicText').innerText = dynText;
    }

    updateMainBtnText();
}

function updateMainBtnText() {
    const btn = document.getElementById('mainBtn'); if(!btn) return;
    if (currentState === 'PAUSED') btn.innerText = dict[currentLang].btnResume; else if (currentState === 'RUNNING') btn.innerText = dict[currentLang].btnPause;
    else if (currentState === 'FINISHED') btn.innerText = dict[currentLang].btnNextBlock; else btn.innerText = dict[currentLang].btnPause;
}

function checkOnboarding() {
    const lastVisit = localStorage.getItem('ocheCoach_lastVisit');
    if (!lastVisit || (new Date().getTime() - parseInt(lastVisit) > 30 * 24 * 60 * 60 * 1000)) document.getElementById('onboardingView').classList.remove('hidden');
    else document.getElementById('lobbyView').classList.remove('hidden');
}

function playSystemBeep(freq = 800, duration = 0.15) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playOscillator = (startTime, f, dur) => {
        const osc = audioCtx.createOscillator(), gainNode = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(f, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
        osc.connect(gainNode); gainNode.connect(audioCtx.destination); osc.start(startTime); osc.stop(startTime + dur);
    };
    playOscillator(audioCtx.currentTime, freq, duration);
}

// VÝVOJÁRSKA SKRATKA - Zobrazenie dočasnej správy na obrazovke
function showDevToast(message) {
    let toast = document.getElementById('devToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'devToast';
        toast.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.9); border:2px solid var(--gold); color:var(--gold); padding:15px 25px; border-radius:10px; font-family:'Oswald',sans-serif; font-size:1.2rem; z-index:9999; text-transform:uppercase; letter-spacing:1px; box-shadow:0 0 20px rgba(223,177,91,0.5); pointer-events:none; transition:opacity 0.3s ease;";
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

function saveAndGetStats(mins) {
    let history = JSON.parse(localStorage.getItem('ocheCoach_history')) || [];
    let now = new Date().getTime();
    if(mins > 0) { history.push({ts: now, m: mins}); localStorage.setItem('ocheCoach_history', JSON.stringify(history)); }
    let weekMins = 0, monthMins = 0;
    let oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    let currMonth = new Date().getMonth(), currYear = new Date().getFullYear();
    history.forEach(item => {
        if(item.ts >= oneWeekAgo) weekMins += item.m;
        let d = new Date(item.ts);
        if(d.getMonth() === currMonth && d.getFullYear() === currYear) monthMins += item.m;
    });
    const formatTime = (total) => { let h = Math.floor(total / 60); let m = total % 60; return h > 0 ? `${h}h ${m}m` : `${m}m`; };
    return { w: formatTime(weekMins), m: formatTime(monthMins) };
}

function showSummary() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    document.querySelectorAll('.app-container').forEach(el => el.classList.add('hidden'));
    
    let stats = saveAndGetStats(selectedTime);
    let isUlt = selectedTime === 180;
    
    document.getElementById('t_summaryTitle').style.color = isUlt ? 'var(--gold)' : 'var(--copper)';
    document.getElementById('statWeekVal').innerText = stats.w;
    document.getElementById('statMonthVal').innerText = stats.m;
    
    applyLanguage();
    
    document.getElementById('summaryView').classList.remove('hidden');
    document.getElementById('langToggle').classList.remove('hidden'); document.getElementById('infoToggle').classList.remove('hidden');
}

function resetToLobby() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    document.querySelectorAll('.app-container').forEach(el => el.classList.add('hidden')); document.getElementById('lobbyView').classList.remove('hidden');
    document.getElementById('langToggle').classList.remove('hidden'); document.getElementById('infoToggle').classList.remove('hidden');
    document.getElementById('timerDisplay').classList.remove('hidden');
    if(document.getElementById('coachTipBox')) document.getElementById('coachTipBox').classList.add('hidden');
    if(document.getElementById('completionRing')) { document.getElementById('completionRing').classList.add('hidden'); document.getElementById('completionRing').classList.remove('ring-animate'); }
    selectedTime = null; selectedFocus = null; currentState = 'READY'; document.querySelectorAll('.tile').forEach(t => t.classList.remove('active')); document.getElementById('enterBtn').setAttribute('disabled', 'true'); updateTimerUI();
}

function setupEventListeners() {
    document.getElementById('langToggle').addEventListener('click', () => { currentLang = currentLang === 'EN' ? 'SK' : 'EN'; applyLanguage(); if(selectedFocus) updateHintTexts(); });
    document.getElementById('infoToggle').addEventListener('click', (e) => { e.preventDefault(); document.querySelectorAll('.app-container').forEach(el => el.classList.add('hidden')); document.getElementById('onboardingView').classList.remove('hidden'); });
    document.getElementById('btnUnderstand').addEventListener('click', () => { localStorage.setItem('ocheCoach_lastVisit', new Date().getTime().toString()); document.getElementById('onboardingView').classList.add('hidden'); document.getElementById('lobbyView').classList.remove('hidden'); });

    // VÝVOJÁRSKA SKRATKA: Dvojklik na nápis "DURATION" prepína reálny čas / testovací čas (60x)
    const durationTitle = document.getElementById('t_duration');
    if (durationTitle) {
        durationTitle.style.cursor = "pointer";
        durationTitle.addEventListener('dblclick', () => {
            if (TIME_MULTIPLIER === 1) {
                TIME_MULTIPLIER = 60;
                playSystemBeep(1200, 0.1); setTimeout(() => playSystemBeep(1600, 0.1), 120);
                showDevToast("DEV MODE: 60x SPEED");
            } else {
                TIME_MULTIPLIER = 1;
                playSystemBeep(600, 0.2);
                showDevToast("REAL TIME MODE: 1x");
            }
        });
    }

    document.querySelectorAll('.time-tile').forEach(tile => {
        tile.addEventListener('click', function() {
            document.querySelectorAll('.tourney-tile').forEach(t => t.classList.remove('active')); document.querySelectorAll('.time-tile').forEach(t => t.classList.remove('active')); this.classList.add('active');
            selectedTime = parseInt(this.getAttribute('data-val')); const mixTile = document.getElementById('mixTile');
            window.isTourneySeq = false;
            if (selectedTime === 180) { document.querySelectorAll('.focus-tile').forEach(f => f.classList.remove('active')); mixTile.classList.remove('disabled'); mixTile.classList.add('active'); selectedFocus = 'Mix'; } 
            else { mixTile.classList.remove('disabled'); } checkRequirements();
        });
    });

    document.querySelectorAll('.focus-tile').forEach(tile => { tile.addEventListener('click', function() { if (this.classList.contains('disabled')) return; document.querySelectorAll('.tourney-tile').forEach(t => t.classList.remove('active')); document.querySelectorAll('.focus-tile').forEach(f => f.classList.remove('active')); this.classList.add('active'); selectedFocus = this.getAttribute('data-val'); checkRequirements(); }); });

    document.getElementById('warmUpSeqBtn').addEventListener('click', function() { document.querySelectorAll('.tile').forEach(t => t.classList.remove('active')); this.classList.add('active'); selectedTime = 15; selectedFocus = 'Tournament'; window.isTourneySeq = true; checkRequirements(); });

    document.getElementById('enterBtn').addEventListener('click', () => {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        currentActiveGames = gamesDB[selectedFocus]; 
        
        if (selectedTime === 30) currentBlockPlan = [10, 10, 10]; else if (selectedTime === 45) currentBlockPlan = [15, 15, 15]; else if (selectedTime === 60) currentBlockPlan = [20, 20, 20]; else if (selectedTime === 90) currentBlockPlan = [15, 15, 20, 20, 20]; else if (selectedTime === 180) currentBlockPlan = [15, 15, 15, 15, 20, 20, 20, 30, 30]; 
        else if (selectedFocus === 'Tournament') currentBlockPlan = [10, 5]; else currentBlockPlan = [15];
        
        currentBlockIndex = 0;
        currentGameIndex = getSmartGameIndex(currentActiveGames, currentBlockPlan[currentBlockIndex], -1);
        updateHintTexts();
        
        if (window.isTourneySeq) document.getElementById('btnChangeGame').classList.add('hidden');
        else document.getElementById('btnChangeGame').classList.remove('hidden');

        document.getElementById('lobbyView').classList.add('hidden'); document.getElementById('hintView').classList.remove('hidden'); document.getElementById('langToggle').classList.add('hidden'); document.getElementById('infoToggle').classList.add('hidden');
    });

    document.querySelector('.back-trigger').addEventListener('click', () => { document.getElementById('hintView').classList.add('hidden'); document.getElementById('lobbyView').classList.remove('hidden'); document.getElementById('langToggle').classList.remove('hidden'); document.getElementById('infoToggle').classList.remove('hidden'); });
    document.getElementById('btnChangeGame').addEventListener('click', () => { 
        let bm = currentBlockPlan[currentBlockIndex]; let attempts = 0;
        do { 
            currentGameIndex = (currentGameIndex + 1) % currentActiveGames.length; attempts++; 
        } while (attempts < currentActiveGames.length && bm < 20 && (currentActiveGames[currentGameIndex].en_title === "MasterCaller" || currentActiveGames[currentGameIndex].en_title === "Game 201 DO"));
        updateHintTexts(); 
    });

    function getSmartGameIndex(list, blockMins, prevIndex) {
        if (window.isTourneySeq) return currentBlockIndex;
        
        if (prevIndex === -1 || !window.playedSessionGames) {
            window.playedSessionGames = [];
        }
        
        let valid = [];
        for (let i = 0; i < list.length; i++) {
            if (window.playedSessionGames.includes(i)) continue;
            if (blockMins < 20 && (list[i].en_title === "MasterCaller" || list[i].en_title === "Game 201 DO")) continue;
            
            if (selectedFocus === 'Mix') {
                let isWarmupOrSingles = gamesDB['Tournament'].includes(list[i]) || gamesDB['Singles'].includes(list[i]);
                if (currentBlockIndex === 0 && !isWarmupOrSingles) continue;
                if (currentBlockIndex > 0 && gamesDB['Tournament'].includes(list[i])) continue;
            }
            
            valid.push(i);
        }
        
        if (valid.length === 0) {
            window.playedSessionGames = prevIndex !== -1 ? [prevIndex] : [];
            for (let i = 0; i < list.length; i++) {
                if (window.playedSessionGames.includes(i)) continue;
                if (blockMins < 20 && (list[i].en_title === "MasterCaller" || list[i].en_title === "Game 201 DO")) continue;
                
                if (selectedFocus === 'Mix') {
                    let isWarmupOrSingles = gamesDB['Tournament'].includes(list[i]) || gamesDB['Singles'].includes(list[i]);
                    if (currentBlockIndex === 0 && !isWarmupOrSingles) continue;
                    if (currentBlockIndex > 0 && gamesDB['Tournament'].includes(list[i])) continue;
                }
                
                valid.push(i);
            }
        }
        
        if (valid.length === 0) return 0;
        
        let chosen = valid[Math.floor(Math.random() * valid.length)];
        window.playedSessionGames.push(chosen);
        return chosen;
    }

    document.getElementById('hintReadyBtn').addEventListener('click', () => {
        const game = currentActiveGames[currentGameIndex];
        document.getElementById('blockCategory').innerText = selectedFocus.toUpperCase(); document.getElementById('blockTitle').innerText = currentLang === 'EN' ? game.en_title : game.sk_title; document.getElementById('blockShortInstructions').innerText = currentLang === 'EN' ? game.en_short : game.sk_short;
        document.getElementById('hintView').classList.add('hidden'); document.getElementById('timerView').classList.remove('hidden'); document.getElementById('timerDisplay').classList.remove('hidden');
        if(document.getElementById('coachTipBox')) document.getElementById('coachTipBox').classList.add('hidden');
        if(document.getElementById('completionRing')) { document.getElementById('completionRing').classList.add('hidden'); document.getElementById('completionRing').classList.remove('ring-animate'); }
        
        let blockMins = currentBlockPlan[currentBlockIndex]; 
        timeLeft = (blockMins * 60) / TIME_MULTIPLIER; 
        timePassedInBlock = 0;
        
        currentTargets = game.targets || [];
        currentTargetIndex = 0;
        
        const targetDisp = document.getElementById('activeTargetDisplay');
        if (currentTargets.length > 0) {
            let tText = currentTargets[0];
            targetDisp.innerText = tText;
            if(tText.length > 10) targetDisp.style.fontSize = 'clamp(1rem, 7vw, 35px)';
            else if(tText.length > 4) targetDisp.style.fontSize = 'clamp(1.8rem, 12vw, 60px)';
            else targetDisp.style.fontSize = '';
            targetDisp.classList.remove('hidden');
            if (currentTargets.length > 1) {
                let totalSeconds = (blockMins * 60) / TIME_MULTIPLIER;
                targetInterval = totalSeconds / currentTargets.length;
            } else {
                targetInterval = 0;
            }
        } else {
            targetDisp.classList.add('hidden');
            targetInterval = 0;
        }
        
        currentState = 'RUNNING'; startTimer();
    });

    document.getElementById('mainBtn').addEventListener('click', () => {
        if (currentState === 'RUNNING') { clearInterval(timerId); currentState = 'PAUSED'; updateTimerUI(); } 
        else if (currentState === 'PAUSED') { currentState = 'RUNNING'; startTimer(); } 
        else if (currentState === 'FINISHED') {
            currentBlockIndex++;
            if (currentBlockIndex >= currentBlockPlan.length) showSummary();
            else {
                currentGameIndex = getSmartGameIndex(currentActiveGames, currentBlockPlan[currentBlockIndex], currentGameIndex); 
                updateHintTexts();
                document.getElementById('timerView').classList.add('hidden'); document.getElementById('hintView').classList.remove('hidden'); document.getElementById('timerDisplay').classList.remove('hidden');
                if(document.getElementById('coachTipBox')) document.getElementById('coachTipBox').classList.add('hidden');
                if(document.getElementById('completionRing')) { document.getElementById('completionRing').classList.add('hidden'); document.getElementById('completionRing').classList.remove('ring-animate'); }
            }
        }
    });

    document.querySelectorAll('.exit-trigger').forEach(trigger => trigger.addEventListener('click', resetToLobby));
    document.getElementById('btnDone').addEventListener('click', resetToLobby);
}

function checkRequirements() { if (selectedTime && selectedFocus && isDbLoaded) document.getElementById('enterBtn').removeAttribute('disabled'); else document.getElementById('enterBtn').setAttribute('disabled', 'true'); }
function updateHintTexts() { if(currentActiveGames.length === 0 || !currentActiveGames[currentGameIndex]) return; const g = currentActiveGames[currentGameIndex]; document.getElementById('hintCategory').innerText = selectedFocus.toUpperCase(); document.getElementById('hintTitle').innerText = currentLang === 'EN' ? g.en_title : g.sk_title; document.getElementById('hintLongText').innerText = currentLang === 'EN' ? g.en_long : g.sk_long; }

function startTimer() {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
        timeLeft--; timePassedInBlock++;
        
        if (timeLeft > 0 && targetInterval > 0) {
            let expectedIndex = Math.floor(timePassedInBlock / targetInterval);
            if (expectedIndex > currentTargetIndex && expectedIndex < currentTargets.length) {
                currentTargetIndex = expectedIndex;
                let targetDisp = document.getElementById('activeTargetDisplay');
                let tText = currentTargets[currentTargetIndex];
                targetDisp.innerText = tText;
                if(tText.length > 10) targetDisp.style.fontSize = 'clamp(1rem, 7vw, 35px)';
                else if(tText.length > 4) targetDisp.style.fontSize = 'clamp(1.8rem, 12vw, 60px)';
                else targetDisp.style.fontSize = '';
                playSystemBeep(800, 0.15); setTimeout(() => playSystemBeep(800, 0.15), 200);
            }
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerId); timerId = null; timeLeft = 0; currentState = 'ZERO_WAIT'; updateTimerUI();
            bellSound.volume = 1.0; bellSound.play().catch(e => console.log(e));
            setTimeout(() => { 
                if (currentBlockIndex >= currentBlockPlan.length - 1) {
                    showSummary(); 
                } else { 
                    currentState = 'FINISHED'; updateTimerUI(); 
                }
            }, 3000);
        } else updateTimerUI();
    }, 1000);
    updateTimerUI();
}

function updateTimerUI() {
    const disp = document.getElementById('timerDisplay'), tip = document.getElementById('coachTipBox'), ring = document.getElementById('completionRing'), btn = document.getElementById('mainBtn'), targetDisp = document.getElementById('activeTargetDisplay');
    if (!disp) return; 
    let t = TIME_MULTIPLIER !== 1 && currentState !== 'FINISHED' ? timeLeft * TIME_MULTIPLIER : timeLeft;
    disp.innerText = `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;
  
    if (currentState === 'FINISHED') { document.getElementById('blockShortInstructions').classList.add('hidden'); disp.classList.add('hidden'); if(ring) ring.classList.add('hidden'); if(targetDisp) targetDisp.classList.add('hidden'); if(tip) { if(selectedFocus === 'Tournament') tip.classList.add('hidden'); else tip.classList.remove('hidden'); } btn.style.visibility = 'visible'; }
    else if (currentState === 'ZERO_WAIT') { document.getElementById('blockShortInstructions').classList.remove('hidden'); disp.classList.remove('hidden'); if(tip) tip.classList.add('hidden'); if(targetDisp) targetDisp.classList.add('hidden'); if(ring) { ring.classList.remove('hidden'); void ring.offsetWidth; ring.classList.add('ring-animate'); } btn.style.visibility = 'hidden'; } 
    else { document.getElementById('blockShortInstructions').classList.remove('hidden'); disp.classList.remove('hidden'); if(tip) tip.classList.add('hidden'); if(targetDisp && currentTargets.length > 0) targetDisp.classList.remove('hidden'); if(ring) { ring.classList.add('hidden'); ring.classList.remove('ring-animate'); } btn.style.visibility = 'visible'; }
  
    if (timeLeft <= (10 / TIME_MULTIPLIER) && timeLeft > 0) disp.className = timeLeft > (5 / TIME_MULTIPLIER) ? 'timer alert-pulse' : 'timer red-zone'; else disp.className = 'timer';
    if (currentState === 'PAUSED') disp.classList.add('paused'); else disp.classList.remove('paused');
    updateMainBtnText();
}

function loadDatabase() {
    fetch(CSV_URL)
    .then(response => response.text())
    .then(csvText => {
        let rows = parseCSV(csvText);
        for(let i = 1; i < rows.length; i++) {
            let r = rows[i];
            if(r.length < 7 || !r[0]) continue; 
            
            let rawCat = r[0].trim().toUpperCase();
            let cat = "";
            
            if (rawCat === "TOURNAMENT WARM-UP") cat = "Tournament";
            else if (rawCat === "SINGLES") cat = "Singles";
            else if (rawCat === "SCORING") cat = "Scoring";
            else if (rawCat === "DOUBLES") cat = "Doubles";
            else if (rawCat === "CHECKOUTS") cat = "Checkouts";
            else continue; 
            
            let targetsRaw = r.length > 7 && r[7] ? r[7].trim() : "";
            let targetsArr = targetsRaw ? targetsRaw.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
            
            gamesDB[cat].push({
                en_title: r[1].trim(), sk_title: r[2].trim(),
                en_short: r[3].trim(), sk_short: r[4].trim(),
                en_long: r[5].trim(), sk_long: r[6].trim(),
                targets: targetsArr
            });
        }
        
        gamesDB['Mix'] = [].concat(gamesDB['Tournament'], gamesDB['Singles'], gamesDB['Scoring'], gamesDB['Doubles'], gamesDB['Checkouts']);
        isDbLoaded = true;
        checkRequirements(); 
        console.log("OCHE COACH Database successfully loaded from Google Sheets!");
    })
    .catch(err => {
        console.error("Database Load Error:", err);
        alert("Nepodarilo sa načítať tréningy z databázy. Skontroluj internetové pripojenie.");
    });
}

function parseCSV(str) {
    const arr = []; let quote = false;
    for (let row = 0, col = 0, c = 0; c < str.length; c++) {
        let cc = str[c], nc = str[c+1];
        arr[row] = arr[row] || []; arr[row][col] = arr[row][col] || '';
        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
        if (cc == '"') { quote = !quote; continue; }
        if (cc == ',' && !quote) { ++col; continue; }
        if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
        if (cc == '\n' && !quote) { ++row; col = 0; continue; }
        if (cc == '\r' && !quote) { ++row; col = 0; continue; }
        arr[row][col] += cc;
    }
    return arr;
}

loadDatabase();
