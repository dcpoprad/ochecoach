let currentLang = 'EN', currentState = 'READY', timeLeft = 0, timerId = null, selectedTime = null, selectedFocus = null, currentGameIndex = 0, currentActiveGames = [];
let currentBlockPlan = [], currentBlockIndex = 0, beepInterval = 0, timePassedInBlock = 0, audioCtx = null;
const bellSound = new Audio("https://raw.githubusercontent.com/dcpoprad/dc-poprad-assets/main/ship-bell-two-chimes-102730%20(1).mp3");
const TIME_MULTIPLIER = 60; // 1 = Real time, 60 = Test mode

const dict = {
    EN: { welcomeTitle: "WELCOME TO OCHE COACH", welcomeText: "This is your pure, zen training tool. No counting, no scoring, no pressure. Just you, the board, and the time flowing.", btnUnderstand: "GOT IT", duration: "DURATION", focus: "FOCUS", tournament: "TOURNAMENT", btnGoToOche: "GO TO OCHE", back: "BACK", exit: "EXIT", btnChange: "CHANGE", btnGameOn: "GAME ON!", btnPause: "|| PAUSE", btnResume: "► RESUME", btnNextBlock: "NEXT BLOCK", btnDone: "DONE", coachTip: "Take a short break between blocks. Switch off your focus, hydrate, and rest your arm. Matches take about 10-20 minutes, so it's important to practice resting and restarting your concentration.", summaryTitle: "SESSION COMPLETE", ultimateTitle: "ULTIMATE SURVIVOR", summaryQuote: "\"You are on a great path. All this practice will pay off 100% in your tournaments and matches. Maybe not tomorrow, maybe not next week, but it will absolutely come.\"", statsWeek: "This week", statsMonth: "This month" },
    SK: { welcomeTitle: "VITAJ V OCHE COACH", welcomeText: "Toto je tvoj tréner na čiare. Bez zapisovania, bez hodnotenia, žiaden tlak. Len ty, šípky, terč a plynúci čas.", btnUnderstand: "GOT IT", duration: "DURATION", focus: "FOCUS", tournament: "TOURNAMENT", btnGoToOche: "GO TO OCHE", back: "BACK", exit: "EXIT", btnChange: "CHANGE", btnGameOn: "GAME ON!", btnPause: "|| PAUSE", btnResume: "► RESUME", btnNextBlock: "NEXT BLOCK", btnDone: "DONE", coachTip: "Medzi blokmi si daj krátku pauzu. Vypni sústredenie, napi sa a zves ruky. Zápasy trvajú cca 10-20 minút, preto je dôležité trénovať aj oddych a reštart koncentrácie.", summaryTitle: "TRÉNING UKONČENÝ", ultimateTitle: "ULTIMATE SURVIVOR", summaryQuote: "\"Si na skvelej ceste. Všetok tento tréning sa ti 100% vráti v turnajoch a zápasoch. Možno nie zajtra, ani o týždeň, ale určite to príde.\"", statsWeek: "Tento týždeň", statsMonth: "Tento mesiac" }
};

const gamesDB = {
    Singles: [ { en_title: "Mastering Singles", sk_title: "Základné Single", en_short: "Hit large segments. Doubles/Triples do not count.", sk_short: "Trafuj veľké segmenty. Dable/triple neplatia.", en_long: "Throw 3 darts at each number from 1 to 20. Target the pure single segment.", sk_long: "Hoď 3 šípky na každé číslo od 1 do 20. Cieliš iba čistý single segment." }, { en_title: "Big 20s", sk_title: "Veľké 20", en_short: "Rhythm on single 20.", sk_short: "Rytmus na čistú 20.", en_long: "Focus entirely on the big single 20. Build your throwing rhythm and stance.", sk_long: "Zameraj sa čisto na veľkú 20. Buduj plynulý rytmus a postoj." } ],
    Scoring: [ { en_title: "100 Darts at T20", sk_title: "100 Šípok na T20", en_short: "Keep the rhythm and group tight.", sk_short: "Udržuj rytmus a tesnú skupinu.", en_long: "Throw exactly 100 darts exclusively at T20. Focus on your stance and follow-through.", sk_long: "Hoď 100 šípok výhradne na T20. Zameraj sa na postoj a náprah." }, { en_title: "Switch 19/20", sk_title: "Prechod 19/20", en_short: "Alternate T20 and T19.", sk_short: "Striedaj T20 a T19.", en_long: "Throw 3 darts at T20, then 3 at T19. Keep transitioning smoothly.", sk_long: "Hoď 3 šípky na T20, potom 3 na T19. Udržuj plynulý prechod." } ],
    Doubles: [{ en_title: "Around the Clock", sk_title: "Dokola terča", en_short: "Finish chronologically.", sk_short: "Zatváraj dablom chronologicky.", en_long: "Start at D1. You cannot progress until you hit the double. Finish with Bull.", sk_long: "Začni na D1. Kým netrafíš, nepostupuješ. Končíš stredom." }],
    Checkouts: [{ en_title: "60-80 Practice", sk_title: "Tréning 60-80", en_short: "3 darts per leg. Drop on miss.", sk_short: "3 šípky. Neúspech ťa posunie nadol.", en_long: "Start at 60. 3 darts in hand. Hit to move up 1 point, miss to drop 1 point.", sk_long: "Začni na 60. Máš 3 šípky. Ak zatvoríš, ideš o bod hore, inak klesáš." }],
    Mix: [{ en_title: "Ultimate Decider", sk_title: "Finálny Decider", en_short: "Scoring under pressure.", sk_short: "Skórovanie pod tlakom.", en_long: "Combine heavy scoring on T20 with random checkout transitions.", sk_long: "Kombinuj tlak na T20 a náhodné zatváracie prechody." }],
    Tournament: [{ en_title: "Pre-Match Flow", sk_title: "Predzápasový Rytmus", en_short: "5m Scoring, 5m Doubles, 5m Finishes", sk_short: "5m Skóre, 5m Dable, 5m Zatváranie", en_long: "A fast 15-minute complete warm-up sequence to get you match-ready.", sk_long: "Rýchly 15-minútový kompletný tréning pred zápasom na zahriatie." }]
};

document.addEventListener('DOMContentLoaded', () => { applyLanguage(); checkOnboarding(); setupEventListeners(); });

function applyLanguage() {
    document.getElementById('t_welcomeTitle').innerText = dict[currentLang].welcomeTitle; document.getElementById('t_welcomeText').innerText = dict[currentLang].welcomeText;
    document.getElementById('btnUnderstand').innerText = dict[currentLang].btnUnderstand; document.getElementById('t_duration').innerText = dict[currentLang].duration;
    document.getElementById('t_focus').innerText = dict[currentLang].focus; document.getElementById('t_tournament').innerText = dict[currentLang].tournament;
    document.getElementById('enterBtn').innerText = dict[currentLang].btnGoToOche; document.getElementById('t_back').innerText = dict[currentLang].back;
    document.getElementById('t_exit').innerText = dict[currentLang].exit; document.getElementById('btnChangeGame').innerText = dict[currentLang].btnChange;
    document.getElementById('hintReadyBtn').innerText = dict[currentLang].btnGameOn;
    if(document.getElementById('t_coachTipText')) document.getElementById('t_coachTipText').innerText = dict[currentLang].coachTip;
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

function playSystemBeep() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playOscillator = (startTime, freq, duration) => {
        const osc = audioCtx.createOscillator(), gainNode = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gainNode); gainNode.connect(audioCtx.destination); osc.start(startTime); osc.stop(startTime + duration);
    };
    playOscillator(audioCtx.currentTime, 800, 0.15); playOscillator(audioCtx.currentTime + 0.2, 800, 0.15);
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
    
    document.getElementById('t_summaryTitle').innerText = isUlt ? dict[currentLang].ultimateTitle : dict[currentLang].summaryTitle;
    document.getElementById('t_summaryTitle').style.color = isUlt ? 'var(--gold)' : 'var(--copper)';
    
    let dynText = currentLang === 'EN' ? `Great ${selectedTime}-minute session focused on ${selectedFocus.toUpperCase()}!` : `Skvelá ${selectedTime}-minútovka zameraná na ${selectedFocus.toUpperCase()}!`;
    if (isUlt) dynText = currentLang === 'EN' ? "Brutal! You survived the ULTIMATE training!" : "Brutálne! Zvládol si ULTIMATE tréning!";
    if (selectedFocus === 'Tournament') dynText = currentLang === 'EN' ? "Great Warm-Up! You are match-ready." : "Skvelé rozohriatie! Si pripravený na zápas.";
    
    document.getElementById('summaryDynamicText').innerText = dynText;
    document.getElementById('t_summaryQuote').innerText = dict[currentLang].summaryQuote;
    document.getElementById('statWeekVal').innerText = stats.w;
    document.getElementById('statMonthVal').innerText = stats.m;
    document.getElementById('t_statsWeek').innerText = dict[currentLang].statsWeek + ":";
    document.getElementById('t_statsMonth').innerText = dict[currentLang].statsMonth + ":";
    document.getElementById('btnDone').innerText = dict[currentLang].btnDone;
    
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

    document.querySelectorAll('.time-tile').forEach(tile => {
        tile.addEventListener('click', function() {
            document.getElementById('warmUpBtn').classList.remove('active'); document.querySelectorAll('.time-tile').forEach(t => t.classList.remove('active')); this.classList.add('active');
            selectedTime = parseInt(this.getAttribute('data-val')); const mixTile = document.getElementById('mixTile');
            if (selectedTime === 180) { document.querySelectorAll('.focus-tile').forEach(f => f.classList.remove('active')); mixTile.classList.remove('disabled'); mixTile.classList.add('active'); selectedFocus = 'Mix'; } 
            else if (selectedTime === 30 || selectedTime === 45) { mixTile.classList.add('disabled'); if (selectedFocus === 'Mix') { selectedFocus = null; mixTile.classList.remove('active'); } } 
            else mixTile.classList.remove('disabled'); checkRequirements();
        });
    });

    document.querySelectorAll('.focus-tile').forEach(tile => { tile.addEventListener('click', function() { if (this.classList.contains('disabled')) return; document.getElementById('warmUpBtn').classList.remove('active'); document.querySelectorAll('.focus-tile').forEach(f => f.classList.remove('active')); this.classList.add('active'); selectedFocus = this.getAttribute('data-val'); checkRequirements(); }); });
    document.getElementById('warmUpBtn').addEventListener('click', function() { document.querySelectorAll('.tile').forEach(t => t.classList.remove('active')); this.classList.add('active'); selectedTime = 15; selectedFocus = 'Tournament'; checkRequirements(); });

    document.getElementById('enterBtn').addEventListener('click', () => {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        currentActiveGames = gamesDB[selectedFocus]; currentGameIndex = Math.floor(Math.random() * currentActiveGames.length);
        if (selectedTime === 30) currentBlockPlan = [10, 10, 10]; else if (selectedTime === 45) currentBlockPlan = [15, 15, 15]; else if (selectedTime === 60) currentBlockPlan = [20, 20, 20]; else if (selectedTime === 90) currentBlockPlan = [15, 15, 20, 20, 20]; else if (selectedTime === 180) currentBlockPlan = [15, 15, 15, 15, 20, 20, 20, 30, 30]; else currentBlockPlan = [15];
        currentBlockIndex = 0; updateHintTexts();
        document.getElementById('lobbyView').classList.add('hidden'); document.getElementById('hintView').classList.remove('hidden'); document.getElementById('langToggle').classList.add('hidden'); document.getElementById('infoToggle').classList.add('hidden');
    });

    document.querySelector('.back-trigger').addEventListener('click', () => { document.getElementById('hintView').classList.add('hidden'); document.getElementById('lobbyView').classList.remove('hidden'); document.getElementById('langToggle').classList.remove('hidden'); document.getElementById('infoToggle').classList.remove('hidden'); });
    document.getElementById('btnChangeGame').addEventListener('click', () => { currentGameIndex = (currentGameIndex + 1) % currentActiveGames.length; updateHintTexts(); });

    document.getElementById('hintReadyBtn').addEventListener('click', () => {
        const game = currentActiveGames[currentGameIndex];
        document.getElementById('blockCategory').innerText = selectedFocus.toUpperCase(); document.getElementById('blockTitle').innerText = currentLang === 'EN' ? game.en_title : game.sk_title; document.getElementById('blockShortInstructions').innerText = currentLang === 'EN' ? game.en_short : game.sk_short;
        document.getElementById('hintView').classList.add('hidden'); document.getElementById('timerView').classList.remove('hidden'); document.getElementById('timerDisplay').classList.remove('hidden');
        if(document.getElementById('coachTipBox')) document.getElementById('coachTipBox').classList.add('hidden');
        if(document.getElementById('completionRing')) { document.getElementById('completionRing').classList.add('hidden'); document.getElementById('completionRing').classList.remove('ring-animate'); }
        let blockMins = currentBlockPlan[currentBlockIndex]; timeLeft = (blockMins * 60) / TIME_MULTIPLIER; timePassedInBlock = 0;
        if (blockMins === 10) beepInterval = (2 * 60) / TIME_MULTIPLIER; else if (blockMins === 15 || blockMins === 20) beepInterval = (5 * 60) / TIME_MULTIPLIER; else if (blockMins === 30) beepInterval = (10 * 60) / TIME_MULTIPLIER;
        currentState = 'RUNNING'; startTimer();
    });

    document.getElementById('mainBtn').addEventListener('click', () => {
        if (currentState === 'RUNNING') { clearInterval(timerId); currentState = 'PAUSED'; updateTimerUI(); } 
        else if (currentState === 'PAUSED') { currentState = 'RUNNING'; startTimer(); } 
        else if (currentState === 'FINISHED') {
            currentBlockIndex++;
            if (currentBlockIndex >= currentBlockPlan.length) showSummary();
            else {
                currentGameIndex = Math.floor(Math.random() * currentActiveGames.length); updateHintTexts();
                document.getElementById('timerView').classList.add('hidden'); document.getElementById('hintView').classList.remove('hidden'); document.getElementById('timerDisplay').classList.remove('hidden');
                if(document.getElementById('coachTipBox')) document.getElementById('coachTipBox').classList.add('hidden');
                if(document.getElementById('completionRing')) { document.getElementById('completionRing').classList.add('hidden'); document.getElementById('completionRing').classList.remove('ring-animate'); }
            }
        }
    });

    document.querySelectorAll('.exit-trigger').forEach(trigger => trigger.addEventListener('click', resetToLobby));
    document.getElementById('btnDone').addEventListener('click', resetToLobby);
}

function checkRequirements() { if (selectedTime && selectedFocus) document.getElementById('enterBtn').removeAttribute('disabled'); else document.getElementById('enterBtn').setAttribute('disabled', 'true'); }
function updateHintTexts() { const g = currentActiveGames[currentGameIndex]; document.getElementById('hintCategory').innerText = selectedFocus.toUpperCase(); document.getElementById('hintTitle').innerText = currentLang === 'EN' ? g.en_title : g.sk_title; document.getElementById('hintLongText').innerText = currentLang === 'EN' ? g.en_long : g.sk_long; }

function startTimer() {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
        timeLeft--; timePassedInBlock++;
        if (timeLeft > 0 && beepInterval > 0 && timePassedInBlock % beepInterval === 0) playSystemBeep();
        if (timeLeft <= 0) {
            clearInterval(timerId); timerId = null; timeLeft = 0; currentState = 'ZERO_WAIT'; updateTimerUI();
            bellSound.volume = 1.0; bellSound.play().catch(e => console.log(e));
            setTimeout(() => { if (selectedFocus === 'Tournament') showSummary(); else { currentState = 'FINISHED'; updateTimerUI(); } }, 3000);
        } else updateTimerUI();
    }, 1000);
    updateTimerUI();
}

function updateTimerUI() {
    const disp = document.getElementById('timerDisplay'), tip = document.getElementById('coachTipBox'), ring = document.getElementById('completionRing'), btn = document.getElementById('mainBtn');
    if (!disp) return; let t = TIME_MULTIPLIER !== 1 && currentState !== 'FINISHED' ? timeLeft * 60 : timeLeft;
    disp.innerText = `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;
    if (currentState === 'FINISHED') { disp.classList.add('hidden'); if(ring) ring.classList.add('hidden'); if(tip) tip.classList.remove('hidden'); btn.style.display = 'block'; } 
    else if (currentState === 'ZERO_WAIT') { disp.classList.remove('hidden'); if(tip) tip.classList.add('hidden'); if(ring) { ring.classList.remove('hidden'); void ring.offsetWidth; ring.classList.add('ring-animate'); } btn.style.display = 'none'; } 
    else { disp.classList.remove('hidden'); if(tip) tip.classList.add('hidden'); if(ring) { ring.classList.add('hidden'); ring.classList.remove('ring-animate'); } btn.style.display = 'block'; }
    if (timeLeft <= 10 && timeLeft > 0) disp.className = timeLeft > 5 ? 'timer alert-pulse' : 'timer red-zone'; else disp.className = 'timer';
    if (currentState === 'PAUSED') disp.classList.add('paused'); else disp.classList.remove('paused');
    updateMainBtnText();
}
