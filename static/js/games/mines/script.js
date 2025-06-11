window.addEventListener('load', function() {
    const grid = document.getElementById('grid');
    for (let i = 0; i < 36; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        grid.appendChild(cell);
        cell.addEventListener('click', () => {
            cell.style.transform = 'rotateY(180deg) rotateZ(5deg)';
            setTimeout(() => {
                cell.classList.add('open');
                cell.textContent = 'x0';
            }, 150);
        });
    }
});