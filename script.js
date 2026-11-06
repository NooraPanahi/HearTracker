const audioFile = document.getElementById("audioFile");
const audioPlayer = document.getElementById("audioPlayer");

const fileName = document.getElementById("fileName");
const audioStatus = document.getElementById("audioStatus");
const timerDisplay = document.getElementById("timer");

const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const resumeButton = document.getElementById("resumeButton");
const resetButton = document.getElementById("resetButton");
const markButton = document.getElementById("markButton");

const lapTableBody = document.getElementById("lapTableBody");

const leftAverage = document.getElementById("leftAverage");
const rightAverage = document.getElementById("rightAverage");
const bothAverage = document.getElementById("bothAverage");



const startTimeInput = document.getElementById("startTimeInput");
let selectedStartSeconds = 0;

let audioURL = null;

let timerInterval = null;

let isRunning = false;
let hasStarted = false;

const audioChannel = document.getElementById("audioChannel");

const audioContext = new AudioContext();

const source = audioContext.createMediaElementSource(audioPlayer);

const panner = audioContext.createStereoPanner();

source.connect(panner);
panner.connect(audioContext.destination);

audioChannel.addEventListener("change", () => {
    switch (audioChannel.value) {
        case "left":
            panner.pan.value = -1;
            break;
        case "right":
            panner.pan.value = 1;
            break;
        case "both":
            panner.pan.value = 0;
            break;
    }
});

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
    return Math.max(
        0,
        (audioPlayer.currentTime - selectedStartSeconds) * 1000
    );
}

function updateTimer() {
    timerDisplay.textContent = formatTime(getCurrentElapsed());
}

function setRunningButtons() {
    startButton.disabled = true;
    stopButton.disabled = false;
    resumeButton.disabled = true;
    resetButton.disabled = true;
    markButton.disabled = false;
    startTimeInput.disabled = true;
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

    timerDisplay.textContent = "00:00.000";
    lapTableBody.replaceChildren();

    leftAverage.textContent = "--";
    rightAverage.textContent = "--";
    bothAverage.textContent = "--";

    startButton.disabled = true;
    stopButton.disabled = true;
    resumeButton.disabled = true;
    resetButton.disabled = true;
    markButton.disabled= true;

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

    audioPlayer.onloadedmetadata = () => {
        audioStatus.textContent = "فایل صوتی آماده پخش است.";
        startButton.disabled = false;
    };

    audioPlayer.onerror = () => {
        audioStatus.textContent = "خطا در بارگذاری فایل صوتی.";
        startButton.disabled = true;
    };
});

audioPlayer.addEventListener("canplay", () => {
    if (!audioURL) return;

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
    stopButton.disabled = true;
    resumeButton.disabled = true;
});


async function startTest() {
    if (!audioURL || isRunning || hasStarted || !audioPlayer.paused) {
        return;
    }

    selectedStartSeconds = Number(startTimeInput.value);

    if (
        !Number.isFinite(selectedStartSeconds) ||
        selectedStartSeconds < 0 ||
        selectedStartSeconds >= audioPlayer.duration
    ) {
        audioStatus.textContent = "زمان شروع واردشده معتبر نیست.";
        return;
    }

    timerDisplay.textContent = "00:00.000";

    lapTableBody.replaceChildren();

    leftAverage.textContent = "--";
    rightAverage.textContent = "--";
    bothAverage.textContent = "--";

    audioPlayer.currentTime = selectedStartSeconds;

    try {
        await audioContext.resume();

        await audioPlayer.play();

        isRunning = true;
        hasStarted = true;

        setRunningButtons();

        startTimeInput.disabled = true;

        audioStatus.textContent = "آزمایش در حال اجراست.";

        timerInterval = setInterval(updateTimer, 10);

    } catch (error) {
        console.error(error);

        audioStatus.textContent = "پخش فایل آغاز نشد. لطفاً فایل را بررسی کنید.";
    }
}
function markTime() {
    if (!isRunning) {
        return;
    }

    const recordedTime = getCurrentElapsed();

    const channelNames = {
        left: "Left Ear",
        right: "Right Ear",
        both: "Both Ears"
    };

    const row = document.createElement("tr");

    const numberCell = document.createElement("td");
    const channelCell = document.createElement("td");
    const timeCell = document.createElement("td");

    numberCell.textContent = lapTableBody.rows.length + 1;

    channelCell.textContent = channelNames[audioChannel.value];

    timeCell.textContent = formatTime(recordedTime);

    row.append(numberCell, channelCell, timeCell);

    lapTableBody.prepend(row);
    calculateAverages();
}

function calculateAverages() {
    let leftTimes = [];
    let rightTimes = [];
    let bothTimes = [];

    Array.from(lapTableBody.rows).forEach(row => {
        const channel = row.cells[1].textContent;
        const timeText = row.cells[2].textContent;

        const [minutes, rest] = timeText.split(":");
        const [seconds, milliseconds] = rest.split(".");

        const timeMs =
            Number(minutes) * 60000 +
            Number(seconds) * 1000 +
            Number(milliseconds);

        if (channel === "Left Ear") {
            leftTimes.push(timeMs);
        } else if (channel === "Right Ear") {
            rightTimes.push(timeMs);
        } else if (channel === "Both Ears") {
            bothTimes.push(timeMs);
        }
    });

    const calculateMean = times => {
        if (times.length === 0) return null;

        return times.reduce((sum, time) => sum + time, 0) / times.length;
    };

    const leftMean = calculateMean(leftTimes);
    const rightMean = calculateMean(rightTimes);
    const bothMean = calculateMean(bothTimes);

    leftAverage.textContent =
        leftMean !== null ? formatTime(leftMean) : "--";

    rightAverage.textContent =
        rightMean !== null ? formatTime(rightMean) : "--";

    bothAverage.textContent =
        bothMean !== null ? formatTime(bothMean) : "--";
}

function stopTest() {
    if (!isRunning) {
        return;
    }

    isRunning = false;

    audioPlayer.pause();

    clearInterval(timerInterval);
    timerInterval = null;

    updateTimer();

    startButton.disabled = true;
    stopButton.disabled = true;
    resumeButton.disabled = false;
    resetButton.disabled = false;
    markButton.disabled = true;

    audioStatus.textContent = "آزمایش متوقف شد.";

}

async function resumeTest() {
    if ( !audioURL || !hasStarted || isRunning || !audioPlayer.paused || audioPlayer.ended) {
        return;
    }

    try {
        await audioPlayer.play();

        isRunning = true;

        setRunningButtons();

        audioStatus.textContent = "آزمایش ادامه دارد.";

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

    hasStarted = false;
    isRunning = false;

    timerDisplay.textContent = "00:00.000";
    lapTableBody.replaceChildren();

    audioStatus.textContent = audioURL ? "فایل آماده پخش است." : "ابتدا یک فایل MP3 انتخاب کنید.";

    startButton.disabled = !audioURL;
    stopButton.disabled = true;
    resumeButton.disabled = true;
    resetButton.disabled = true;
    markButton.disabled = true;

    leftAverage.textContent = "--";
    rightAverage.textContent = "--";
    bothAverage.textContent = "--";

    startTimeInput.disabled = false;

}

audioPlayer.addEventListener("ended", () => {
    if (!isRunning) {
        return;
    }

    isRunning = false;

    clearInterval(timerInterval);
    timerInterval = null;

    updateTimer();

    startButton.disabled = true;
    stopButton.disabled = true;
    resumeButton.disabled = true;
    resetButton.disabled = false;
    markButton.disabled = true;


    audioStatus.textContent = "پخش فایل به پایان رسید.";
});

startButton.addEventListener("click", startTest);
stopButton.addEventListener("click", stopTest);
resumeButton.addEventListener("click", resumeTest);
resetButton.addEventListener("click", resetTest);
markButton.addEventListener("click", markTime);

window.addEventListener("pagehide", () => {
    if (audioURL) {
        URL.revokeObjectURL(audioURL);
    }
});