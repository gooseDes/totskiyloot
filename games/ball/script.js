window.addEventListener("load", function() {
    document.getElementById('exitButton').addEventListener("click", function() {
        goto('/games');
    });

    var ball_y = window.innerHeight;
    var ball_x = window.innerWidth / 2;
    var ball_speed_y = 0;
    var ball = document.getElementById('ball');
    var collision_elements = document.querySelectorAll('.collision');
    var collisions = [];
    collision_elements.forEach((element) => {
        collisions.push(element.getClientRects()[0])
    });

    setInterval(function() {
        ball_speed_y += 0.025;
        ball_y += ball_speed_y;
        collisions.forEach((collision) => {
            if (ball_y < window.innerHeight - collision.top) {
                console.log(ball_y, window.innerHeight - collision.top);
                ball_speed_y *= -1;
            }
        });
        if (ball_y > window.innerHeight) {
            ball_speed_y *= -1;
        }
        ball.style.top = (ball_y + (ball.clientHeight/2)) + "px";
        ball.style.left = (ball_x - (ball.clientWidth/2)) + "px";
    }, 1/60);
});
