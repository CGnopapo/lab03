

// Rotação?
// Modificar tamanho dos discos via input?
// Botar tudo na conta do


////////////////////////////////////////////////////////////////////////
//++++++++++++++++++++++++++++++++++     ++++++++++++++++++++++++++++++
////////////////////////////////////////////////////////////////////////

const FUNDO = [0, 1, 1, 1];
let DISCO_RES = 3;
var gl;
var gCanvas;
var gShader = {};
var gVertexShaderSrc;
var gFragmentShaderSrc;
var gPosicoes = [];
var gCores = [];
var gObjetos = [];
var gUltimoT = Date.now();
var gPausado = false;


window.onload = main;

function main() {
    gCanvas = document.getElementById("glcanvas");
    gl = gCanvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");


    let botao_pause = document.getElementById("pause");
    botao_pause.onclick = callbackbotao

    let botao_passo = document.getElementById("passo");
    botao_passo.onclick = callbackbotao

    let range = document.getElementById("ref");
    let range_velo = document.getElementById("velo");
    range.onchange = callbackrange;
    range_velo.onchange = callbackrange;


    window.onkeydown = callbackkey


    let vx = range_velo.value
    let vy = range_velo.value
    gObjetos.push(new Disco(50, 140, sorteieInteiro(50, 80), vx, vy, sorteieCorRGBA()));
    gObjetos.push(new Disco(150, 240, sorteieInteiro(15, 50), vx, vy, sorteieCorRGBA()));

    crieShaders();

    gl.clearColor(FUNDO[0], FUNDO[1], FUNDO[2], FUNDO[3]);

    desenhe();
}


function desenhe() {

    if (!gPausado) {

        let now = Date.now();
        let delta = (now - gUltimoT) / 1000;

        gUltimoT = now;
        gPosicoes = [];
        gCores = []
        for (let i = 0; i < gObjetos.length; i++){
            gObjetos[i].atualize_vertices(delta)
        }

        atualiza_buffer_e_draw()

        window.requestAnimationFrame(desenhe);
    }
}


function Disco(x, y, r, vx, vy, cor) {
    this.vertices = aproximeDisco(r, DISCO_RES);
    this.nv = this.vertices.length;
    this.vel = vec2(vx, vy);
    this.cor = cor;
    this.pos = vec2(x, y);
    this.r = r
    let centro = this.pos;
    let nv = this.nv;
    let vert = this.vertices;
    for (let i = 0; i < nv; i++) {
        let k = (i + 1) % nv;
        gPosicoes.push(centro);
        gPosicoes.push(add(centro, vert[i]));
        gPosicoes.push(add(centro, vert[k]));

        gCores.push(cor);
        gCores.push(cor);
        gCores.push(cor);
    }

    this.atualize_vertices = function (delta) {
        this.pos = add(this.pos, mult(delta, this.vel));
        let x, y;
        let vx, vy;
        [x, y] = this.pos;
        [vx, vy] = this.vel;

        if (x < r) { x = 2 * r - x; vx = -vx; };
        if (y < r) { y = 2 * r - y; vy = -vy; };
        if (x >= gCanvas.width - r) { x = 2 * (gCanvas.width - r) - x; vx = -vx; };
        if (y >= gCanvas.height - r) { y = 2 * (gCanvas.height - r) - y; vy = -vy; };
        let centro = this.pos = vec2(x, y);
        this.vel = vec2(vx, vy);

        let nv = this.nv;
        let vert = this.vertices;
        for (let i = 0; i < nv; i++) {
            let k = (i + 1) % nv;
            gPosicoes.push(centro);
            gPosicoes.push(add(centro, vert[i]));
            gPosicoes.push(add(centro, vert[k]));

            gCores.push(cor);
            gCores.push(cor);
            gCores.push(cor);
        }
    }
}



function callbackbotao(e) {
    if (e.target.id === "pause") {
        gPausado = !gPausado;
        if (!gPausado) {
            gUltimoT = Date.now();
            desenhe();
        }
    }
    if (e.target.id === "passo") {
        if (gPausado) {
            let delta = 0.1;
            gPosicoes = [];
            for (let i = 0; i < gObjetos.length; i++) {
                gObjetos[i].atualize_vertices(delta);
            }
            atualiza_buffer_e_draw()
        }
    }
}


function callbackrange(e){

    if (e.target.id === "ref") {

        let valor = e.target.value;

        for (let i = 0; i < gObjetos.length; i++) {
            let vertices = aproximeDisco(gObjetos[i].r, valor);
            gObjetos[i].vertices = vertices
            gObjetos[i].nv = vertices.length
        }
    }

    if (e.target.id === "velo") {
        let valor = e.target.value;
        for (let i = 0; i < gObjetos.length; i++) {
            gObjetos[i].vel = mult(( valor/ length(gObjetos[i].vel)), gObjetos[i].vel);
        }
    }
}


function callbackkey(e) {

    if (e.key === " ") {
        gPausado = !gPausado;
        if (!gPausado) {
            gUltimoT = Date.now();
            desenhe();
        }
    }
}


////////////////////////////////////////////////////////////////////////
//+++++++++++++++++++++++++++       +++++++++++++++++++++++++++++++
////////////////////////////////////////////////////////////////////////



function atualiza_buffer_e_draw(){


    gl.bindBuffer(gl.ARRAY_BUFFER, gShader.bufPosicoes);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gPosicoes), gl.STATIC_DRAW);


    gl.bindBuffer(gl.ARRAY_BUFFER, gShader.bufCores);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gCores), gl.STATIC_DRAW);

    gl.uniform2f(gShader.uResolution, gCanvas.width, gCanvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, gPosicoes.length);
}




gVertexShaderSrc = `#version 300 es

// aPosition é um buffer de entrada
in vec2 aPosition;
uniform vec2 uResolution;
in vec4 aColor;  // buffer com a cor de cada vértice
out vec4 vColor; // varying -> passado ao fShader

void main() {
    vec2 escala1 = aPosition / uResolution;
    vec2 escala2 = escala1 * 2.0;
    vec2 clipSpace = escala2 - 1.0;

    gl_Position = vec4(clipSpace, 0, 1);
    vColor = aColor; 
}
`;

gFragmentShaderSrc = `#version 300 es

// Vc deve definir a precisão do FS.
// Use highp ("high precision") para desktops e mediump para mobiles.
precision highp float;

// out define a saída 
in vec4 vColor;
out vec4 outColor;

void main() {
  outColor = vColor;
}
`;

function crieShaders() {
    gShader.program = makeProgram(gl, gVertexShaderSrc, gFragmentShaderSrc);
    gl.useProgram(gShader.program);

    gShader.bufPosicoes = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gShader.bufPosicoes);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gPosicoes), gl.STATIC_DRAW);

    var aPositionLoc = gl.getAttribLocation(gShader.program, "aPosition");

    let size = 2;
    let type = gl.FLOAT;
    let normalize = false;
    let stride = 0;
    let offset = 0;
    gl.vertexAttribPointer(aPositionLoc, size, type, normalize, stride, offset);
    gl.enableVertexAttribArray(aPositionLoc);

    gShader.bufCores = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gShader.bufCores);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gCores), gl.STATIC_DRAW);
    var aColorLoc = gl.getAttribLocation(gShader.program, "aColor");
    gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aColorLoc);

    gShader.uResolution = gl.getUniformLocation(gShader.program, "uResolution");

};

function aproximeDisco(raio, ref = 4) {
    let vertices = [
        vec2(raio, 0),
        vec2(0, raio),
        vec2(-raio, 0),
        vec2(0, -raio),
    ];

    for (let i = 1; i < ref; i++) {
        let novo = [];
        let nv = vertices.length;
        for (let j = 0; j < nv; j++) {
            novo.push(vertices[j]);
            let k = (j + 1) % nv;
            let v0 = vertices[j];
            let v1 = vertices[k];
            let m = mix(v0, v1, 0.5);

            let s = raio / length(m);
            m = mult(s, m)
            novo.push(m);
        }
        vertices = novo;
    }
    return vertices;
}
