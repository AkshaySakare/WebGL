// MainFucntion -->
var canvas = null;
var gl = null;
var bFullscreen = false;
var canvas_original_width;
var canvas_original_height;
   var cameraPosition = [0, 0, 3];
const VertexAttributeEnum = {
    AMC_ATTRIBUTE_POSITION: 0,
	AMC_ATTRIBUTE_COLOR: 1,
};

var shaderProgramObject = null;

var vao = null;
var vbo = null;
var vbo_color = null;
var mvpUniform;
var timeUniform;
var glTime = getCurrentTime();
const starCount = 10000;
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
        + "in vec4 aColor;"
		+ "uniform  highp float time;"
        + "out vec4 oColor;"
        + "\n"
        + "void main(void)"
        + "{"
		+ "vec4 newVertex = aPosition; "
        + "newVertex.z +=  time;"
        + " newVertex.z = fract(newVertex.z); "
       
        + "float size = (4.0 * newVertex.z * newVertex.z); "
        + "oColor = smoothstep(1.0,7.0,size)*aColor;"
		+" newVertex.z = (999.9 * newVertex.z) - 1000.0;  "
			+"  gl_PointSize = size;"
        + " gl_Position = uMVPMatrix * newVertex;"
	
        
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
        + " FragColor = vec4(1.0, 1.0, 1.0, 1.0);"
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
    timeUniform = gl.getUniformLocation(shaderProgramObject, "time");
    // geometry attributes declartion


		 let triangleColor = new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]);
   
   
    const positions = new Float32Array(starCount*3 );

    for (let i = 0; i < starCount; i++) {
       // positions[i * 3] = Math.random() * 2 - 1;
        //positions[i * 3 + 1] = Math.random() * 2 - 1;
        //positions[i * 3 + 2] = Math.random() * 2 - 1;

        positions[i] = (Math.random() * 2 - 1)*100.0;
        positions[i + 1] = (Math.random() * 2 - 1)-100.0;
        positions[i + 2] = (Math.random() - 100.0);
    }
	
   vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.vertexAttribPointer(VertexAttributeEnum.AMC_ATTRIBUTE_POSITION, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VertexAttributeEnum.AMC_ATTRIBUTE_POSITION);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  //  gl.bindVertexArray(null);
	

    gl.bindVertexArray(null);


    // depth
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
	    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
 
    //init projection matrix
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
	
	parspectiveProjectionMatrix = mat4.create();
   
   // parspectiveProjectionMatrix = mat4.create();
}
function getCurrentTime(){
    let currentTime = Date.now();
let formattedTime = currentTime.toFixed(6);
return 	formattedTime;
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
	 mat4.perspective( parspectiveProjectionMatrix,45.0, parseFloat(canvas.width) / parseFloat(canvas.height), 0.1, 100.0);
	  
}

function display() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shaderProgramObject);
    var currentTime = getCurrentTime();
    var t1 = parseFloat((currentTime - glTime) / 1000.0);
    t1 = t1 * 0.1;
    t1 = t1 - Math.floor(t1);
    gl.uniform1f(timeUniform, t1);

   
   
    var modelViewMatrix = mat4.create();
    var modelViewProjectionMatrix = mat4.create();

	 

    mat4.multiply(modelViewProjectionMatrix, parspectiveProjectionMatrix, modelViewMatrix);
    gl.uniformMatrix4fv(mvpUniform, false, modelViewProjectionMatrix);
    gl.bindVertexArray(vao);

    //gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.drawArrays(gl.POINTS, 0, starCount);
    gl.bindVertexArray(null);

    gl.useProgram(null);

update();

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
