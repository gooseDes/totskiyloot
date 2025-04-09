import * as menu_scene from "./menu_scene.js";
import * as test_scene from "./test_scene.js";

var scenes = {};
scenes['menu'] = menu_scene;
scenes['test'] = test_scene;

menu_scene.start();

document.getElementById('play-button').addEventListener('click', () => {
    setTimeout(() => {
        document.getElementById('play-button').style.visibility = 'hidden';
        menu_scene.stop();
        test_scene.start();
    }, 1000);    
    document.getElementById('play-button').classList.add('play-button-anim');
});

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