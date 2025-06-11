window.addEventListener('load', function() {
    const grid = document.getElementById('grid');
    for (let i = 0; i < 36; i++) {
        const cell_div = document.createElement('div');
        cell_div.classList.add('cell-div');
        const cell = document.createElement('div');
        cell.classList.add('cell');
        const back = document.createElement('div');
        back.classList.add('cell-back');
        cell_div.appendChild(back);
        cell_div.appendChild(cell);
        grid.appendChild(cell_div);
        cell_div.addEventListener('click', () => {
            cell.style.transform = 'rotateY(90deg) rotateZ(2.5deg)';
            setTimeout(() => {
                back.textContent = 'x0';
                back.style.display = 'flex';
                back.style.color = 'red';
                back.classList.add('open');
            }, 150);
        });
    }
});