const vertexShaderSource = `
precision highp float;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 aPosition;
attribute vec2 aCoords;

varying vec3 vColor;
varying vec2 vCoords;


void main(void) {
  gl_Position = projectionMatrix * viewMatrix * vec4(aPosition, 1.0); 
  vCoords = aCoords;
}
`;
const fragmentShaderSource = `
precision highp float;

varying vec2 vCoords;

uniform sampler2D uSampler;

void main(void) {
  gl_FragColor = texture2D(uSampler,vCoords); 
}
`;

var angleZ = 0.0;
var angleY = 0.0;
var angleX = 90.0;
var tz = -9.0;

async function startGL() 
{

  const texture = './img/akai_texture.png'

  initCanvas()
  initShaders()
  initTexture(texture)
  camera(30)

  //buffers
  let vertexPosition; 
  let vertexCoords;
  // let vertexNormal;
  let indexes;

  [indexes, vertexPosition, vertexCoords, vertexNormal] = await LoadObj('./webgl/akai_logo.obj');

  vertexPositionBuffer = gl.createBuffer(); 
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPosition), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3; 

  indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexes), gl.STATIC_DRAW);
  indexBuffer.itemSize = 3;
  indexBuffer.numItems = indexes.length;

  vertexCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexCoordsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexCoords), gl.STATIC_DRAW);
  vertexCoordsBuffer.itemSize = 2;

  // vertexNormalBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormal), gl.STATIC_DRAW);
  // vertexNormalBuffer.itemSize = 3;

  render();
} 

function initShaders()
{
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, vertexShaderSource)
    gl.compileShader(vertexShader)

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, fragmentShaderSource)
    gl.compileShader(fragmentShader)

    shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)
}

function initCanvas()
{
  let canvas = document.getElementById("canvas");  
  gl = canvas.getContext("experimental-webgl"); 
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.viewportWidth = canvas.width; 
  gl.viewportHeight = canvas.height;
}

function initTexture(url)
{
    textureBuffer = gl.createTexture()

    var textureImg = new Image()
    textureImg.onload = () =>
    {
        gl.bindTexture(gl.TEXTURE_2D, textureBuffer);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImg);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    textureImg.src = url
}

function camera(afov = 70, far = 100, near = 0.1 )
{
    let aspect = gl.viewportWidth/gl.viewportHeight;
    let fov = afov * Math.PI / 180.0;
    let zFar = far; 
    let zNear = near;
    projectionMatrix = [
     1.0/(aspect*Math.tan(fov/2)),0                           ,0                         ,0                            ,
     0                         ,1.0/(Math.tan(fov/2))         ,0                         ,0                            ,
     0                         ,0                           ,-(zFar+zNear)/(zFar-zNear)  , -1,
     0                         ,0                           ,-(2*zFar*zNear)/(zFar-zNear) ,0.0,
    ]
}

function render()
{  
  let viewMatrix = [
  1,0,0,0, 
  0,1,0,0,
  0,0,1,0,
  0,0,0,1
  ];

  let zRotation = [
  +Math.cos(angleZ*Math.PI/180.0),+Math.sin(angleZ*Math.PI/180.0),0,0,
  -Math.sin(angleZ*Math.PI/180.0),+Math.cos(angleZ*Math.PI/180.0),0,0,
  0,0,1,0,
  0,0,0,1
  ];

  let yRotation = [
  +Math.cos(angleY*Math.PI/180.0),0,-Math.sin(angleY*Math.PI/180.0),0,
  0,1,0,0,
  +Math.sin(angleY*Math.PI/180.0),0,+Math.cos(angleY*Math.PI/180.0),0,
  0,0,0,1
  ];

  let xRotation = [
  1,0,0,0,
  0,+Math.cos(angleX*Math.PI/180.0),+Math.sin(angleX*Math.PI/180.0),0,
  0,-Math.sin(angleX*Math.PI/180.0),+Math.cos(angleX*Math.PI/180.0),0,
  0,0,0,1
  ];

  let zTranslation = [
  1,0,0,0,
  0,1,0,0,
  0,0,1,0,
  0,0,tz,1
  ];
  
  viewMatrix = MatrixMul(viewMatrix,xRotation);
  viewMatrix = MatrixMul(viewMatrix,yRotation);
  viewMatrix = MatrixMul(viewMatrix,zRotation);

  viewMatrix = MatrixMul(viewMatrix,zTranslation);

  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); 
  gl.clearColor(0.0, 0.0, 0.0, 0.0); 
  gl.clearDepth(1.0);             
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(shaderProgram)   
  gl.enable(gl.DEPTH_TEST);         
  gl.depthFunc(gl.LEQUAL);            
  
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "projectionMatrix"), false, new Float32Array(projectionMatrix)); 
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "viewMatrix"), false, new Float32Array(viewMatrix));
  
  gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aPosition")); 
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aPosition"), vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aCoords")); 
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexCoordsBuffer);
  gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aCoords"), vertexCoordsBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textureBuffer);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);
  
  gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  
  angleY += 0.9;

  requestAnimationFrame(render);
}

function MatrixMul(a,b) 
{
  let c = [
  0,0,0,0,
  0,0,0,0,
  0,0,0,0,
  0,0,0,0
  ]
  for(let i=0;i<4;i++)
  {
    for(let j=0;j<4;j++)
    {
      c[i*4+j] = 0.0;
      for(let k=0;k<4;k++)
      {
        c[i*4+j]+= a[i*4+k] * b[k*4+j];
      }
    }
  }
  return c;
}

function MatrixTransposeInverse(m) {
  let r = [
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0
  ];
  r[0] = m[5] * m[10] * m[15] - m[5] * m[14] * m[11] - m[6] * m[9] * m[15] + m[6] * m[13] * m[11] + m[7] * m[9] * m[14] - m[7] * m[13] * m[10];
  r[1] = -m[1] * m[10] * m[15] + m[1] * m[14] * m[11] + m[2] * m[9] * m[15] - m[2] * m[13] * m[11] - m[3] * m[9] * m[14] + m[3] * m[13] * m[10];
  r[2] = m[1] * m[6] * m[15] - m[1] * m[14] * m[7] - m[2] * m[5] * m[15] + m[2] * m[13] * m[7] + m[3] * m[5] * m[14] - m[3] * m[13] * m[6];
  r[3] = -m[1] * m[6] * m[11] + m[1] * m[10] * m[7] + m[2] * m[5] * m[11] - m[2] * m[9] * m[7] - m[3] * m[5] * m[10] + m[3] * m[9] * m[6];

  r[4] = -m[4] * m[10] * m[15] + m[4] * m[14] * m[11] + m[6] * m[8] * m[15] - m[6] * m[12] * m[11] - m[7] * m[8] * m[14] + m[7] * m[12] * m[10];
  r[5] = m[0] * m[10] * m[15] - m[0] * m[14] * m[11] - m[2] * m[8] * m[15] + m[2] * m[12] * m[11] + m[3] * m[8] * m[14] - m[3] * m[12] * m[10];
  r[6] = -m[0] * m[6] * m[15] + m[0] * m[14] * m[7] + m[2] * m[4] * m[15] - m[2] * m[12] * m[7] - m[3] * m[4] * m[14] + m[3] * m[12] * m[6];
  r[7] = m[0] * m[6] * m[11] - m[0] * m[10] * m[7] - m[2] * m[4] * m[11] + m[2] * m[8] * m[7] + m[3] * m[4] * m[10] - m[3] * m[8] * m[6];

  r[8] = m[4] * m[9] * m[15] - m[4] * m[13] * m[11] - m[5] * m[8] * m[15] + m[5] * m[12] * m[11] + m[7] * m[8] * m[13] - m[7] * m[12] * m[9];
  r[9] = -m[0] * m[9] * m[15] + m[0] * m[13] * m[11] + m[1] * m[8] * m[15] - m[1] * m[12] * m[11] - m[3] * m[8] * m[13] + m[3] * m[12] * m[9];
  r[10] = m[0] * m[5] * m[15] - m[0] * m[13] * m[7] - m[1] * m[4] * m[15] + m[1] * m[12] * m[7] + m[3] * m[4] * m[13] - m[3] * m[12] * m[5];
  r[11] = -m[0] * m[5] * m[11] + m[0] * m[9] * m[7] + m[1] * m[4] * m[11] - m[1] * m[8] * m[7] - m[3] * m[4] * m[9] + m[3] * m[8] * m[5];

  r[12] = -m[4] * m[9] * m[14] + m[4] * m[13] * m[10] + m[5] * m[8] * m[14] - m[5] * m[12] * m[10] - m[6] * m[8] * m[13] + m[6] * m[12] * m[9];
  r[13] = m[0] * m[9] * m[14] - m[0] * m[13] * m[10] - m[1] * m[8] * m[14] + m[1] * m[12] * m[10] + m[2] * m[8] * m[13] - m[2] * m[12] * m[9];
  r[14] = -m[0] * m[5] * m[14] + m[0] * m[13] * m[6] + m[1] * m[4] * m[14] - m[1] * m[12] * m[6] - m[2] * m[4] * m[13] + m[2] * m[12] * m[5];
  r[15] = m[0] * m[5] * m[10] - m[0] * m[9] * m[6] - m[1] * m[4] * m[10] + m[1] * m[8] * m[6] + m[2] * m[4] * m[9] - m[2] * m[8] * m[5];

  var det = m[0] * r[0] + m[1] * r[4] + m[2] * r[8] + m[3] * r[12];
  for (var i = 0; i < 16; i++) r[i] /= det;

  let rt = [r[0], r[4], r[8], r[12],
  r[1], r[5], r[9], r[13],
  r[2], r[6], r[10], r[14],
  r[3], r[7], r[11], r[15]
  ];

  return rt;
}

async function* makeTextFileLineIterator(fileURL) { 
  const utf8Decoder = new TextDecoder('utf-8');
  const response = await fetch(fileURL);
  const reader = response.body.getReader();
  let { value: chunk, done: readerDone } = await reader.read();
  chunk = chunk ? utf8Decoder.decode(chunk) : '';

  const re = /\n|\r|\r\n/gm;
  let startIndex = 0;
  let result;

  for (;;) {
    let result = re.exec(chunk);
    if (!result) {
      if (readerDone) {
        break;
      }
      let remainder = chunk.substr(startIndex);
      ({ value: chunk, done: readerDone } = await reader.read());
      chunk = remainder + (chunk ? utf8Decoder.decode(chunk) : '');
      startIndex = re.lastIndex = 0;
      continue;
    }
    yield chunk.substring(startIndex, result.index);
    startIndex = re.lastIndex;
  }
  if (startIndex < chunk.length) {
    yield chunk.substr(startIndex);
  }
}

async function LoadObj(filename)
{
  let rawVertexPosition = [0,0,0]; 
  let rawVertexNormal = [0,0,0];
  let rawVertexCoords = [0,0];


  let vertexPosition = []; 
  let vertexNormal = [];
  let vertexCoords = [];
  let indexes = [];


  let aa = new Map();
  for await (let line of makeTextFileLineIterator(filename)) {
    const lineArray = line.split(' ');
    switch(lineArray[0]) {
      case "v": { 
        const x = parseFloat(lineArray[1]);
        const y = parseFloat(lineArray[2]);
        const z = parseFloat(lineArray[3]);
        rawVertexPosition.push(...[x,y,z]);
        break;
      };
      case "vn": { 
        const xn = parseFloat(lineArray[1]);
        const yn = parseFloat(lineArray[2]);
        const zn = parseFloat(lineArray[3]);
        rawVertexNormal.push(...[xn,yn,zn]);
        break;
      }
      case "vt": { 
        const u = parseFloat(lineArray[1]);
        const v = parseFloat(lineArray[2]);
        rawVertexCoords.push(...[u,v]);
        break;
      }
      case "f": { 
        const i0 = lineArray[1];
        const i1 = lineArray[2];
        const i2 = lineArray[3];
        for(let ii of [i0,i1,i2]) {
          if(!aa.has(ii)) { 
            const iia = ii.split('/');
            const indexVertexPosition = parseInt(iia[0]);
            const indexVertexCoords = parseInt(iia[1]); 
            const indexVertexNormal = parseInt(iia[2]); 
            const index = vertexPosition.length/3;

            vertexPosition.push(rawVertexPosition[indexVertexPosition*3+0]); 
            vertexPosition.push(rawVertexPosition[indexVertexPosition*3+1]); 
            vertexPosition.push(rawVertexPosition[indexVertexPosition*3+2]); 

            vertexNormal.push(rawVertexNormal[indexVertexNormal*3+0]); 
            vertexNormal.push(rawVertexNormal[indexVertexNormal*3+1]); 
            vertexNormal.push(rawVertexNormal[indexVertexNormal*3+2]); 

            vertexCoords.push(rawVertexCoords[indexVertexCoords*2+0]); 
            vertexCoords.push(rawVertexCoords[indexVertexCoords*2+1]); 
            aa.set(ii,index);
          }
          indexes.push(aa.get(ii)) 
        }
        break;
      }
    }
  }

  console.log(`Wczytano ${rawVertexPosition.length/3-1} wierzchołków`);
  console.log(`Wczytano ${rawVertexNormal.length/3-1} wektorów normalnych`);
  console.log(`Wczytano ${rawVertexCoords.length/2-1} współrzędnych tekstury`);

  console.log(`W efekcie mapowania stworzono ${vertexPosition.length/3} wierzchołków`);
  console.log(`W efekcie mapowania stworzono ${indexes.length} indeksów`);
 
  return [indexes, vertexPosition, vertexCoords, vertexNormal];
}