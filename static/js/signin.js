window.addEventListener("load", function() {
    const socket = io(`${location.protocol}//${location.host}`);
    socket.on("login_result", (data) => {
        if (data.success) {
            localStorage.setItem("username", document.getElementById("username_input").value);
            localStorage.setItem("token", data.token);
            goto('index');
        } else {
            showError(data.message);
        }
    });
    document.getElementById("signin_button").addEventListener("click", function() {
        socket.emit("login", {"username": document.getElementById("username_input").value, "password": document.getElementById("pass_input").value});
    });
});