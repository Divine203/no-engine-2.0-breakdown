const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl2");


// Each face of the cube = 2 triangles
// Each triangle = 3 vertices
// 6 faces × 2 triangles × 3 vertices = 36 vertices
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
    let shaderText = shaderElement.textContent.trim(); // the actual shader code inside the element (trim is necessary to trim spaces/lines)

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

const positionBuffer = gl.createBuffer(); // create a buffer in the GPU

// B ind the buffer so all future ARRAY_BUFFER calls affect `positionBuffer`.
// Think of bindBuffer like "selecting" this buffer to work on.
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// Send our triangle vertex data to the GPU.
// gl.STATIC_DRAW means: "this data won't change often"
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

// fill the colors array with g colors, each for every vertiex in the cube vertices array.
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

const shaderProgram = gl.createProgram(); // create a program

// attach both shades to the program
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);

gl.linkProgram(shaderProgram);

// if there are any errors after linking the program

if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error("Could not link shaders");
}

gl.useProgram(shaderProgram); // use the shader program

// all variables created in the shader code (glsl) all have unique attributes called locations.
// we need to get this attribute locations

const positionAttributeLocation = gl.getAttribLocation(shaderProgram, "position"); // for `in vec3 position`
gl.enableVertexAttribArray(positionAttributeLocation); // preparing the position to recieve configurations

// link our gate to the vertex buffer again inorder to send the data to the position attribute in the vertex shader
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);


// index: attribLocation;
// size: how many values should be taken at once from the array data (3)
// type: gl.FLOAT
// stride: 0 (research better).
// normailized: 0 means change data
// offset: where should the count start from. (0 the begining of the array)
gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0); // (index, size, type, normalized, stride, offset)


// do the same for colors
const colorAttributeLocation = gl.getAttribLocation(shaderProgram, "color");
gl.enableVertexAttribArray(colorAttributeLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);


// Note: You can combine the position and color array data into one array and make one buffer for it. 
// You then use the size and offset params of `vertexAttribPointer` to specify how the data should be read in the shaders


// Do actual drawing

const runRenderLoop = () => {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT); // set the color every pixel to (0, 0, 0, 1) [black]

    // draw trianle (shape, offset, amount of vertices to draw)
    // 36 how many vertices to read
    gl.drawArrays(gl.TRIANGLES, 0, 36); //gl.TRIANGLE tell the GL that the vertices should form a triangle

    requestAnimationFrame(runRenderLoop);
}

requestAnimationFrame(runRenderLoop);   

