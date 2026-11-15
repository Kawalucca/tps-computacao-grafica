// Bandeiras destruídas que ondulam ao vento. O shader dobra os vértices do tecido.
export function criarTecido() {
  const position=[], normal=[], texcoord=[], indices=[];
  const divisores=16;
  for (let coluna=0;coluna<=divisores;coluna++) {
    const t=coluna/divisores;
    for (let linha=0;linha<=5;linha++) {
      const v=linha/5;
      const comprimento=1.3 * (1 - 0.17 * t);
      position.push(t * 1.5, -v*comprimento, 0);
      normal.push(0,0,1);
      texcoord.push(t,v);
    }
  }
  for (let coluna=0;coluna<divisores;coluna++){
    for (let linha=0;linha<5;linha++){
      const a=coluna*6+linha, b=a+6;
      indices.push(a,b,a+1, b,b+1,a+1);
    }
  }
  return {position:{numComponents:3,data:position},normal:{numComponents:3,data:normal},
    texcoord:{numComponents:2,data:texcoord},indices:{numComponents:3,data:indices}};
}

export function obterBandeiras() {
  return [
    { haste:[-3.22,1.30,-1.38], escalaHaste:[0.065,2.6,0.065],
      tecido:[-3.19,2.52,-1.37], rotacao:[0,0.5,0], cor:[0.29,0.29,0.27,1]},
    { haste:[2.55,0.93,2.10], escalaHaste:[0.055,1.86,0.055],
      tecido:[2.58,1.80,2.13], rotacao:[0,-0.36,0], cor:[0.32,0.17,0.14,1]},
  ];
}
