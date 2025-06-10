window.addEventListener('load', function() {
    if (location.href.split('/').at(-1) == localStorage.getItem('username')) {
        const logout_button = document.getElementById('logout_button');
        logout_button.style.display = 'flex';
        logout_button.addEventListener('click', () => {
            localStorage.removeItem('username');
            localStorage.removeItem('token');
            goto('/signin');
        });
        const edit_button = document.getElementById('edit_button');
        edit_button.style.display = 'flex';
        edit_button.addEventListener('click', () => {
            goto(`/profile/edit/${localStorage.getItem('username')}`);
        });
    }
});