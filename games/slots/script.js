var top = 0;

window.addEventListener("load", function() {
    document.querySelectorAll('.slot').forEach((slot) => {
        top = parseInt(slot.style.top.slice(0, -3))
    });
    document.getElementById('exitButton').addEventListener("click", function() {
        goto('/games');
    });
    document.getElementById('spinButton').addEventListener("click", function() {
        document.getElementById('spinButton').classList.add('spinning');
        document.querySelectorAll('.slot').forEach((slot) => {
            for (let i = 0; i < 15; i++) {
                setTimeout(function() {
                    slot.style.height = '0vw';
                    slot.style.transitionDuration = ((300-i*20)/1000).toString().concat('s');
                    setTimeout(function() {
                        slot.innerHTML = Math.round(Math.random()*9);
                        slot.style.height = '36vw';
                    }, 300-i*20);
                }, i*(600-i*20));
            }
        });
        setTimeout(function() {
            document.getElementById('spinButton').classList.remove('spinning');
        }, 2000)
    });
    setInterval(function() {
        document.querySelectorAll('.slot').forEach((slot) => {
            top = 32 + (42 - slot.style.offsetHeight)/2;
            slot.style.top = top.toString().concat('vw');
        });
    }, 1/30);
});