const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl2");

const triangleVertices = [
    1.0, -1.0, 0.0,
    0.0, 1.0, 0.0,
    -1.0, -1.0, 0.0
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

const triangleVertexPositionBuffer = gl.createBuffer(); // create a buffer in the GPU

// Bind the buffer so all future ARRAY_BUFFER calls affect `triangleVertexPositionBuffer`.
// Think of bindBuffer like "selecting" this buffer to work on.
gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);

// Send our triangle vertex data to the GPU.
// gl.STATIC_DRAW means: "this data won't change often"
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);

const triangleColors = [
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0
];

const triangleVertexColorBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleColors), gl.STATIC_DRAW);

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

// link our gate to the triangleBuffer again inorder to send the data to the position attribute in the vertex shader
gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);


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
gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);


// Note: You can combine the position and color array data into one array and make one buffer for it. 
// You then use the size and offset params of `vertexAttribPointer` to specify how the data should be read in the shaders


// Do actual drawing

const runRenderLoop = () => {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT); // set the color every pixel to (0, 0, 0, 1) [black]

    // draw trianle (shape, offset, amount of vertices to draw)
    gl.drawArrays(gl.TRIANGLES, 0, 3); //gl.TRIANGLE tell the GL that the vertices should form a triangle

    requestAnimationFrame(runRenderLoop);
}

requestAnimationFrame(runRenderLoop);   

