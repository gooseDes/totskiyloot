window.addEventListener("load", function() {
    document.getElementById("userButton").addEventListener("click", function() {
        goto('signin');
    });
    document.getElementById("letsgoButton").addEventListener("click", function() {
        goto('games');
    });
});