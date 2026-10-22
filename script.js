const audioFile = document.getElementById("audioFile");
const audioPlayer = document.getElementById("audioPlayer");

const fileName = document.getElementById("fileName");
const audioStatus = document.getElementById("audioStatus");
const timerDisplay = document.getElementById("timer");
const result = document.getElementById("result");

const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");

let audioURL = null;

let startTime = null;
let elapsedMs = 0;
let timerInterval = null;

let isRunning = false;
let hasStarted = false;


function formatTime(milliseconds) {
    const totalMs = Math.floor(milliseconds);
    const minutes = Math.floor(totalMs / 60000);

    const seconds = Math.floor( (totalMs % 60000) / 1000 );

    const ms = totalMs % 1000;

    return (
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0") + "." +
        String(ms).padStart(3, "0")
    );
}

function updateTimer() {
    let currentElapsed = elapsedMs;

    if (isRunning && startTime !== null) {
        currentElapsed += performance.now() - startTime;
    }
    timerDisplay.textContent = formatTime(currentElapsed);
}

audioFile.addEventListener("change", () => {
    const file = audioFile.files[0];

    if (!file) {
        return;
    }

    if (audioURL) {
        URL.revokeObjectURL(audioURL);
        audioURL = null;
    }

    clearInterval(timerInterval);
    timerInterval = null;

    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    audioPlayer.load();

    isRunning = false;
    hasStarted = false;
    startTime = null;
    elapsedMs = 0;

    timerDisplay.textContent = "00:00.000";
    result.textContent = "هنوز آزمایشی انجام نشده است.";

    stopButton.disabled = true;
    startButton.disabled = true;

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
    startButton.disabled = false;
});


audioPlayer.addEventListener("error", () => {
    audioStatus.textContent =
        "فایل قابل پخش نیست یا مرورگر از آن پشتیبانی نمی‌کند.";

    startButton.disabled = true;
    stopButton.disabled = true;

    if (isRunning) {
        stopTest();
    }
});


// شروع آزمایش
async function startTest() {
    if (!audioURL || isRunning || !audioPlayer.paused) {
        return;
    }

    elapsedMs = 0;
    startTime = null;

    timerDisplay.textContent = "00:00.000";
    audioStatus.textContent = "آزمایش در حال اجراست.";

    audioPlayer.currentTime = 0;

    try {
        await audioPlayer.play();

        startTime = performance.now();

        isRunning = true;
        hasStarted = true;

        startButton.disabled = true;
        stopButton.disabled = false;

        audioStatus.textContent = "آزمایش در حال اجراست.";

        timerInterval = setInterval(updateTimer, 10);

    } catch (error) {
        console.error(error);

        audioStatus.textContent =
            "پخش فایل آغاز نشد. لطفاً فایل را بررسی کنید.";
    }
}


function stopTest() {
    if (!isRunning) {
        return;
    }

    elapsedMs += performance.now() - startTime;

    isRunning = false;
    startTime = null;

    audioPlayer.pause();

    clearInterval(timerInterval);
    timerInterval = null;

    updateTimer();

    startButton.disabled = false;
    stopButton.disabled = true;

    audioStatus.textContent = "آزمایش متوقف شد.";

    result.textContent =
        `زمان نهایی آزمایش: ${formatTime(elapsedMs)}`;
}

startButton.addEventListener("click", startTest);
stopButton.addEventListener("click", stopTest);

audioPlayer.addEventListener("ended", () => {
    if (isRunning) {
        stopTest();
    }
});

window.addEventListener("pagehide", () => {
    if (audioURL) {
        URL.revokeObjectURL(audioURL);
    }
});