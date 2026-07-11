// --- GLOBÁLNE STAVY NA SAMOM ZAČIATKU ---
let currentLang = 'EN';
let currentState = 'READY'; 
let timeLeft = 0;
let timerId = null;
let selectedTime = null;
let selectedFocus = null;
let currentGameIndex = 0;
let currentActiveGames = [];

// --- NOVÉ PREMENNÉ PRE PERIODIZÁCIU A ZVUK ---
let currentBlockPlan = [];
let currentBlockIndex = 0;
let beepInterval = 0;
let timePassedInBlock = 0;

// Audio Context pre systémový píp
let audioCtx = null;

// Zvuk lodného zvona z tvojho repozitára
const bellSound = new Audio("https://raw.githubusercontent.com/dcpoprad/dc-poprad-assets/main/ship-bell-two-chimes-102730%20(1).mp3");

// TESTOVACÍ MÓD (1 = Reálny čas, 60 = 1 sekunda je 1 minúta)
// Pre testovanie nechávam 60, pre reálnu apku neskôr zmeň na 1
const TIME_MULTIPLIER = 60; 

// --- LOKALIZAČNÝ SLOVNÍK ---
const dict = {
    EN: { 
        welcomeTitle: "WELCOME TO OCHE COACH", 
        welcomeText: "This is your coach at the oche. No scorekeeping, no evaluation, no pressure. Just you, the darts, the board, and the flowing time.", 
        btnUnderstand: "GOT IT", 
        duration: "DURATION", 
        focus: "FOCUS", 
        tournament: "TOURNAMENT", 
        btnGoToOche: "GO TO OCHE", 
        back: "BACK", 
        exit: "EXIT", 
        btnChange: "CHANGE", 
        btnGameOn: "GAME ON!", 
        btnPause: "⏸ PAUSE", 
        btnResume: "▶ RESUME", 
        btnNextBlock: "NEXT BLOCK",
        coachTip: "Take a short break between blocks. Switch off your focus, hydrate, and rest your arm. Matches take about 10-20 minutes, so it's important to practice resting and restarting your concentration."
    },
    SK: { 
        welcomeTitle: "VITAJ V OCHE COACH", 
        welcomeText: "Toto je tvoj tréner na čiare. Bez zapisovania, bez hodnotenia, žiaden tlak. Len ty, šípky, terč a plynúci čas.", 
        btnUnderstand: "ROZUMIEM", 
        duration: "TRVANIE", 
        focus: "ZAMERANIE", 
        tournament: "TURNAJ", 
        btnGoToOche: "K TERČU", 
        back: "SPÄŤ", 
        exit: "UKONČIŤ", 
        btnChange: "ZMENIŤ HRU", 
        btnGameOn: "GAME ON!", 
        btnPause: "⏸ PAUZA", 
        btnResume: "▶ POKRAČOVAŤ", 
        btnNextBlock: "ĎALŠÍ BLOK",
        coachTip: "Medzi blokmi si daj krátku pauzu. Vypni sústredenie, napi sa a zves ruky. Zápasy trvajú cca 10-20 minút, preto je dôležité trénovať aj oddych a reštart koncentrácie."
    }
};

// --- TRÉNINGOVÁ DATABÁZA ---
const gamesDB = {
    Singles: [
        { en_title: "Mastering Singles", sk_title: "Základné Single", en_short: "Hit large segments. Doubles/Triples do not count.", sk_short: "Trafuj veľké segmenty. Dable/triple neplatia.", en_long: "Throw 3 darts at each number from 1 to 20. Target the pure single segment.", sk_long: "Hoď 3 šípky na každé číslo od 1 do 20. Cieliš iba čistý single segment." },
        { en_title: "Big 20s", sk_title: "Veľké 20", en_short: "Rhythm on single 20.", sk_short: "Rytmus na čistú 20.", en_long: "Focus entirely on the big single 20. Build your throwing rhythm and stance.", sk_long: "Zameraj sa čisto na veľkú 20. Buduj plynulý rytmus a postoj." }
    ],
    Scoring: [
        { en_title: "100 Darts at T20", sk_title: "100 Šípok na T20", en_short: "Keep the rhythm and group tight.", sk_short: "Udržuj rytmus a tesnú skupinu.", en_long: "Throw exactly 100 darts exclusively at T20. Focus on your stance and follow-through.", sk_long: "Hoď 100 šípok výhradne na T20. Zameraj sa na postoj a náprah." },
        { en_title: "Switch 19/20", sk_title: "Prechod 19/20", en_short: "Alternate T20 and T19.", sk_short: "Striedaj T20 a T19.", en_long: "Throw 3 darts at T20, then 3 at T19. Keep transitioning smoothly.", sk_long: "Hoď 3 šípky na T20, potom 3 na T19. Udržuj plynulý prechod." }
    ],
    Doubles: [
        { en_title: "Around the Clock", sk_title: "Dokola terča", en_short: "Finish chronologically.", sk_short: "Zatváraj dablom chronologicky.", en_long: "Start at D1. You cannot progress until you hit the double. Finish with Bull.", sk_long: "Začni na D1. Kým netrafíš, nepostupuješ. Končíš stredom." }
    ],
    Checkouts: [
        { en_title: "60-80 Practice", sk_title: "Tréning 60-80", en_short: "3 darts per leg. Drop on miss.", sk_short: "3 šípky. Neúspech ťa posunie nadol.", en_long: "Start at 60. 3 darts in hand. Hit to move up 1 point, miss to drop 1 point.", sk_long: "Začni na 60. Máš 3 šípky. Ak zatvoríš, ideš o bod hore, inak klesáš." }
    ],
    Mix: [
        { en_title: "Ultimate Decider", sk_title: "Finálny Decider", en_short: "Scoring under pressure.", sk_short: "Skórovanie pod tlakom.", en_long: "Combine heavy scoring on T20 with random checkout transitions.", sk_long: "Kombinuj tlak na T20 a náhodné zatváracie prechody." }
    ],
    Tournament: [
        { en_title: "Pre-Match Flow", sk_title: "Predzápasový Rytmus", en_short: "5m Scoring, 5m Doubles, 5m Finishes", sk_short: "5m Skóre, 5m Dable, 5m Zatváranie", en_long: "A fast 15-minute complete warm-up sequence to get you match-ready.", sk_long: "Rýchly 15-minútový kompletný tréning pred zápasom na zahriatie." }
    ]
};

// --- INICIALIZÁCIA ---
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage();
    checkOnboarding();
    setupEventListeners();
});

function applyLanguage() {
    document.getElementById('t_welcomeTitle').innerText = dict[currentLang].welcomeTitle;
    document.getElementById('t_welcomeText').innerText = dict[currentLang].welcomeText;
    document.getElementById('btnUnderstand').innerText = dict[currentLang].btnUnderstand;
    document.getElementById('t_duration').innerText = dict[currentLang].duration;
    document.getElementById('t_focus').innerText = dict[currentLang].focus;
    document.getElementById('t_tournament').innerText = dict[currentLang].tournament;
    document.getElementById('enterBtn').innerText = dict[currentLang].btnGoToOche;
    document.getElementById('t_back').innerText = dict[currentLang].back;
    document.getElementById('t_exit').innerText = dict[currentLang].exit;
    document.getElementById('btnChangeGame').innerText = dict[currentLang].btnChange;
    document.getElementById('hintReadyBtn').innerText = dict[currentLang].btnGameOn;
    
    // Doplnený preklad pre tip
    const tipEl = document.getElementById('t_coachTipText');
    if(tipEl) tipEl.innerText = dict[currentLang].coachTip;

    updateMainBtnText();
}

function updateMainBtnText() {
    const mainBtn = document.getElementById('mainBtn');
    if (!mainBtn) return;
    if (currentState === 'PAUSED') mainBtn.innerText = dict[currentLang].btnResume;
    else if (currentState === 'RUNNING') mainBtn.innerText = dict[currentLang].btnPause;
    else if (currentState === 'FINISHED') mainBtn.innerText = dict[currentLang].btnNextBlock;
    else mainBtn.innerText = dict[currentLang].btnPause;
}

function checkOnboarding() {
    const LAST_VISIT_KEY = 'ocheCoach_lastVisit';
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const now = new Date().getTime();

    if (!lastVisit || (now - parseInt(lastVisit) > THIRTY_DAYS)) {
        document.getElementById('onboardingView').classList.remove('hidden');
    } else {
        document.getElementById('lobbyView').classList.remove('hidden');
    }
}

// --- ZVUKOVÉ FUNKCIE (Web Audio API) ---
function playSystemBeep() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const playOscillator = (startTime, freq, type, duration) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Hlasitosť
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    // Dvojitý športový píp (frekvencia 800Hz)
    playOscillator(now, 800, 'sine', 0.15);
    playOscillator(now + 0.2, 800, 'sine', 0.15);
}

// --- LOGICKÝ FLOW & EVENT LISTENERY ---
function setupEventListeners() {
    // Prepínanie jazyka
    document.getElementById('langToggle').addEventListener('click', () => {
        currentLang = currentLang === 'EN' ? 'SK' : 'EN';
        applyLanguage();
        if (selectedFocus) updateHintTexts();
    });

    // Otvorenie návodu
    document.getElementById('infoToggle').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('lobbyView').classList.add('hidden');
        document.getElementById('hintView').classList.add('hidden');
        document.getElementById('timerView').classList.add('hidden');
        document.getElementById('onboardingView').classList.remove('hidden');
    });

    // Zatvorenie návodu
    document.getElementById('btnUnderstand').addEventListener('click', () => {
        localStorage.setItem('ocheCoach_lastVisit', new Date().getTime().toString());
        document.getElementById('onboardingView').classList.add('hidden');
        document.getElementById('lobbyView').classList.remove('hidden');
    });

    // Výber dĺžky trvania
    document.querySelectorAll('.time-tile').forEach(tile => {
        tile.addEventListener('click', function() {
            document.getElementById('warmUpBtn').classList.remove('active');
            document.querySelectorAll('.time-tile').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            selectedTime = parseInt(this.getAttribute('data-val'));

            if (selectedTime === 180) {
                document.querySelectorAll('.focus-tile').forEach(f => f.classList.remove('active'));
                const mixTile = document.getElementById('mixTile');
                mixTile.classList.remove('disabled');
                mixTile.classList.add('active');
                selectedFocus = 'Mix';
            } else if (selectedTime === 30 || selectedTime === 45) {
                const mixTile = document.getElementById('mixTile');
                mixTile.classList.add('disabled');
                if (selectedFocus === 'Mix') {
                    selectedFocus = null;
                    mixTile.classList.remove('active');
                }
            } else {
                document.getElementById('mixTile').classList.remove('disabled');
            }
            checkRequirements();
        });
    });

    // Výber zamerania
    document.querySelectorAll('.focus-tile').forEach(tile => {
        tile.addEventListener('click', function() {
            if (this.classList.contains('disabled')) return;
            document.getElementById('warmUpBtn').classList.remove('active');
            document.querySelectorAll('.focus-tile').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            selectedFocus = this.getAttribute('data-val');
            checkRequirements();
        });
    });

    // Výber turnajového zahriatia
    document.getElementById('warmUpBtn').addEventListener('click', function() {
        document.querySelectorAll('.tile').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        selectedTime = 15;
        selectedFocus = 'Tournament';
        checkRequirements();
    });

    // GO TO OCHE / K TERČU (Vytvorenie plánu)
    document.getElementById('enterBtn').addEventListener('click', () => {
        // Zabezpečenie Audio Contextu pri prvom kliku
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        currentActiveGames = gamesDB[selectedFocus];
        currentGameIndex = Math.floor(Math.random() * currentActiveGames.length);
        
        // Vytvorenie plánu periodizácie
        if (selectedTime === 30) currentBlockPlan = [10, 10, 10];
        else if (selectedTime === 45) currentBlockPlan = [15, 15, 15];
        else if (selectedTime === 60) currentBlockPlan = [20, 20, 20];
        else if (selectedTime === 90) currentBlockPlan = [15, 15, 20, 20, 20];
        else if (selectedTime === 180) currentBlockPlan = [15, 15, 15, 15, 20, 20, 20, 30, 30];
        else if (selectedTime === 15) currentBlockPlan = [15];
        
        currentBlockIndex = 0;

        updateHintTexts();
        document.getElementById('lobbyView').classList.add('hidden');
        document.getElementById('hintView').classList.remove('hidden');
        
        document.getElementById('langToggle').classList.add('hidden');
        document.getElementById('infoToggle').classList.add('hidden');
    });

    // Tlačidlo BACK z Hint obrazovky
    document.querySelector('.back-trigger').addEventListener('click', () => {
        document.getElementById('hintView').classList.add('hidden');
        document.getElementById('lobbyView').classList.remove('hidden');
        
        document.getElementById('langToggle').classList.remove('hidden');
        document.getElementById('infoToggle').classList.remove('hidden');
    });

    // Tlačidlo CHANGE
    document.getElementById('btnChangeGame').addEventListener('click', () => {
        currentGameIndex = (currentGameIndex + 1) % currentActiveGames.length;
        updateHintTexts();
    });

    // GAME ON! (Štart bloku)
    document.getElementById('hintReadyBtn').addEventListener('click', () => {
        const game = currentActiveGames[currentGameIndex];
        document.getElementById('blockCategory').innerText = selectedFocus.toUpperCase();
        document.getElementById('blockTitle').innerText = currentLang === 'EN' ? game.en_title : game.sk_title;
        document.getElementById('blockShortInstructions').innerText = currentLang === 'EN' ? game.en_short : game.sk_short;

        document.getElementById('hintView').classList.add('hidden');
        document.getElementById('timerView').classList.remove('hidden');
        
        // Reset zobrazenia (schováme tip ak tam ostal z minula)
        document.getElementById('timerDisplay').classList.remove('hidden');
        const coachTipBox = document.getElementById('coachTipBox');
        if(coachTipBox) coachTipBox.classList.add('hidden');
        
        // Nastavenie času a intervalu pípania
        let blockMinutes = currentBlockPlan[currentBlockIndex];
        timeLeft = (blockMinutes * 60) / TIME_MULTIPLIER; // Rýchly test alebo realita
        timePassedInBlock = 0;

        if (blockMinutes === 10) beepInterval = (2 * 60) / TIME_MULTIPLIER;
        else if (blockMinutes === 15 || blockMinutes === 20) beepInterval = (5 * 60) / TIME_MULTIPLIER;
        else if (blockMinutes === 30) beepInterval = (10 * 60) / TIME_MULTIPLIER;
        
        currentState = 'RUNNING';
        startTimer();
    });

    // Hlavné ovládacie tlačidlo
    document.getElementById('mainBtn').addEventListener('click', () => {
        if (currentState === 'RUNNING') {
            clearInterval(timerId);
            currentState = 'PAUSED';
            updateTimerUI();
        } else if (currentState === 'PAUSED') {
            currentState = 'RUNNING';
            startTimer();
        } else if (currentState === 'FINISHED') {
            // Logika pre tlačidlo NEXT BLOCK
            currentBlockIndex++;
            
            if (currentBlockIndex >= currentBlockPlan.length) {
                // Koniec celého tréningu
                document.querySelector('#timerView .exit-trigger').click();
            } else {
                // Vyber novú hru a choď na Hint obrazovku
                currentGameIndex = Math.floor(Math.random() * currentActiveGames.length);
                updateHintTexts();
                
                document.getElementById('timerView').classList.add('hidden');
                document.getElementById('hintView').classList.remove('hidden');
                
                document.getElementById('timerDisplay').classList.remove('hidden');
                const coachTipBox = document.getElementById('coachTipBox');
                if(coachTipBox) coachTipBox.classList.add('hidden');
            }
        }
    });

    // Globálny Reset (EXIT)
    document.querySelectorAll('.exit-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            if (timerId) { clearInterval(timerId); timerId = null; }
            document.getElementById('timerView').classList.add('hidden');
            document.getElementById('hintView').classList.add('hidden');
            document.getElementById('lobbyView').classList.remove('hidden');
            
            document.getElementById('langToggle').classList.remove('hidden');
            document.getElementById('infoToggle').classList.remove('hidden');
            
            document.getElementById('timerDisplay').classList.remove('hidden');
            const coachTipBox = document.getElementById('coachTipBox');
            if(coachTipBox) coachTipBox.classList.add('hidden');
            
            selectedTime = null;
            selectedFocus = null;
            currentState = 'READY';
            document.querySelectorAll('.tile').forEach(t => t.classList.remove('active'));
            document.getElementById('enterBtn').setAttribute('disabled', 'true');
            updateTimerUI();
        });
    });
}

function checkRequirements() {
    if (selectedTime && selectedFocus) {
        document.getElementById('enterBtn').removeAttribute('disabled');
    } else {
        document.getElementById('enterBtn').setAttribute('disabled', 'true');
    }
}

function updateHintTexts() {
    const game = currentActiveGames[currentGameIndex];
    document.getElementById('hintCategory').innerText = selectedFocus.toUpperCase();
    document.getElementById('hintTitle').innerText = currentLang === 'EN' ? game.en_title : game.sk_title;
    document.getElementById('hintLongText').innerText = currentLang === 'EN' ? game.en_long : game.sk_long;
}

function startTimer() {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
        timeLeft--;
        timePassedInBlock++;

        // Systémový píp počas bloku
        if (timeLeft > 0 && beepInterval > 0 && timePassedInBlock % beepInterval === 0) {
            playSystemBeep();
        }

        if (timeLeft <= 0) {
            clearInterval(timerId);
            timerId = null;
            timeLeft = 0;
            currentState = 'ZERO_WAIT';
            updateTimerUI();
            
            // Koniec - zvuk zvona
            bellSound.play().catch(e => console.log("Audio play blocked by browser", e));
            
            // 3 sekundy čakanie
            setTimeout(() => {
                if (selectedFocus === 'Tournament') {
                    // WarmUp končí potichu
                    document.querySelector('#timerView .exit-trigger').click();
                } else {
                    // Normálny tréning ukáže Tip a čaká
                    currentState = 'FINISHED';
                    updateTimerUI();
                }
            }, 3000);
        } else {
            updateTimerUI();
        }
    }, 1000);
    updateTimerUI();
}

function updateTimerUI() {
    const timerDisplay = document.getElementById('timerDisplay');
    const coachTipBox = document.getElementById('coachTipBox');
    const mainBtn = document.getElementById('mainBtn');
    if (!timerDisplay) return;
    
    // Zobrazenie času (aj pri zrýchlenom teste ukazujeme minúty)
    let displayTime = timeLeft;
    if (TIME_MULTIPLIER !== 1 && currentState !== 'FINISHED') {
        displayTime = timeLeft * 60; // Fiktívny vizuál pre testovanie
    }
    
    let m = Math.floor(displayTime / 60).toString().padStart(2, '0');
    let s = (displayTime % 60).toString().padStart(2, '0');
    timerDisplay.innerText = `${m}:${s}`;
    
    // Logika zobrazenia
    if (currentState === 'FINISHED') {
        timerDisplay.classList.add('hidden');
        if(coachTipBox) coachTipBox.classList.remove('hidden');
        mainBtn.style.display = 'block';
    } else if (currentState === 'ZERO_WAIT') {
        timerDisplay.classList.remove('hidden');
        if(coachTipBox) coachTipBox.classList.add('hidden');
        // Skryjeme tlačidlo počas 3 sekundového čakania
        mainBtn.style.display = 'none'; 
    } else {
        timerDisplay.classList.remove('hidden');
        if(coachTipBox) coachTipBox.classList.add('hidden');
        mainBtn.style.display = 'block';
    }
    
    const RED_ZONE = 10;
    if (timeLeft <= RED_ZONE && timeLeft > 0) {
        if (timeLeft > RED_ZONE - 5) {
            timerDisplay.classList.add('alert-pulse');
            timerDisplay.classList.remove('red-zone');
        } else {
            timerDisplay.classList.remove('alert-pulse');
            timerDisplay.classList.add('red-zone');
        }
    } else {
        timerDisplay.classList.remove('red-zone', 'alert-pulse');
    }
    
    if (currentState === 'PAUSED') timerDisplay.classList.add('paused');
    else timerDisplay.classList.remove('paused');
    
    updateMainBtnText();
}