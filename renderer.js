const serialport = require('serialport')
const Readline = require('@serialport/parser-readline');


var options = {
    baudRate: 0,
    port: '',
    portList: [],
    delimiter: '\n',
}

// closes previous ports and refresh port list
async function listSerialPorts() {
    await serialport.list().then((ports, err) => {
        if (err) {
            statusAlert(err.message);
            return;
        } else {
            document.getElementById('error').textContent = '';
        }

        //console.log('ports', ports);
        //console.log(options.portList);

        if (ports.length === 0) {
            statusAlert('No ports discovered');
            document.getElementById("portPath").innerHTML = "<option></option>"; //empty portlist dropdown
        } else {
            options.portList = ports.map(e => e.path);
            var recognizedPorts = "";
            options.portList.forEach(function (path, i) {
                recognizedPorts += `<option value="${i}">${path}</option>`;
            })
            document.getElementById("portPath").innerHTML = recognizedPorts; // fill portlist dropdown
            statusAlert(`${ports.length} port(s) found`);
        }
    })
}

function getUserInput() {
    var e = document.getElementById("portPath");
    options.port = e.options[e.selectedIndex].text;

    var p = document.getElementById("baudValue");
    options.baudRate = parseInt(p.options[p.selectedIndex].text);
}

// convert a string to individual bytes
function stringToBytes(str) {
    var ch, st, re = [];
    for (var i = 0; i < str.length; i++) {
        ch = str.charCodeAt(i);  // get char 
        st = [];                 // set up "stack"
        do {
            st.push(ch & 0xFF);  // push byte to stack
            ch = ch >> 8;          // shift value down by 1 byte
        }
        while (ch);
        // add stack contents to result
        // done because chars have "wrong" endianness
        re = re.concat(st.reverse());
    }
    // return an array of bytes
    return re;
}

function statusAlert(text) {
    document.getElementById('error').classList.remove('showit'); // remove previous
    document.getElementById('error').classList.remove('hideit');

    document.getElementById('error').textContent = text;
    document.getElementById('error').classList.add('showit');
    setTimeout(function () {
        document.getElementById('error').classList.remove('showit');
        document.getElementById('error').classList.add('hideit');
    }, 7000)
}

function frameRenderer(framedata) {
    var cvs = document.getElementById('canvas');
    var ctx = cvs.getContext('2d');

    var c_width = cvs.width;
    var c_height = cvs.c_height;
    var imageX, imageY;
    imageX = imageY = 30;

    var preimageData = stringToBytes(framedata);
    if ((preimageData < 900) || (preimageData > 901)) {
        return; // invalid frame
    } else {
        ctx.clearRect(0, 0, c_width, c_height);

        // loop through 900 pixel and set color for each pixel (bottom right -> top left)
        var count = 0;
        for (let i = imageY; i > 0; i--) {
            for (let j = imageX; j > 0; j--) {
                var pixel = preimageData[count]
                ctx.fillStyle = `rgb(${pixel}, ${pixel}, ${pixel})`;
                ctx.fillRect(j * 10, i * 10, -10, -10);
                count++;
            }
        }
    }
}

// open selected port and start parsing
function openPort() {
    getUserInput() // get port and baud values
    const port = new serialport(options.port, { baudRate: options.baudRate }, function (err) {
        if (err) {
            return statusAlert(err.message);
        }
    })
    const parser = port.pipe(new Readline({ delimiter: options.delimiter }));

    port.on("open", () => {
        //console.log(`serial port open at ${port.path}`);
        statusAlert(`Serial port open at ${port.path}`);
    });
    parser.on('data', data => {
        //console.log('data: ', data);
        frameRenderer(data)
    });
}
