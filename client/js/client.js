var address = "localhost";
var port    = "8080";
var socket  = null;

window.onload = function() {
    let canvas    = document.getElementById("canvas");
    let context   = canvas.getContext("2d");
    canvas.width  = window.innerWidth - $('.navbar').innerWidth();
    canvas.height = window.innerHeight;

    let map = new GridMAP(null, 10, canvas);

    // Define mouse events:
    let mouse = {
        x: 0,
        y: 0,
        isPressed: false
    };

    window.addEventListener('wheel', function(event) {
        map.setZoom(event.deltaY);
    });
    /*window.addEventListener('mousedown', function(event) {
        event = event || window.event;
        let x = (event.pageX || event.clientX) - canvas.getBoundingClientRect().left;
        let y = (event.pageY || event.clientY) - canvas.getBoundingClientRect().top;

        mouse.isPressed = true;
        mouse.x = x;
        mouse.y = y;
    });
    window.addEventListener('mouseup', function(event) {
        mouse.isPressed = false;
    });
    window.addEventListener('mousemove', function(event) {
        if(mouse.isPressed) {
            event = event || window.event;
            let x = (event.pageX || event.clientX) - canvas.getBoundingClientRect().left;
            let y = (event.pageY || event.clientY) - canvas.getBoundingClientRect().top;
            
            let moveX = 0;
            let moveY = 0;

            if(mouse.x - x > 50)
                moveX = 2;
            else if(mouse.x - x < 50)
                moveX = -2;
            if(mouse.y - y > 50)
                moveY = 2;
            if(mouse.y - y < 50)
                moveY = -2;


            map.addXY(moveX, moveY);
        }
    });*/
}

function toggleConnect() {
    // Try to connect:
    if(!socket)
        openWebsocket();
    // Close connection:
    else
        socket.close();
}

function openWebsocket() {
    try {
        address = document.getElementById('ip').value;
        port    = document.getElementById('port').value;

        socket = new WebSocket("ws://" + address + ":" + port);

        // When the connection is open, update the connection status:
        socket.onopen = function () {
            console.log("Connected");
            $("#connect").html("DISCONNECT");
            $('#ip').prop('disabled', true);
            $('#port').prop('disabled', true);
            
            let msg = { command: 'app_socket' };
            send(msg);
            send({command: 'start_robot'})
        };

        // Log errors:
        socket.onerror = function (error) {
            console.log("Disconnected");
        };

        // Update
        socket.onclose = function (event) {
            console.log('WebSocket is closed');

            // Code 1006: Abnormal Closure (https://www.iana.org/assignments/websocket/websocket.xml):
            if(event.code === 1006)
                alert("CONNECTION REFUSED:\nCheck if the IP:Port is correct and listening to connections.");

            socket = null;

            // Enable address input:
            $('#ip').prop('disabled', false);
            $('#port').prop('disabled', false);
        };

        // Log messages from the server
        socket.onmessage = function(event) {
            console.log('Server: ' + event.data);
        };

    } catch(exception) {
        console.log(exception);
    }
}

function send(object) {
    try {
        socket.send(JSON.stringify(object));
    } catch(e) {
        return;
    }
}