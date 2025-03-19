window.addEventListener('load', function() {
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
});