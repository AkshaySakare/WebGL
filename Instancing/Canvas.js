// MainFucntion -->
var canvas = null;
var gl = null;
var bFullscreen = false;
var canvas_original_width;
var canvas_original_height;
var count = 0.0;


const VertexAttributeEnum = {
    AMC_ATTRIBUTE_POSITION: 0,
    AMC_ATTRIBUTE_COLOR: 1,
    AMC_ATTRIBUTE_OFFSET: 2,
};

var shaderProgramObject = null;

var vao = null;
var vbo = null;
var vbo_color = null;
var vbo_offset = null;
var mvpUniform;
var countData;
var isDone = false;

var parspectiveProjectionMatrix;

var requestAnimationFrame = window.requestAnimationFrame || // chrome
    window.webkitRequestAnimationFrame || // safari
    window.wozRequestAnimationFrame || // firefox
    window.oRequestAnimationFrame || //opera
    window.msRequestAnimationFrame; // ms edge

function main() {//Get canvas from dom
    canvas = document.getElementById("APS");
    if (canvas == null) {
        console.log("Getting Canvas Failed. \n");
    }
    else {
        console.log("Getting Canvas Successful. \n");
    }
    // set width and height
    canvas_original_width = canvas.width;
    canvas_original_height = canvas.height;




    // register for keyboard events
    window.addEventListener("keydown", keyDown, false);
    // register for Mouse events
    window.addEventListener("click", mouseDown, false);
    window.addEventListener("resize", resize, false);

    initialize();
    resize();
    display();

}
function keyDown(event) {
    switch (event.key) {

        case "Q":
        case "q":
            uinitialize();
            break;

        case "f":
        case "F":
            toggleFullscreen();

            break;
    }

}



function mouseDown(event) {
    alert("Mouse Down is Pressed");

}

function initialize() {
    //get context from canvas
    gl = canvas.getContext("webgl2");

    if (gl == null) {
        console.log("getting  webgl Context Failed. \n");
    }
    else {
        console.log("getting webgl Context Successful. \n");
    }
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    //vertexShader
    var vertexShederSourceCode =
        "#version 300 es"
        + "\n"
        + "in vec4 aPosition;"
        + "uniform mat4 uMVPMatrix;"
        + "in vec3 voffset;"
        + "in vec4 aColor;"
        + "out vec4 oColor;"
        + "\n"
        + "void main(void)"
        + "{"
        + " gl_Position = uMVPMatrix * (aPosition+ vec4(voffset, 0));"
        + "oColor = aColor;"
        + "}";

    var vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShaderObject, vertexShederSourceCode);
    gl.compileShader(vertexShaderObject);

    if (gl.getShaderParameter(vertexShaderObject, gl.COMPILE_STATUS) == false) {
        var error = gl.getShaderInfoLog(vertexShaderObject);
        if (error.length > 0) {
            var log = "VertexShader Compile Error:" + error;
            alert(log);
            uinitialize();
        }
    } else {
        console.log("Vertex shader Compile Sucessfully");
    }
    // fragment shader 
    var fragmentShaderSourceCode =
        "#version 300 es"
        + "\n"
        + "precision highp float;"
        + "out vec4 FragColor;"
        + "in vec4 oColor;"
        + "\n"
        + "void main(void)"
        + "{"
        + " FragColor = oColor;"
        + "}";

    var fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShaderObject, fragmentShaderSourceCode);
    gl.compileShader(fragmentShaderObject);

    if (gl.getShaderParameter(fragmentShaderObject, gl.COMPILE_STATUS) == false) {
        var error = gl.getShaderInfoLog(fragmentShaderObject);
        if (error.length > 0) {
            var log = "FragmentShader Compile Error:" + error;
            alert(log);
            uinitialize(); // to avoide 
        }
    } else {
        console.log("Fragment shader Compile Sucessfully\n");
    }
    // shader program
    shaderProgramObject = gl.createProgram();
    gl.attachShader(shaderProgramObject, vertexShaderObject);
    gl.attachShader(shaderProgramObject, fragmentShaderObject);

    gl.bindAttribLocation(shaderProgramObject, VertexAttributeEnum.AMC_ATTRIBUTE_POSITION, "vPosition");
    gl.bindAttribLocation(shaderProgramObject, VertexAttributeEnum.AMC_ATTRIBUTE_COLOR, "oColor");
    gl.bindAttribLocation(shaderProgramObject, VertexAttributeEnum.AMC_ATTRIBUTE_OFFSET, "voffset");
    gl.linkProgram(shaderProgramObject);
    if (!gl.getProgramParameter(shaderProgramObject, gl.LINK_STATUS)) {
        var error = gl.getShaderInfoLog(shaderProgramObject);
        if (error.length > 0) {
            var log = "ShaderProgram Linking Error:" + error;
            alert(log);
            uinitialize();

        }
    } else {
        console.log("ShaderProgram Link Sucessfully\n");
    }

    //GET UNIFORM LOCATION

    mvpUniform = gl.getUniformLocation(shaderProgramObject, "uMVPMatrix");
    // geometry attributes declartion

    var triangle_position = new Float32Array([
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0


    ]);

    const offsets = new Float32Array([
        -3.0, -3.0, -10.0,
        3.0, -3.0, -10.0,
        -3.0, 3.0, -10.0,
        3.0, 3.0, -10.0,
        -14.0, -14.0, -31.0,
        14.0, -14.0, -31.0,
        -14.0, 14.0, -31.0,
        14.0, 14.0, -31.0
    ]);
    countData = offsets.length / 2;
    let triangleColor = new Float32Array([1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0,
        1.0, 1.0, 0.0]);

    let translations = new Float32Array([100]);
    let index = 0;
    let offset = 0; // Make sure to define the offset variable as per your requirement

    for (let y = -10.0; y < 10.0; y += 2.0) {
        for (let x = -10.0; x < 10.0; x += 2.0) {
            let translation = [];
            translation[0] = x / 1.0 + offset;
            translation[1] = y / 1.0 + offset;
            translation[2] = -1.0;
            translations[index++] = translation;
        }
    }
    console.log(translations);


    let translationss = [];
    let offsett = 2.1; // Define the offset if needed
    for (let y = -10.0; y < 10.0; y += 2.0) {
        for (let x = -10.0; x < 10.0; x += 2.0) {
            translationss.push(x / 0.8 + offsett, y / 0.8 + offsett, -1.0);
        }
    }

    console.log(translationss);
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, triangle_position, gl.STATIC_DRAW);
    gl.vertexAttribPointer(VertexAttributeEnum.AMC_ATTRIBUTE_POSITION, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VertexAttributeEnum.AMC_ATTRIBUTE_POSITION);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    //  gl.bindVertexArray(null);

    vbo_color = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_color);
    gl.bufferData(gl.ARRAY_BUFFER, triangleColor, gl.STATIC_DRAW);
    gl.vertexAttribPointer(VertexAttributeEnum.AMC_ATTRIBUTE_COLOR, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VertexAttributeEnum.AMC_ATTRIBUTE_COLOR);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    //gl.bindVertexArray(null);

    vbo_offset = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_offset);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(translationss), gl.STATIC_DRAW);
    gl.vertexAttribPointer(VertexAttributeEnum.AMC_ATTRIBUTE_OFFSET, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VertexAttributeEnum.AMC_ATTRIBUTE_OFFSET);
    gl.vertexAttribDivisor(VertexAttributeEnum.AMC_ATTRIBUTE_OFFSET, 1);





    //glBindVertexArray(0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);


    // depth
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    //init projection matrix
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    parspectiveProjectionMatrix = mat4.create();

    // parspectiveProjectionMatrix = mat4.create();
}

function resize() {
    if (bFullscreen == true) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        canvas.width = canvas_original_width;
        canvas.height = canvas_original_height;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);

    //set projectio
    mat4.perspective(parspectiveProjectionMatrix, 45.0, parseFloat(canvas.width) / parseFloat(canvas.height), 1.0, 100.0);

}

function display() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shaderProgramObject);
    var modelViewMatrix = mat4.create();
    var modelViewProjectionMatrix = mat4.create();


    //modelViewMatrix = (0.0,0.0,-3.0);

    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -23.0]);

    mat4.multiply(modelViewProjectionMatrix, parspectiveProjectionMatrix, modelViewMatrix);
    gl.uniformMatrix4fv(mvpUniform, false, modelViewProjectionMatrix);
    gl.bindVertexArray(vao);
    // gl.drawArrays(gl.TRIANGLES, 0, 3);
    //gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 100);
    gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, 4, count);
    gl.bindVertexArray(null);

    gl.useProgram(null);

    update();

    requestAnimationFrame(display, canvas);
}

function update() {
    if (count <= 100) {
        if (isDone == false) {
            count = count + 0.5;
        } else {
            count = count - 0.5;
        }
    }
    if (count == 100.0) {
        isDone = true;
    }
}
function uinitialize() {
    if (shaderProgramObject != null) {
        gl.useProgram(shaderObjects);
        var shaderObjects = gl.attachShader(shaderProgramObject);
        if (shaderObjects && shaderObjects.length > 0) {
            for (let i = 0; i < shaderObjects.length; i++) {
                gl.detachShader(shaderProgramObject, shaderObjects[i]);
                gl.deleteShader(shaderObjects[i]);
                shaderObjects[i] = null;
            }

        }
    }
    window.close();

}
function toggleFullscreen() {

    var fullscreenElement =
        document.fullscreenElement
        || document.webkitFullscreenElement
        || document.mozFullScreenElement
        || document.msFullscreenElement
        || null;

    if (fullscreenElement == null) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        } else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen();
        } else if (canvas.mozRequestFullScreen) {
            canvas.mozRequestFullScreen();
        } else if (canvas.msRequestFullscreen) {
            canvas.msRequestFullscreen();
        }
        bFullscreen = true;
    } else {// already full screen

        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        bFullscreen = false;
    }


}
