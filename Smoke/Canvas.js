// MainFucntion -->
var canvas = null;
var gl = null;
var bFullscreen = false;
var canvas_original_width;
var canvas_original_height;
var timeUniform;
var glTime = getCurrentTime();
var time;
const VertexAttributeEnum = {
    AMC_ATTRIBUTE_POSITION: 0,
    AMC_ATTRIBUTE_COLOR: 1,
};
var audio;
var shaderProgramObject = null;

var vao = null;
var vbo = null;
var vbo_color = null;
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

        case "Q":
        case "q":
            uinitialize();
            break;
        case "P":
        case "p":
            audio = new Audio("pani.mp3");
            audio.play();
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
        + "in vec4 aColor;"
        + "out vec4 oColor;"
        + "\n"
        + "void main(void)"
        + "{"
        + " gl_Position = uMVPMatrix * aPosition;"
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
        `#version 300 es
            precision mediump float;
            uniform float uTime;
             out vec4 FragColor;
         in vec4 oColor;

            float rand(vec2 _st) {
                return fract(sin(dot(_st.xy, vec2(12.9898,78.233))) * 43758.5453);
            }

            float noise(vec2 _st) {
                vec2 i = floor(_st);
    vec2 f = fract(_st);

    // Four corners in 2D of a tile
    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
            
            }

            float fbm(vec2 _st) {
                 float v = 0.0;
    float a = 0.2;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < 6; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
            }

            void main(void) {
                 vec2 st = gl_FragCoord.xy/(10.0*50.0)*3.0;
    // st += st * abs(sin(uTime*0.1)*3.0);
    vec3 color = vec3(0.0);

    vec2 q = vec2(0.);
    q.x = fbm( st + 0.00*uTime);
    q.y = fbm( st + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*uTime );
    r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*uTime);

    float f = fbm(st+r);

   color = mix(vec3(0.587,0.611,0.667),
                vec3(0.666667,0.666667,0.498039),
                clamp((f*f)*2.120,0.0,1.0));

    color = mix(color,
                vec3(0.0,0.0,0.1),
                clamp(length(q),0.0,1.0));

    color = mix(color,
                vec3(0.819,1.000,0.981),
                clamp(length(r.x),0.0,1.0));

                FragColor = vec4((f*f*f+.6*f*f+.5*f)*color,0.9);
            }
        `;


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
    timeUniform = gl.getUniformLocation(shaderProgramObject, "uTime");

    // geometry attributes declartion

    var square_position = new Float32Array([
        -3.0, -3.0,
        3.0, -3.0,
        -3.0, 3.0,
        3.0, 3.0,

    ]);
    //let triangleColor = new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]);
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, square_position, gl.STATIC_DRAW);
    gl.vertexAttribPointer(VertexAttributeEnum.AMC_ATTRIBUTE_POSITION, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VertexAttributeEnum.AMC_ATTRIBUTE_POSITION);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    //  gl.bindVertexArray(null);




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
    mat4.perspective(parspectiveProjectionMatrix, 45.0, parseFloat(canvas.width) / parseFloat(canvas.height), 0.1, 100.0);

}

function getCurrentTime() {
    let currentTime = Date.now();
    let formattedTime = currentTime.toFixed(6);
    return formattedTime;
}
var t = 0.0;
function display() {







    var currentTime = getCurrentTime();
    var t1 = parseFloat((currentTime - glTime) / 10.0);
    t1 = t1 * 0.1;
    t1 = t1 - Math.floor(t1);
    time *= 0.1;
    t = t + 0.1;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shaderProgramObject);
    var modelViewMatrix = mat4.create();
    var modelViewProjectionMatrix = mat4.create();
    // gl.uniform1f(timeUniform, t1);
    //modelViewMatrix = (0.0,0.0,-3.0);
    gl.uniform1f(gl.getUniformLocation(shaderProgramObject, "uTime"), t);
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -3.0]);

    mat4.multiply(modelViewProjectionMatrix, parspectiveProjectionMatrix, modelViewMatrix);
    gl.uniformMatrix4fv(mvpUniform, false, modelViewProjectionMatrix);
    gl.bindVertexArray(vao);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

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
