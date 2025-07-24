// <reference path="libs/gl-matrix.min.js" />

const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl2");

const vertices = [
  // Front face (z = 0.5)
  -0.5, -0.5,  0.5,  // bottom-left
   0.5, -0.5,  0.5,  // bottom-right
   0.5,  0.5,  0.5,  // top-right
   0.5,  0.5,  0.5,
  -0.5,  0.5,  0.5,
  -0.5, -0.5,  0.5,

  // Back face (z = -0.5)
  -0.5, -0.5, -0.5,
  -0.5,  0.5, -0.5,
   0.5,  0.5, -0.5,
   0.5,  0.5, -0.5,
   0.5, -0.5, -0.5,
  -0.5, -0.5, -0.5,

  // Left face (x = -0.5)
  -0.5, -0.5, -0.5,
  -0.5, -0.5,  0.5,
  -0.5,  0.5,  0.5,
  -0.5,  0.5,  0.5,
  -0.5,  0.5, -0.5,
  -0.5, -0.5, -0.5,

  // Right face (x = 0.5)
   0.5, -0.5, -0.5,
   0.5,  0.5, -0.5,
   0.5,  0.5,  0.5,
   0.5,  0.5,  0.5,
   0.5, -0.5,  0.5,
   0.5, -0.5, -0.5,

  // Top face (y = 0.5)
  -0.5,  0.5, -0.5,
  -0.5,  0.5,  0.5,
   0.5,  0.5,  0.5,
   0.5,  0.5,  0.5,
   0.5,  0.5, -0.5,
  -0.5,  0.5, -0.5,

  // Bottom face (y = -0.5)
  -0.5, -0.5, -0.5,
   0.5, -0.5, -0.5,
   0.5, -0.5,  0.5,
   0.5, -0.5,  0.5,
  -0.5, -0.5,  0.5,
  -0.5, -0.5, -0.5,
];


const getAndCompileShader = (id) => {
    let shader;
    let shaderElement = document.getElementById(id);
    let shaderText = shaderElement.textContent.trim();

    if(id.includes('vertex')) {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } 

    gl.shaderSource(shader, shaderText);
    gl.compileShader(shader);

    // if there are any errors after compiling the shader
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

const positionBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

const faceColors = [
    [1.0, 0.0, 0.0, 1.0], 
    [0.0, 1.0, 0.0, 1.0],
    [0.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [0.0, 1.0, 1.0, 1.0]
];

let colors = [];

faceColors.forEach((color) => {
    for (let i = 0; i < 6; i++) {
        colors = colors.concat(color);
    }
});

const colorBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

const vertexShader = getAndCompileShader("vertexShader");
const fragmentShader = getAndCompileShader("fragmentShader");

const shaderProgram = gl.createProgram();

gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);

gl.linkProgram(shaderProgram);


if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error("Could not link shaders");
}

gl.useProgram(shaderProgram);

const positionAttributeLocation = gl.getAttribLocation(shaderProgram, "position"); 
gl.enableVertexAttribArray(positionAttributeLocation); 
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

const colorAttributeLocation = gl.getAttribLocation(shaderProgram, "color");
gl.enableVertexAttribArray(colorAttributeLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);


// mat4 is from the gl-matrix lib

const modelMatrix = mat4.create();
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();

mat4.perspective(projectionMatrix, 45 * Math.PI/180.0, canvas.width/canvas.height, 0.1, 10); // 45deg to radians

// link to them to the locations in the shaders.
const modelMatrixLocation = gl.getUniformLocation(shaderProgram, "modelMatrix");
const viewMatrixLocation = gl.getUniformLocation(shaderProgram, "viewMatrix");
const projectionMatrixLocation = gl.getUniformLocation(shaderProgram, "projectionMatrix");

gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);

let angle = 0;

// Do actual drawing

const runRenderLoop = () => {
    gl.clearColor(0, 0, 0, 1);

    // add depth test to sort properly
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);


    mat4.identity(modelMatrix);

    // out: the matrix where the result will be written to (your destination)
    // a: the input matrix you want to transform (your source)
    mat4.translate(modelMatrix, modelMatrix, [0, 0, -7]); // out, a, [x, y, z] (translation) <- this is to move the camera further from the cube
    mat4.rotateY(modelMatrix, modelMatrix, angle); // out, a, angle
    mat4.rotateX(modelMatrix, modelMatrix, angle/8); // out, a, angle

    angle += 0.1;

    //Note: Translate before you rotate.

    gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);
    gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, 36);

    requestAnimationFrame(runRenderLoop);
}

requestAnimationFrame(runRenderLoop);   

