// MainFucntion -->
var canvas = null;
var gl = null;
var bFullscreen = false;
var canvas_original_width;
var canvas_original_height;
var timeUniform;
var glTime = getCurrentTime();


const VertexAttributeEnum = {
    AMC_ATTRIBUTE_POSITION: 0,
    AMC_ATTRIBUTE_COLOR: 1,
    AMC_ATTRIBUTE_NORMAL: 2,
    AMC_ATTRIBUTE_TEXCOORD: 3,
};

var shaderProgramObject = null;

var vao = null;
var vbo = null;
var vbo_color = null;
var vbo_texcoords = null;
var smiley_texture = null;
var textureSamplerUniform;
var mvpUniform;

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
        case "P":
        case "p":
            var audio = new Audio("audio.mp3");
            audio.play();
            break;
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
        + "precision highp float;"
        + "in vec3 aPosition;"
        + "uniform mat4 uMVPMatrix;"
        +"uniform float u_time;"
        + "in vec2 aTexCoord;"
        + "out vec2 oTexCoord;"
        + "\n"
        + "void main(void)"
        + "{"
        + " float offset = sin((aPosition.x * 10.0)+ u_time) * 0.1;"
        +" vec3 displacedPosition = aPosition + vec3(0.0, offset, 0.0);"
        + " gl_Position = uMVPMatrix * vec4(aPosition,1.0) ;"
        + "oTexCoord = aTexCoord;"
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
        + "uniform sampler2D uTextureSampler;"
        + "in vec2 oTexCoord;"
         +"uniform float u_time;"
        + "\n"
        + "void main(void)"
        + "{"
        + " vec2 texcoord = oTexCoord;"
        +"texcoord.x += sin((texcoord.y * 4.0*2.0*3.14159) + u_time) / 100.0;"
        + " FragColor = texture(uTextureSampler, texcoord);"
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

    gl.bindAttribLocation(shaderProgramObject, VertexAttributeEnum.AMC_ATTRIBUTE_POSITION, "aPosition");
    gl.bindAttribLocation(shaderProgramObject, VertexAttributeEnum.AMC_ATTRIBUTE_TEXCOORD, "aTexCoord");
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
    textureSamplerUniform = gl.getUniformLocation(shaderProgramObject, "uTextureSampler");
    timeUniform = gl.getUniformLocation(shaderProgramObject, "u_time");
    // geometry attributes declartion

    var square_position = new Float32Array([
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0

    ]);
    var square_textcord = new Float32Array([
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0
    ]);

    //let triangleColor = new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]);
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, square_position, gl.STATIC_DRAW);
    gl.vertexAttribPointer(VertexAttributeEnum.AMC_ATTRIBUTE_POSITION, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VertexAttributeEnum.AMC_ATTRIBUTE_POSITION);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    //  gl.bindVertexArray(null);

    vbo_texcoords = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_texcoords);
    gl.bufferData(gl.ARRAY_BUFFER, square_textcord, gl.STATIC_DRAW);
    gl.vertexAttribPointer(VertexAttributeEnum.AMC_ATTRIBUTE_TEXCOORD, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VertexAttributeEnum.AMC_ATTRIBUTE_TEXCOORD);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);


    // depth
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    smiley_texture = gl.createTexture();
    smiley_texture.image = new Image();
    smiley_texture.image.src = "surface.jpg";
    smiley_texture.image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, smiley_texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, smiley_texture.image);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    //init projection matrix
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    parspectiveProjectionMatrix = mat4.create();
  


}
function getCurrentTime() {
    let currentTime = Date.now();
    let formattedTime = currentTime.toFixed(6);
    return formattedTime;
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
    mat4.perspective(parspectiveProjectionMatrix, 45.0, parseFloat(canvas.width) / parseFloat(canvas.height), 0.1, 100.0);

}

function display() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shaderProgramObject);
    var modelViewMatrix = mat4.create();
    var modelViewProjectionMatrix = mat4.create();
    var currentTime = getCurrentTime();
    var t1 = parseFloat((currentTime - glTime) / 1000.0 * 2);
   // t1 = t1 * 0.1;
   // t1 = t1 - Math.floor(t1);
    gl.uniform1f(timeUniform, t1);
    //modelViewMatrix = (0.0,0.0,-3.0);
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -3.0]);
    mat4.scale(modelViewMatrix, modelViewMatrix, [3.5, 3.0, 3.0]);
    mat4.multiply(modelViewProjectionMatrix, parspectiveProjectionMatrix, modelViewMatrix);
    gl.uniformMatrix4fv(mvpUniform, false, modelViewProjectionMatrix);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, smiley_texture);
    gl.uniform1i(textureSamplerUniform, 0);
    gl.bindVertexArray(vao);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    gl.bindVertexArray(null);

    gl.useProgram(null);



    requestAnimationFrame(display, canvas);
}

function update() {

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
