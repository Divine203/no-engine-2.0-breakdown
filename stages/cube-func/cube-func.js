// <reference path="libs/gl-matrix.min.js" />

const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl2");

const getAndCompileShader = (id) => {
    let shader;
    let shaderElement = document.getElementById(id);
    let shaderText = shaderElement.textContent.trim();

    if (id.includes('vertex')) {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    }

    gl.shaderSource(shader, shaderText);
    gl.compileShader(shader);

    // if there are any errors after compiling the shader
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

const createCube = () => {
    const cube = {};
    cube.vertices = [
        // Front face (z = 0.5)
        -0.5, -0.5, 0.5,  // bottom-left
        0.5, -0.5, 0.5,  // bottom-right
        0.5, 0.5, 0.5,  // top-right
        0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, -0.5, 0.5,

        // Back face (z = -0.5)
        -0.5, -0.5, -0.5,
        -0.5, 0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, -0.5, -0.5,
        -0.5, -0.5, -0.5,

        // Left face (x = -0.5)
        -0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, 0.5, -0.5,
        -0.5, -0.5, -0.5,

        // Right face (x = 0.5)
        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, -0.5, -0.5,

        // Top face (y = 0.5)
        -0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,
        -0.5, 0.5, -0.5,

        // Bottom face (y = -0.5)
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        -0.5, -0.5, 0.5,
        -0.5, -0.5, -0.5,
    ];

    let faceColors = [
        [1.0, 0.0, 0.0, 1.0],
        [0.0, 1.0, 0.0, 1.0],
        [0.0, 0.0, 1.0, 1.0],
        [1.0, 1.0, 0.0, 1.0],
        [1.0, 0.0, 1.0, 1.0],
        [0.0, 1.0, 1.0, 1.0]
    ];

    cube.colors = [];

    faceColors.forEach((color) => {
        for (let i = 0; i < 6; i++) {
            cube.colors = cube.colors.concat(color);
        }
    });

    cube.positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, cube.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.vertices), gl.STATIC_DRAW);



    cube.colorBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, cube.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.colors), gl.STATIC_DRAW);

    cube.vertexShader = getAndCompileShader("vertexShader");
    cube.fragmentShader = getAndCompileShader("fragmentShader");

    cube.shaderProgram = gl.createProgram();

    gl.attachShader(cube.shaderProgram, cube.vertexShader);
    gl.attachShader(cube.shaderProgram, cube.fragmentShader);

    gl.linkProgram(cube.shaderProgram);


    if (!gl.getProgramParameter(cube.shaderProgram, gl.LINK_STATUS)) {
        console.error("Could not link shaders");
    }

    cube.vao = gl.createVertexArray(); // vao: valuable for performance, organization, and managing multiple objects.
    gl.bindVertexArray(cube.vao);

    gl.useProgram(cube.shaderProgram);

    cube.positionAttributeLocation = gl.getAttribLocation(cube.shaderProgram, "position");
    gl.enableVertexAttribArray(cube.positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.positionBuffer);
    gl.vertexAttribPointer(cube.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    cube.colorAttributeLocation = gl.getAttribLocation(cube.shaderProgram, "color");
    gl.enableVertexAttribArray(cube.colorAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.colorBuffer);
    gl.vertexAttribPointer(cube.colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);

    cube.modelMatrix = mat4.create();
    cube.modelMatrixLocation = gl.getUniformLocation(cube.shaderProgram, "modelMatrix");

    return cube;
}

// mat4 is from the gl-matrix lib

const cube = createCube();

const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();

mat4.perspective(projectionMatrix, 45 * Math.PI / 180.0, canvas.width / canvas.height, 0.1, 10); // 45deg to radians

// link to them to the locations in the shaders.

const viewMatrixLocation = gl.getUniformLocation(cube.shaderProgram, "viewMatrix");
const projectionMatrixLocation = gl.getUniformLocation(cube.shaderProgram, "projectionMatrix");

gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);

let angle = 0;

// Do actual drawing

const runRenderLoop = () => {
    gl.clearColor(0, 0, 0, 1);

    // add depth test to sort properly
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    angle += 0.1;

    // cube 1
    mat4.identity(cube.modelMatrix);

    mat4.translate(cube.modelMatrix, cube.modelMatrix, [0, 0, -7]);
    mat4.rotateY(cube.modelMatrix, cube.modelMatrix, angle);
    mat4.rotateX(cube.modelMatrix, cube.modelMatrix, angle / 8);

    gl.uniformMatrix4fv(cube.modelMatrixLocation, false, cube.modelMatrix);
    gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);

    gl.useProgram(cube.shaderProgram);
    gl.bindVertexArray(cube.vao); // vao: valuable for performance, organization, and managing multiple objects.

    gl.drawArrays(gl.TRIANGLES, 0, 36);

    requestAnimationFrame(runRenderLoop);
}

requestAnimationFrame(runRenderLoop);

