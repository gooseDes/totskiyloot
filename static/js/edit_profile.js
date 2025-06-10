function uploadAvatar() {
    document.getElementById('hiddenFileInput').click();
}

window.addEventListener('load', function() {
    const socket = io(`${location.protocol}//${location.host}`);
    const fileInput = document.getElementById('hiddenFileInput');

    document.getElementById('avatar').addEventListener('click', () => {
        uploadAvatar();
    });

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) {
            showError('File is too big. Maximum is 3mb.')
            return
        }

        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('token', localStorage.getItem('token'));

        fetch('/upload-avatar', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                showError(data.message);
            } else {
                setTimeout(() => {
                    const img = document.getElementById('avatar');
                    const src = img.src.split('?')[0]; 
                    img.src = `${src}?t=${Date.now()}`;
                }, 100);
            }
        })
        .catch(err => {
            showError("Upload failed.");
        });

    });

    socket.on('upload_avatar_result', (data) => {
        if (!data.success) showError(data.message);
    });

    socket.on('change_username_result', (data) => {
        if (!data.success) {
            showError(data.message);
        } else {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', username_input.value);
            goto(`/profile/edit/${username_input.value}`);
        }
    });

    socket.on('change_description_result', (data) => {
        if (!data.success) {
            showError(data.message);
        } else {
            description.style.display = 'block';
            description.textContent = description_input.value;
            document.getElementById('description-input-div').style.display = 'none';
        }
    });

    const username = document.getElementById('username');
    const username_input = document.getElementById('username-input');

    function confirmUsernameChange() {
        socket.emit('change_username', {'token': localStorage.getItem('token'), 'username': username_input.value})
    }

    username.addEventListener('click', () => {
        username.style.display = 'none';
        document.getElementById('username-input-div').style.display = 'flex';
        username_input.value = username.textContent;
        username_input.focus();
    });

    username_input.addEventListener('change', confirmUsernameChange);

    document.getElementById('username-input-confirm').addEventListener('click', confirmUsernameChange);

    const description = document.getElementById('description');
    const description_input = document.getElementById('description-input');

    function confirmDescriptionChange() {
        socket.emit('change_description', {'token': localStorage.getItem('token'), 'description': description_input.value})
    }

    description.addEventListener('click', () => {
        description.style.display = 'none';
        document.getElementById('description-input-div').style.display = 'flex';
        description_input.value = description.textContent;
        description_input.focus();
    });

    description_input.addEventListener('change', confirmDescriptionChange);

    document.getElementById('username-input-confirm').addEventListener('click', confirmDescriptionChange);
});