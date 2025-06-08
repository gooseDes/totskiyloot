window.addEventListener("load", function() {
    const socket = io(`${location.protocol}//${location.host}`);
    socket.on("reg_result", (data) => {
        if (data.success) {
            localStorage.setItem("username", document.getElementById("username_input").value);
            localStorage.setItem("token", data.token);
            goto('index');
        } else {
            alert(data.message);
        }
    });
    document.getElementById("signin_button").addEventListener("click", function() {
        if (document.getElementById("pass_input").value == document.getElementById("pass2_input").value) {
            socket.emit("reg", {"username": document.getElementById("username_input").value, "password": document.getElementById("pass_input").value});
        } else {
            alert("Passwords must match!");
        }
    });
});