import * as menu_scene from "./menu_scene.js";
import * as test_scene from "./test_scene.js";

var scenes = {};
scenes['menu'] = menu_scene;
scenes['test'] = test_scene;

menu_scene.start();

const playButton = document.getElementById('play-button');

playButton.addEventListener('click', handlePlayButton);
playButton.addEventListener('touchstart', handlePlayButton);

function handlePlayButton(e) {
    e.preventDefault();
    playButton.classList.add('play-button-anim');
    setTimeout(() => {
        playButton.style.display = 'none';
        menu_scene.stop();
        test_scene.start();
    }, 1000);
}

function update() {
    requestAnimationFrame(update);
    if (scenes['menu'].running) {
        menu_scene.update();
        menu_scene.render();
    }
    if (scenes['test'].running) {
        test_scene.update();
        test_scene.render();
    }
}

update();