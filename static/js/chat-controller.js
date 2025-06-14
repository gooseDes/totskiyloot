window.addEventListener('load', function() {
    const socket = io(`${location.protocol}//${location.host}`);
    const toolbar = document.getElementById('toolbar');
    const closeButton = document.getElementById('chat-close-button');
    const hideButton = document.getElementById('chat-hide-button');
    const sendButton = document.getElementById('send-button');
    const messageInput = document.getElementById('msg-input');
    const messages = document.getElementById('messages');
    const windowEl = toolbar.parentElement;
    windowEl.style.height = '50px';
    hideButton.children[0].style.rotate = '180deg';

    let offsetX, offsetY, isDragging = false;

    toolbar.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - windowEl.offsetLeft;
        offsetY = e.clientY - windowEl.offsetTop;
    });

    toolbar.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        offsetX = touch.clientX - windowEl.offsetLeft;
        offsetY = touch.clientY - windowEl.offsetTop;
    }, { passive: false });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        windowEl.style.left = (e.clientX - offsetX) + 'px';
        windowEl.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        windowEl.style.left = (touch.clientX - offsetX) + 'px';
        windowEl.style.top = (touch.clientY - offsetY) + 'px';
    }, { passive: false });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
    });

    hideButton.addEventListener('click', function() {
        if (hideButton.children[0].style.rotate == '0deg') {
            hideButton.children[0].style.rotate = '180deg';
            windowEl.style.height = '50px';
            Array.from(windowEl.children).forEach(el => {
                if (el != toolbar) {
                    try { el.classList.remove('chat-show'); } catch {}
                    el.classList.add('chat-hide');
                }
            });
        } else {
            hideButton.children[0].style.rotate = '0deg';
            windowEl.style.height = '600px';
            Array.from(windowEl.children).forEach(el => {
                if (el != toolbar) {
                    try { el.classList.remove('chat-hide'); } catch {}
                    el.classList.add('chat-show');
                }
            });
        }
    });

    socket.on('new_message', data => {
        if (data.author == localStorage.getItem('username')) return;
        const message_div = document.createElement('div');
        message_div.classList.add('message-div');
        messages.appendChild(message_div);
        const message = document.createElement('div');
        message.classList.add('message');
        const avatar = document.createElement('img');
        avatar.classList.add('chat-avatar');
        avatar.onerror = () => {avatar.src = '/static/img/avatar.svg'};
        avatar.src = `/static/avatars/${data.author}.webp`;
        avatar.onclick = () => {goto(`/profile/${data.author}`)};
        message.textContent = data.message;
        message.appendChild(avatar);
        message_div.appendChild(message);
    });

    socket.on('send_message_result', data => {
        if (!data.success) {
            showError(data.message);
            return;
        }
    });

    function sendMessage() {
        const message_div = document.createElement('div');
        message_div.classList.add('message-div');
        message_div.classList.add('self-message');
        messages.appendChild(message_div);
        const message = document.createElement('div');
        message.classList.add('message');
        message.classList.add('self-message');
        const avatar = document.createElement('img');
        avatar.classList.add('chat-avatar');
        avatar.onerror = () => {avatar.src = '/static/img/avatar.svg'};
        avatar.src = `/static/avatars/${localStorage.getItem('username')}.webp`;
        message.textContent = messageInput.value;
        message.appendChild(avatar);
        message_div.appendChild(message);
        socket.emit('send_message', {'token': localStorage.getItem('token'), 'message': messageInput.value});
        messageInput.value = '';
    }

    sendButton.addEventListener('click', () => sendMessage());
});