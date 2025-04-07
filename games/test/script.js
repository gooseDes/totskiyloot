import * as menu_scene from "./menu_scene.js";
import * as test_scene from "./test_scene.js";
//menu_scene.start();
test_scene.start()

window.addEventListener('load', function() {
    document.getElementById('play-button').onclick = function() {
        console.log('jgdfgdksfl');
        test_scene.start()
    };
})

function update() {
    requestAnimationFrame(update);
    //menu_scene.update();
    //menu_scene.renderer.render(menu_scene.scene, menu_scene.camera);
    test_scene.update();
    test_scene.renderer.render(test_scene.scene, test_scene.camera);
}

update();