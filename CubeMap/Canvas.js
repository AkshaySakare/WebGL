// MainFucntion -->
var canvas = null;
var gl = null;
var bFullscreen = false;
var canvas_original_width;
var canvas_original_height;
var pAngle = 0.0;

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

        + "in vec2 aTexCoord;"
        + "out  vec3 oTexCoord;"
        + "\n"
        + "void main(void)"
        + "{"
        +"vec4 pois = uMVPMatrix * aPosition;"
        + " gl_Position = vec4(pois.x, pois.y, pois.w, pois.w);"
        + "oTexCoord =  vec3(aPosition.x, aPosition.y, -aPosition.z);"
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
        + "uniform samplerCube skybox;"
        + "uniform sampler2D uTextureSampler;"
        + "in vec3 oTexCoord;"
        + "\n"
        + "void main(void)"
        + "{"
        + " FragColor = texture(skybox, oTexCoord);"
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
    textureSamplerUniform = gl.getUniformLocation(shaderProgramObject, "skybox");
    // geometry attributes declartion

    var square_position = new Float32Array([
        1.0, 1.0, 1.0, // top-right of front
        -1.0, 1.0, 1.0, // top-left of front
        -1.0, -1.0, 1.0, // bottom-left of front
        1.0, -1.0, 1.0, // bottom-right of front

        // right
        1.0, 1.0, -1.0, // top-right of right
        1.0, 1.0, 1.0, // top-left of right
        1.0, -1.0, 1.0, // bottom-left of right
        1.0, -1.0, -1.0, // bottom-right of right

        // back
        1.0, 1.0, -1.0, // top-right of back
        -1.0, 1.0, -1.0, // top-left of back
        -1.0, -1.0, -1.0, // bottom-left of back
        1.0, -1.0, -1.0, // bottom-right of back

        // left
        -1.0, 1.0, 1.0, // top-right of left
        -1.0, 1.0, -1.0, // top-left of left
        -1.0, -1.0, -1.0, // bottom-left of left
        -1.0, -1.0, 1.0, // bottom-right of left

        // top
        1.0, 1.0, -1.0, // top-right of top
        -1.0, 1.0, -1.0, // top-left of top
        -1.0, 1.0, 1.0, // bottom-left of top
        1.0, 1.0, 1.0, // bottom-right of top

        // bottom
        1.0, -1.0, 1.0, // top-right of bottom
        -1.0, -1.0, 1.0, // top-left of bottom
        -1.0, -1.0, -1.0, // bottom-left of bottom
        1.0, -1.0, -1.0, // bottom-right of bottom

    ]);
    var square_textcord = new Float32Array([
        1.0, 1.0, // top-right of front
        0.0, 1.0, // top-left of front
        0.0, 0.0, // bottom-left of front
        1.0, 0.0, // bottom-right of front

        // right
        1.0, 1.0, // top-right of right
        0.0, 1.0, // top-left of right
        0.0, 0.0, // bottom-left of right
        1.0, 0.0, // bottom-right of right

        // back
        1.0, 1.0, // top-right of back
        0.0, 1.0, // top-left of back
        0.0, 0.0, // bottom-left of back
        1.0, 0.0, // bottom-right of back

        // left
        1.0, 1.0, // top-right of left
        0.0, 1.0, // top-left of left
        0.0, 0.0, // bottom-left of left
        1.0, 0.0, // bottom-right of left

        // top
        1.0, 1.0, // top-right of top
        0.0, 1.0, // top-left of top
        0.0, 0.0, // bottom-left of top
        1.0, 0.0, // bottom-right of top

        // bottom
        1.0, 1.0, // top-right of bottom
        0.0, 1.0, // top-left of bottom
        0.0, 0.0, // bottom-left of bottom
        1.0, 0.0, // bottom-right of bottom
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
    smiley_texture.image.src = "Smiley.png";
    smiley_texture.image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, smiley_texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, smiley_texture.image);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
  
    //"right.jpg", "left.jpg", "top.jpg", "bottom.jpg", "front.jpg", "back.jpg"

    const faces = [
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: 'right.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: 'left.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: 'top.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: 'bottom.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: 'front.jpg' },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: 'back.jpg' },
    ];

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    faces.forEach((face) => {
        const { target, url } = face;
        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        };
        image.src = url;
    });

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    //init projection matrix
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    parspectiveProjectionMatrix = mat4.create();


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
    var translateMatrix = mat4.create();
    var rotationMatrix = mat4.create();
    var scaleMatrix = mat4.create();
    //modelViewMatrix = (0.0,0.0,-3.0);
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -3.0]);
    mat4.scale(scaleMatrix, scaleMatrix, [12.0, 12.0, 12.0]);
    mat4.multiply(modelViewMatrix, modelViewMatrix, scaleMatrix);
    mat4.rotateY(rotationMatrix, rotationMatrix, degreeToRadian(pAngle));
    mat4.multiply(modelViewMatrix, modelViewMatrix, rotationMatrix);
    mat4.multiply(modelViewProjectionMatrix, parspectiveProjectionMatrix, modelViewMatrix);
    gl.uniformMatrix4fv(mvpUniform, false, modelViewProjectionMatrix);
   
    gl.bindVertexArray(vao);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 8, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 12, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 16, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 20, 4);

    gl.bindVertexArray(null);

    gl.useProgram(null);

    update();

    requestAnimationFrame(display, canvas);
}
function degreeToRadian(degree) {
    return degree * Math.PI / 180.0;
}
function update() {
    pAngle = pAngle + 1.1;
    if (pAngle >= 360.0) {
        pAngle = -360.0;
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
