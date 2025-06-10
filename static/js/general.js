function goto(page) {
    document.body.classList.add("fade_down");
    if (location.hostname != '') {
        if (page.split('.')[0] == 'index') {
            setTimeout(function() { window.location.href = "/" }, 350);
            return;
        }
    }
    setTimeout(function() { window.location.href = page }, 350);
}

window.addEventListener('load', function() {
    const script = document.createElement("script");
    script.src = "https://cdn.socket.io/4.7.2/socket.io.min.js";
    script.onload = () => {
        const socket = io(`${location.protocol}//${location.host}`);
        setTimeout(function() {
            window.scrollTo({
            top: 0,
            behavior: 'smooth'
            });
        }, 350);

        try {
            document.getElementById("navButton").addEventListener("click", function() {
                if (window.matchMedia("(orientation: landscape)").matches) {
                    document.getElementById("sideNav").style.width = "300px";
                } else {
                    document.getElementById("sideNav").style.width = "100%";
                }
                document.getElementById("content").style.filter = "blur(10px)";
            });
            document.getElementById("closeNav").addEventListener("click", function() {
                document.getElementById("sideNav").style.width = "0";
                document.getElementById("content").style.filter = "";
            });
            document.getElementById("userButton").addEventListener("click", function() {
                socket.emit('verify_token', {'token': localStorage.getItem('token')});
                socket.on('verify_token_result', (data) => {
                    if (!data.success || !data.valid) goto('/signin')
                    else goto(`/profile/${localStorage.getItem('username')}`)
                });
            });
        } catch (e) {}

        setInterval(function() {
            var ars = document.querySelectorAll(".ar9_16");
            ars.forEach((ar) => {
                if (window.innerWidth/window.innerHeight > 9/16) {
                    ar.style.aspectRatio = "9/16";
                } else {
                    ar.style.aspectRatio = "";
                }
            });
        }, 1/30);

        document.querySelectorAll('.popup-close').forEach((button) => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const popup = button.closest('.popup');
                if (popup) {
                    closePopup(popup.id);
                }
            });
        });
    };

    document.head.appendChild(script);
});

function openPopup(popupId) {
  const popup = document.getElementById(popupId);
  if (popup) {
    popup.classList.remove('popup-hide');
    popup.style.display = 'flex';
    popup.classList.add('popup-show');
    document.querySelectorAll('.mobile-ui').forEach((el) => {
      el.style.translate = '0 100vh';
    });
    document.getElementById('content').style.filter = 'blur(5px)'
  }
}

function closePopup(popupId) {
  const popup = document.getElementById(popupId);
  if (popup) {
    document.getElementById('content').style.filter = 'blur(0)'
    popup.classList.remove('popup-show');
    popup.classList.add('popup-hide');
    document.querySelectorAll('.mobile-ui').forEach((el) => {
      el.style.translate = '0 0';
    });
    setTimeout(() => {
      popup.style.display = 'none';
    }, 300);
  }
}

function showError(text) {
    if (!document.getElementById('error-popup')) {
        const popup = document.createElement('div');
        popup.classList.add('popup');
        popup.id = 'error-popup';
        document.body.appendChild(popup);
        const header = document.createElement('div');
        header.classList.add('popup-header');
        header.style.color = 'red';
        header.textContent = 'Error';
        popup.appendChild(header);
        const content = document.createElement('div');
        content.classList.add('popup-content');
        popup.appendChild(content);
        const error = document.createElement('p');
        error.textContent = text;
        content.appendChild(error);
        const close = document.createElement('button');
        close.classList.add('popup-close');
        close.onclick = () => {closePopup('error-popup')};
        content.appendChild(close);
        const closeIcon = document.createElement('i');
        closeIcon.classList.add('fa-solid');
        closeIcon.classList.add('fa-xmark');
        close.appendChild(closeIcon);
    }
    openPopup('error-popup');
}