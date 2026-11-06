const messages = [
    "Are you sure, Haya?",
    "Really sure??",
    "Pakka wala sure?",
    "Hawwwwwwwww",
    "Bas sahi hay Haya yaad rakhunga",
    "PLEASEEEEEE MOMMY",
    "Awwwwww man, are you really sure?",
    "Meri jaan PLEASEEEEEEEEEEEEEEE",
    "PLEASE NAAAAAAAAAAAAAAA ykw nevermind bas",
    "BAHAHAHAH IM KIDDING MWAH"
];

let messageIndex = 0;

// 1. FADE IN ON LOAD
window.onload = () => {
    document.body.classList.add('fade-in');
};

function playMusic() {
    const music = document.getElementById('bg-music');
    if (music && music.paused) {
        music.play().catch(e => console.log("Waiting for interaction..."));
        localStorage.setItem('musicPlaying', 'true');
    }
}

function handleNoClick() {
    playMusic();
    const noButton = document.querySelector('.no-button');
    const yesButton = document.querySelector('.yes-button');
    
    noButton.textContent = messages[messageIndex];
    messageIndex = (messageIndex + 1) % messages.length;
    
    const currentSize = parseFloat(window.getComputedStyle(yesButton).fontSize);
    yesButton.style.fontSize = `${currentSize * 1.5}px`;
    
    const currentPadding = parseFloat(window.getComputedStyle(yesButton).padding);
    yesButton.style.padding = `${currentPadding * 1.2}px`;
}

// 2. SMOOTH FADE OUT ON YES
function handleYesClick() {
    localStorage.setItem('musicPlaying', 'true');
    
    // Add the fade-out class to body
    document.body.classList.add('fade-out');

    // Wait for the CSS transition (800ms) before changing pages
    setTimeout(() => {
        window.location.href = "yes_page.html";
    }, 800);
}

function createHeart() {
    const container = document.getElementById('hearts-container');
    if (!container) return;

    const heart = document.createElement('div');
    heart.classList.add('heart');
    heart.innerHTML = '❤️';
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.animationDuration = Math.random() * 2 + 3 + 's';
    
    container.appendChild(heart);
    
    setTimeout(() => { 
        heart.remove(); 
    }, 5000);
}

setInterval(createHeart, 300);