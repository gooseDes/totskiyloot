window.addEventListener('load', function() {
    const socket = io(`${location.protocol}//${location.host}`);
    socket.emit('get_money', {'token': localStorage.getItem('token')});
    const grid = document.getElementById('grid');
    const start_button = document.getElementById('start-button')
    const bet_div = document.getElementById('bet-div');
    const amount_div = document.getElementById('amount-div');
    const bet_input = document.getElementById('bet-input');
    const amount_input = document.getElementById('amount-input');
    const exit_button = document.getElementById('exitButton');
    exit_button.addEventListener("click", function() {
        goto('/games');
    });

    var money;
    var actualMoney;
    var win = 0;
    var actualWin = 0;
    var upcoming_mines = [];
    var bet;
    var game_ended = false;
    var game_started = false;

    start_button.addEventListener('click', () => {
        if (!game_started) {
            bet = parseInt(bet_input.value);
            socket.emit('generate_mines', {'token': localStorage.getItem('token'), 'bet': bet, 'amount': parseInt(amount_input.value)});
        }
    });

    socket.on('get_money_result', (data) => {
        if (!data.success) {
            showError(data.message);
            return;
        }
        money = data.money;
        actualMoney = data.money;
    });

    socket.on('generate_mines_result', (data) => {
        if (!data.success) { showError(data.message); return; }
        upcoming_mines = data.mines;
        game_started = true;
        start_button.classList.add('fade-down');
        amount_div.classList.add('fade-down');
        bet_div.classList.add('fade-up');
        exit_button.classList.add('fade-up');
        const current_win = document.createElement('h1');
        current_win.id = 'current-win';
        current_win.textContent = 'Current Win: 0';
        document.getElementById('content').appendChild(current_win);
        for (let i = 0; i < amount_input.value; i++) {
            const cell_div = document.createElement('div');
            cell_div.classList.add('cell-div');
            const cell = document.createElement('div');
            cell.classList.add('cell');
            const back = document.createElement('div');
            back.classList.add('cell-back');
            cell_div.appendChild(back);
            cell_div.appendChild(cell);
            cell_div.addEventListener('click', () => {
                if (cell.textContent != 'open') {
                    const click_sound = new Audio('/static/sounds/click.wav');
                    click_sound.play();
                    cell.style.animation = '';
                    cell.style.transform = 'rotateY(90deg) rotateZ(2.5deg)';
                    cell.textContent = 'open';
                    setTimeout(() => {
                        const mine = upcoming_mines.shift();
                        back.textContent = mine;
                        back.style.display = 'flex';
                        if (mine == '-0.5') {
                            back.style.color = 'red';
                            win -= 0.5*bet;
                        } else if (mine == '+0.5') {
                            back.style.color = 'green';
                            win += 0.5*bet;
                        } else if (mine == 'x2') {
                            back.style.color = 'white';
                            win *= 2;
                        } else {
                            back.style.color = 'white';
                            win *= 0;
                        }
                        back.classList.add('open');
                        cell.style.display = 'none';
                    }, 150);
                }
            });
            setTimeout(() => {
                grid.appendChild(cell_div);
            }, i*50);
        }
    });

    function update() {
        actualMoney += 0.02 * (money - actualMoney);
        actualWin += 0.02 * (win - actualWin);
        document.getElementById('money').textContent = Math.round(actualMoney);
        try {
            document.getElementById('current-win').textContent = "Current Win: " + Math.round(actualWin);
        } catch {}
        if (upcoming_mines.length <= 0 && !game_ended && game_started) {
            game_ended = true;
            setTimeout(() => {
                money += win;
                win = 0;
                setTimeout(() => {
                    grid.classList.add('fade-down');
                    const current_win = document.getElementById('current-win');
                    current_win.style.animation = 'fade-up ease forwards 0.6s';
                    start_button.classList.remove('fade-down');
                    start_button.classList.add('unfade-down');
                    amount_div.classList.remove('fade-down');
                    amount_div.classList.add('unfade-down');
                    bet_div.classList.remove('fade-up');
                    bet_div.classList.add('unfade-up');
                    exit_button.classList.remove('fade-up');
                    exit_button.classList.add('unfade-up');
                    setTimeout(() => {
                        start_button.classList.remove('unfade-down');
                        amount_div.classList.remove('unfade-down');
                        bet_div.classList.remove('unfade-up');
                        exit_button.classList.remove('unfade-up');
                        document.getElementById('content').removeChild(current_win);
                        Array.from(grid.children).forEach((child) => {
                            grid.removeChild(child);
                        });
                        grid.classList.remove('fade-down');
                        game_ended = false;
                        game_started = false;
                    }, 600);
                }, 2000);
            }, 2000);
        }
    }

    setInterval(update, 1/60);
});