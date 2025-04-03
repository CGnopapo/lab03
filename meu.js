/* ==================================================
    lab03.js

    Autores:

    NUSP - Nome:
    NUSP - Nome:
    NUSP - Nome:

    Ao preencher esse cabeçalho com os nomes e número USP dos participantes,
    declaramos que todas as partes originais desse exercício programa (EP)
    foram desenvolvidas e implementadas por nosso time e que portanto não
    constituem desonestidade acadêmica ou plágio.

    Declaramos também que somos responsáveis por todas as cópias desse
    programa e que não distribuímos ou facilitamos a sua distribuição.
    Estamos cientes que os casos de plágio e desonestidade acadêmica
    serão tratados segundo os critérios divulgados na página da
    disciplina.
    Entendemos que EPs sem assinatura devem receber nota zero e, ainda
    assim, poderão ser punidos por desonestidade acadêmica.

================================================== */
/**
 * Esqueleto de um programa usando WegGL
 * Dessa vez usando as bibliotecas
 * macWebglUtils.js
 * MVnew.js do livro do Angel -- Interactive Computer Graphics
 */

"use strict";

// ==================================================================
// constantes globais usadas na geração do vídeo

const FUNDO = [0, 1, 1, 1];
const PASSO = 0.1;
const MAX_PENTAS = 50;
const MIN_LADO = 10;
const MAX_LADO = 30;
const MIN_VEL = -40;
const MAX_VEL = 40;



let DISCO_RES = 2;
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


var fatorVel = 5;

window.onload = main;

function main() {
    gCanvas = document.getElementById("glcanvas");
    gl = gCanvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");


    let botao_pause = document.getElementById("pButton");
    botao_pause.onclick = callbackbotao

    let range_velo = document.getElementById("velSlider");
    range_velo.onchange = callbackrange;

    let nd_velo = document.getElementById("ndSlider");
    nd_velo.onchange = callbackrange;

    window.onkeydown = callbackkey


    for (let i = 0; i < parseInt(nd_velo.value); i++) {
        pushPenta();
    }
    // let vx = range_velo.value
    // let vy = range_velo.value
    // gObjetos.push(new Penta(50, 140, sorteieInteiro(50, 80), vx, vy, sorteieCorRGBA()));
    // gObjetos.push(new Penta(150, 240, sorteieInteiro(15, 50), vx, vy, sorteieCorRGBA()));

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
        for (let i = 0; i < gObjetos.length; i++) {
            gObjetos[i].atualize_vertices(delta)
        }

        atualiza_buffer_e_draw()

        window.requestAnimationFrame(desenhe);
    }
}

function popPenta() {
    gObjetos.pop();
    for (let i = 0; i < 5; i++) {
        gPosicoes.pop();
        gPosicoes.pop();
        gPosicoes.pop();
        gCores.pop();
        gCores.pop();
        gCores.pop();
    }
}

function pushPenta() {
    let vx = sorteieInteiro(20, 100);
    let vy = sorteieInteiro(20, 100);
    let r = sorteieInteiro(30, 80);
    let x = sorteieInteiro(r, 400 - r);
    let y = sorteieInteiro(r, 400 - r);
    gObjetos.push(new Penta(x, y, r, vx, vy, sorteieCorRGBA()));
}


function Penta(x, y, r, vx, vy, cor) {
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
        this.pos = add(this.pos, mult(delta * fatorVel, this.vel));
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
    if (e.target.id === "pButton") {
        if (!gPausado) {
            document.getElementById("pButton").innerHTML = "Pausado"
        }
        else {
            document.getElementById("pButton").innerHTML = "Rodando"
        }
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


function callbackrange(e) {
    let valor = parseInt(e.target.value);
    if (e.target.id === "velSlider") {
        fatorVel = valor;
    }

    if (e.target.id === "ndSlider") {
        if (valor != gObjetos.length) {
            let diff = valor - gObjetos.length;
            while (gObjetos.length != valor) {
                if (diff > 0)
                    pushPenta();
                popPenta();
            }
        }
    }
}


function callbackkey(e) {
    if (gPausado) {
        let delta = Number(e.key) * 0.1
        gPosicoes = [];
        for (let i = 0; i < gObjetos.length; i++) {
            gObjetos[i].atualize_vertices(delta);
        }
        atualiza_buffer_e_draw()
    }
}


////////////////////////////////////////////////////////////////////////
//+++++++++++++++++++++++++++       +++++++++++++++++++++++++++++++
////////////////////////////////////////////////////////////////////////



function atualiza_buffer_e_draw() {


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
    let vertices = [];
    for (let i = 0; i < 360; i += 360 / 5) {
        let x = raio * Math.sin(i * Math.PI / 180);
        let y = raio * Math.cos(i * Math.PI / 180);
        vertices.push(vec2(x, y));
    }

    return vertices;
}
