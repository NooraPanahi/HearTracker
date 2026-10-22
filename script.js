const audioFile = document.getElementById("audioFile");
const audioPlayer = document.getElementById("audioPlayer");

const fileName = document.getElementById("fileName");
const audioStatus = document.getElementById("audioStatus");
const timerDisplay = document.getElementById("timer");
const result = document.getElementById("result");

const startButton = document.getElementById("startButton");
const lapButton = document.getElementById("lapButton");
const stopButton = document.getElementById("stopButton");
const resumeButton = document.getElementById("resumeButton");
const resetButton = document.getElementById("resetButton");

const lapTableBody = document.getElementById("lapTableBody");

let audioURL = null;

let startTime = null;
let elapsedMs = 0;
let timerInterval = null;

let isRunning = false;
let hasStarted = false;
let lastLapMs = 0;


function formatTime(milliseconds) {
    const totalMs = Math.floor(milliseconds);
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;

    return (
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0") + "." +
        String(ms).padStart(3, "0")
    );
}

function getCurrentElapsed() {
    if (isRunning && startTime !== null) {
        return elapsedMs + (performance.now() - startTime);
    }
    return elapsedMs;
}

function updateTimer() {
    timerDisplay.textContent = formatTime(getCurrentElapsed());
}

function setRunningButtons() {
    startButton.disabled = true;
    lapButton.disabled = false;
    stopButton.disabled = false;
    resumeButton.disabled = true;
    resetButton.disabled = true;
}

audioFile.addEventListener("change", () => {
    const file = audioFile.files[0];

    if (!file) {
        return;
    }

    clearInterval(timerInterval);
    timerInterval = null;

    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    audioPlayer.load();

    if (audioURL) {
        URL.revokeObjectURL(audioURL);
        audioURL = null;
    }

    isRunning = false;
    hasStarted = false;
    startTime = null;
    elapsedMs = 0;
    lastLapMs = 0;

    timerDisplay.textContent = "00:00.000";
    result.textContent = "هنوز آزمایشی انجام نشده است.";
    lapTableBody.replaceChildren();

    startButton.disabled = true;
    lapButton.disabled = true;
    stopButton.disabled = true;
    resumeButton.disabled = true;
    resetButton.disabled = true;

    const isMp3 = file.type === "audio/mpeg" || file.name.toLowerCase().endsWith(".mp3");

    if (!isMp3) {
        fileName.textContent = "لطفاً یک فایل MP3 انتخاب کنید.";
        audioStatus.textContent = "فرمت فایل پذیرفته نیست.";
        audioFile.value = "";
        return;
    }

    fileName.textContent = `فایل انتخاب‌شده: ${file.name}`;

    audioURL = URL.createObjectURL(file);

    audioPlayer.src = audioURL;
    audioPlayer.load();

    audioStatus.textContent = "در حال بررسی فایل...";
});

audioPlayer.addEventListener("canplay", () => {
    if (!audioURL) {
        return;
    }

    audioStatus.textContent = "فایل آماده پخش است.";

    if (!hasStarted && !isRunning) {
        startButton.disabled = false;
    }
});

audioPlayer.addEventListener("error", () => {
    audioStatus.textContent =  "فایل قابل پخش نیست یا مرورگر از آن پشتیبانی نمی‌کند.";

    if (isRunning) {
        stopTest();
    }

    startButton.disabled = true;
    lapButton.disabled = true;
    stopButton.disabled = true;
    resumeButton.disabled = true;
});


async function startTest() {
    if (!audioURL || isRunning || hasStarted || !audioPlayer.paused) {
        return;
    }

    elapsedMs = 0;
    lastLapMs = 0;
    startTime = null;

    timerDisplay.textContent = "00:00.000";
    result.textContent = "آزمایش در حال اجراست.";

    lapTableBody.replaceChildren();

    audioPlayer.currentTime = 0;

    try {
        await audioPlayer.play();

        startTime = performance.now();
        isRunning = true;
        hasStarted = true;

        setRunningButtons();

        audioStatus.textContent = "آزمایش در حال اجراست.";

        timerInterval = setInterval(updateTimer, 10);

    } catch (error) {
        console.error(error);

        audioStatus.textContent = "پخش فایل آغاز نشد. لطفاً فایل را بررسی کنید.";
    }
}

function recordLap() {
    if (!isRunning) {
        return;
    }

    const overallMs = getCurrentElapsed();
    const lapMs = overallMs - lastLapMs;

    const row = document.createElement("tr");

    const lapNumberCell = document.createElement("td");
    const lapTimeCell = document.createElement("td");
    const overallTimeCell = document.createElement("td");

    lapNumberCell.textContent = lapTableBody.rows.length + 1;
    lapTimeCell.textContent = formatTime(lapMs);
    overallTimeCell.textContent = formatTime(overallMs);

    row.append(lapNumberCell, lapTimeCell, overallTimeCell);

    lapTableBody.prepend(row);

    lastLapMs = overallMs;
}


function stopTest() {
    if (!isRunning) {
        return;
    }

    elapsedMs = getCurrentElapsed();

    isRunning = false;
    startTime = null;

    audioPlayer.pause();

    clearInterval(timerInterval);
    timerInterval = null;

    updateTimer();

    startButton.disabled = true;
    lapButton.disabled = true;
    stopButton.disabled = true;
    resumeButton.disabled = false;
    resetButton.disabled = false;

    audioStatus.textContent = "آزمایش متوقف شد.";

    result.textContent = `زمان سپری‌شده: ${formatTime(elapsedMs)}`;
}

async function resumeTest() {
    if ( !audioURL || !hasStarted || isRunning || !audioPlayer.paused || audioPlayer.ended) {
        return;
    }

    try {
        await audioPlayer.play();

        startTime = performance.now();
        isRunning = true;

        setRunningButtons();

        audioStatus.textContent = "آزمایش ادامه دارد.";
        result.textContent = "آزمایش در حال اجراست.";

        timerInterval = setInterval(updateTimer, 10);

    } catch (error) {
        console.error(error);

        audioStatus.textContent = "ادامه پخش امکان‌پذیر نشد. لطفاً فایل را بررسی کنید.";
    }
}

function resetTest() {
    if (isRunning) {
        return;
    }

    clearInterval(timerInterval);
    timerInterval = null;

    audioPlayer.pause();

    if (audioURL) {
        audioPlayer.currentTime = 0;
    }

    elapsedMs = 0;
    startTime = null;
    lastLapMs = 0;
    hasStarted = false;
    isRunning = false;

    timerDisplay.textContent = "00:00.000";
    lapTableBody.replaceChildren();

    result.textContent = audioURL ? "فایل صوتی آماده پخش است." : "ابتدا یک فایل MP3 انتخاب کنید.";

    audioStatus.textContent = audioURL ? "فایل آماده پخش است." : "ابتدا یک فایل MP3 انتخاب کنید.";

    startButton.disabled = !audioURL;
    lapButton.disabled = true;
    stopButton.disabled = true;
    resumeButton.disabled = true;
    resetButton.disabled = true;
}

audioPlayer.addEventListener("ended", () => {
    if (!isRunning) {
        return;
    }

    elapsedMs = getCurrentElapsed();

    isRunning = false;
    startTime = null;

    clearInterval(timerInterval);
    timerInterval = null;

    updateTimer();

    startButton.disabled = true;
    lapButton.disabled = true;
    stopButton.disabled = true;
    resumeButton.disabled = true;
    resetButton.disabled = false;

    audioStatus.textContent = "پخش فایل به پایان رسید.";

    result.textContent = `زمان سپری‌شده: ${formatTime(elapsedMs)}`;
});

startButton.addEventListener("click", startTest);
lapButton.addEventListener("click", recordLap);
stopButton.addEventListener("click", stopTest);
resumeButton.addEventListener("click", resumeTest);
resetButton.addEventListener("click", resetTest);

window.addEventListener("pagehide", () => {
    if (audioURL) {
        URL.revokeObjectURL(audioURL);
    }
});