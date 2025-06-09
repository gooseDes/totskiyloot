const socket = io(`${location.protocol}//${location.host}`);

window.addEventListener("load", function() {
    document.getElementById('exitButton').addEventListener("click", function() {
        goto('/games');
    });

    var money = 1488;
    var actualMoney = 1488;

    socket.emit('get_money', {'token': localStorage.getItem('token')});
    socket.on('get_money_result', (data) => {
        money = data.money;
        actualMoney = data.money;
    });

    socket.on('spin_result', (data) => {
        if (!data.success) {
            alert(data.message);
            return;
        }
        let result_numbers = [];
        let rand1 = Math.round(Math.random()*9);
        let rand2;
        while (rand2 === rand1 || rand2 === undefined) {
            rand2 = Math.round(Math.random()*9);
        }
        let rand3;
        while (rand3 === rand1 || rand3 === rand2 || rand3 === undefined) {
            rand3 = Math.round(Math.random()*9);
        }
        if (data.result === 'jackpot') {
            result_numbers = [rand1, rand1, rand1];
        }
        if (data.result === 'win') {
            result_numbers = [rand1, rand1, rand1];
            result_numbers[Math.floor(Math.random() * 3)] = rand2;
        }
        if (data.result === 'lose') {
            result_numbers = [rand1, rand2, rand3];
        }
        let last_result_number_index = -1;
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
                        if (i >= 19) {
                            last_result_number_index++;
                            slot.innerHTML = result_numbers[last_result_number_index];
                        }
                    }, i*21);
                }, i*(i*21));
            }
        });
        setTimeout(() => {
            money = data.money;
        }, 8000);
    });
    
    document.getElementById('spinButton').addEventListener("click", function() {
        socket.emit('spin', {'token': localStorage.getItem('token')});
        setTimeout(function() {
            document.getElementById('spinButton').classList.remove('spinning');
        }, 2000)
    });

    function update() {
        actualMoney += 0.01 * (money - actualMoney);
        document.getElementById('money').textContent = Math.round(actualMoney);
    }

    setInterval(update, 1/60);
});
