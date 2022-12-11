const audioFiles = ['avia.mp3', 'full-defeat.mp3', 'infantry.mp3', 'shooting-2.mp3', 'tick.mp3',
    'defeat.mp3', 'full-victory.mp3', 'ship.mp3', 'shooting-3.mp3', 'victory.mp3', 'enemy-turn.mp3',
    'gong.mp3', 'shooting-1.mp3', 'tank.mp3'];

const soundDiv = document.getElementById("sound");
audioFiles.forEach(file => {
    const audio = document.createElement("audio");
    audio.setAttribute("src", "/sounds/" + file);
    audio.setAttribute("id", file.substr(0, file.indexOf('.')));
    soundDiv.appendChild(audio);
});

const playSound = (id) => {
    const sound = document.getElementById(id);
    sound.play();
}

const playRandomSound = (ids) => {
    const id = ids[random(0, ids.length - 1)];
    const sound = document.getElementById(id);
    sound.play();
}