window.addEventListener('load', () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const exitButton = document.getElementById("exitButton");
    exitButton.addEventListener("click", () => {
        goto("/games");
    });

    var w, h;

    w = canvas.parentElement.getClientRects()[0].width;
    h = canvas.parentElement.getClientRects()[0].height;

    canvas.width = w;
    canvas.height = h;

    const GRAVITY = 0.98;
    const FRICTION_X = 0.95;
    const FRICTION_Y = 0.99;
    const FPS = 60;

    let ball = {
        x: w / 2,
        y: 0,
        radius: 15,
        vy: 0,
        vx: 0
    };

    let old_ball = {
        x: ball.x,
        y: ball.y,
        vx: ball.vx,
        vy: ball.vy
    }

    function randint(x, y) {
        return Math.floor(Math.random() * (y - x + 1)) + x;
    }

    let last_direction = randint(0, 1);
    if (last_direction == 0) {
        last_direction = -1;
    }

    let platforms = [
        {x: w / 2 - 125, y: 100, width: 250, height: 20, angle: 45 * last_direction}
    ];

    for (let i = 1; i < 10; i++) {
        last_direction *= -1;
        for (let j = 0; j < (i/2); j++) {
            platforms.push({
                x: (window.innerWidth/10 + j*(window.innerWidth/10)) * last_direction,
                y: i * (h/10) + h/5,
                width: 100,
                height: 10,
                angle: randint(30, 50) * last_direction,
            });
        }
    };

    function getRotatedRectPoints(x, y, w, h, angleDeg) {
        const angle = angleDeg * Math.PI / 180;
        const cx = x + w / 2;
        const cy = y + h / 2;

        const corners = [
            { x: x,     y: y },
            { x: x + w, y: y },
            { x: x + w, y: y + h },
            { x: x,     y: y + h }
        ];

        return corners.map(p => {
            const dx = p.x - cx;
            const dy = p.y - cy;
            return {
                x: cx + dx * Math.cos(angle) - dy * Math.sin(angle),
                y: cy + dx * Math.sin(angle) + dy * Math.cos(angle)
            };
        });
    }

    function getNormalVector(angleDeg) {
        const angleRad = angleDeg * Math.PI / 180;
        return { x: Math.sin(angleRad), y: -Math.cos(angleRad) };
    }

    function reflectVelocity(vx, vy, normal) {
        let dotProduct = vx * normal.x + vy * normal.y;
        return {
            vx: vx - 2 * dotProduct * normal.x,
            vy: vy - 2 * dotProduct * normal.y
        };
    }

    function projectPointOntoAxis(point, axis) {
        return point.x * axis.x + point.y * axis.y;
    }

    function isCollidingSAT(rectPoints, circle) {
        let axes = [];

        for (let i = 0; i < rectPoints.length; i++) {
            let p1 = rectPoints[i];
            let p2 = rectPoints[(i + 1) % rectPoints.length];
            let edge = { x: p2.x - p1.x, y: p2.y - p1.y };
            let normal = { x: -edge.y, y: edge.x };
            let length = Math.hypot(normal.x, normal.y);
            axes.push({ x: normal.x / length, y: normal.y / length });
        }

        rectPoints.forEach(p => {
            let axis = { x: p.x - circle.x, y: p.y - circle.y };
            let len = Math.hypot(axis.x, axis.y);
            if (len > 0) {
                axis.x /= len;
                axis.y /= len;
                axes.push(axis);
            }
        });

        for (let axis of axes) {
            let minA = Infinity, maxA = -Infinity;
            rectPoints.forEach(p => {
                let proj = projectPointOntoAxis(p, axis);
                minA = Math.min(minA, proj);
                maxA = Math.max(maxA, proj);
            });

            let projCircle = projectPointOntoAxis(circle, axis);
            let minB = projCircle - circle.radius;
            let maxB = projCircle + circle.radius;

            if (maxA < minB || maxB < minA) return false;
        }

        return true;
    }

    function update() {
        ball.vy += GRAVITY;
        ball.y += ball.vy;
        ball.x += ball.vx;

        ball.vx *= FRICTION_X;
        ball.vy *= FRICTION_Y;

        for (let platform of platforms) {
            const rectPoints = getRotatedRectPoints(platform.x, platform.y, platform.width, platform.height, platform.angle);
            if (isCollidingSAT(rectPoints, ball)) {
                ball.y -= ball.vy;
                ball.x -= ball.vx;
                
                let normal = getNormalVector(platform.angle);
                let newVel = reflectVelocity(ball.vx, ball.vy, normal);
                
                ball.vx = newVel.vx;
                ball.vy = newVel.vy;
                
                if (Math.abs(ball.vy) < 0.5) ball.vy = 0;
                if (Math.abs(ball.vx) < 0.1) ball.vx = 0;
            }

            if (ball.y + ball.radius > h) {
                ball.y = h - ball.radius;
                ball.vy = -1 * Math.abs(ball.vy);
            }
            if (ball.x + ball.radius > w || ball.x - ball.radius < 0) {
                ball.x -= ball.vx;
                ball.vx *= -2;
            }
        }

        old_ball.x += (ball.x - old_ball.x)*0.8;
        old_ball.y += (ball.y - old_ball.y)*0.8;
    }

    function drawPlatform(p) {
        const points = getRotatedRectPoints(p.x, p.y, p.width, p.height, p.angle);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = "#fff";
        ctx.fill();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let p of platforms) {
            drawPlatform(p);
        }

        ctx.beginPath();
        ctx.arc(old_ball.x, old_ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.fill();
    }

    function gameLoop() {
        update();
        draw();
        setTimeout(() => requestAnimationFrame(gameLoop), (1 / FPS) * 1000);
    }

    window.addEventListener('resize', () => {
        canvas.width = w;
        canvas.height = h;
    });

    gameLoop();
});