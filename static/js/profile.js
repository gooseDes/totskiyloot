window.addEventListener('load', function() {
    if (location.href.split('/').at(-1) == localStorage.getItem('username')) {
        const logout_button = document.getElementById('logout_button');
        logout_button.style.display = 'block';
        logout_button.addEventListener('click', () => {
            localStorage.removeItem('username');
            localStorage.removeItem('token');
        });
    }
});