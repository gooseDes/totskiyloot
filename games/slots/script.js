window.addEventListener("load", function() {
    document.getElementById('exitButton').addEventListener("click", function() {
        goto('/games');
    });
    
    document.getElementById('spinButton').addEventListener("click", function() {
        document.getElementById('spinButton').classList.add('spinning');
        document.querySelectorAll('.slot').forEach((slot) => {
            for (let i = 0; i < 20; i++) {
                setTimeout(function() {
                    slot.style.height = '0%';
                    slot.style.width = '90%';
                    slot.style.transitionDuration = ((i*21)/1000).toString().concat('s');
                    setTimeout(function() {
                        slot.innerHTML = Math.round(Math.random()*9);
                        slot.style.height = '100%';
                        slot.style.width = '100%';
                    }, i*21);
                }, i*(i*21));
            }
        });
        setTimeout(function() {
            document.getElementById('spinButton').classList.remove('spinning');
        }, 2000)
    });
});
