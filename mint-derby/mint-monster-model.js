import {detailKit} from "../parkside-chaos-wheel-physics/vehicle-detail-kit.js?v=quality-1";

export function buildMintMonster(T){
  const k=detailKit(T);
  const {mat,box,rounded,cyl,torus,tube,pane,loft,arch,wheel,interior,mechanics,lamp,finish}=k;

  const c={
    id:"mint-monster",
    front:-2.15,
    rear:2.06,
    radius:.47,
    track:1.03
  };

  mat("paint",0xaeb79b,.54,.24);
  mat("paintShadow",0x87927b,.46,.34);
  mat("paintLight",0xc5ccb7,.42,.27);
  mat("vinyl",0x202523,.03,.84);
  mat("chromeBright",0xe1e8e7,.96,.10);
  mat("chromeSoft",0xb7c3c2,.76,.20);
  mat("darkTrim",0x1e2425,.10,.68);
  mat("redLens",0x9b1d23,.12,.22,{emissive:0x2d0608,emissiveIntensity:.34});
  mat("amber",0xe79b32,.08,.24,{emissive:0x4a2205,emissiveIntensity:.18});
  mat("reverseLens",0xf3ead4,.08,.21,{emissive:0x332d1e,emissiveIntensity:.14});
  mat("interiorMint",0x59675b,.02,.74);
  mat("interiorDark",0x2a302e,.04,.70);
  mat("exhaust",0x51595a,.65,.37);

  // Stronger lower chassis and long full-size body proportions.
  box("chassis",1.78,.15,5.30,0,.39,.03,"steel");
  box("chassis",1.56,.10,5.70,0,.31,.03,"black");

  loft("tub",[
    [-3.13,.82,.43,.67],
    [-2.82,1.04,.42,.79],
    [-2.12,1.10,.42,.91],
    [-.78,1.13,.42,.96],
    [.62,1.13,.42,.96],
    [1.72,1.11,.43,.92],
    [2.61,1.05,.45,.85],
    [3.08,.86,.50,.74]
  ],"paint");

  // Long sculpted hood, with subtle raised center and outer crowns.
  loft("bonnet",[
    [-3.10,.84,.79,.93],
    [-2.86,1.03,.85,1.03],
    [-2.24,1.07,.89,1.10],
    [-1.55,1.03,.92,1.16],
    [-1.06,.97,.93,1.17]
  ],"paint");
  rounded("bonnet",.16,.045,1.82,0,1.18,-2.03,"paintLight",.018);
  for(const x of [-.57,.57])tube("bonnet",[[x,1.09,-2.80],[x*.92,1.16,-1.16]],.010,"chromeSoft",12);

  // Rear deck with slightly kicked-up trailing edge.
  loft("trunk",[
    [1.18,1.00,.91,1.14],
    [1.78,1.05,.89,1.13],
    [2.56,1.04,.86,1.08],
    [3.03,.92,.81,1.00]
  ],"paint");
  rounded("trunk",1.36,.055,.12,0,1.105,2.81,"paintLight",.02);

  // Four independent door skins, wheel arches, rocker detail and chrome side spear.
  for(const side of [-1,1]){
    arch("fender-front-"+side,side,c.front,.48,.50,1.03,1.10,"paint");
    arch("fender-rear-"+side,side,c.rear,.48,.50,1.03,1.08,"paint");

    for(const [name,z0,z1] of [
      ["door-front-"+side,-1.02,.22],
      ["door-rear-"+side,.27,1.48]
    ]){
      const mid=(z0+z1)/2;
      rounded(name,.065,.58,z1-z0,side*1.125,.93,mid,"paint",.018);
      // Inner shadow line gives the doors real panel separation.
      tube(name,[
        [side*1.163,.66,z0+.03],
        [side*1.165,1.20,z0+.03],
        [side*1.165,1.20,z1-.03],
        [side*1.163,.66,z1-.03]
      ],.007,"darkTrim",8);
      rounded(name,.032,.045,.25,side*1.181,1.18,z1-.19,"chromeBright",.008);
      cyl(name,.024,.028,side*1.186,1.17,z1-.38,"chromeSoft","x");
    }

    // Rear quarter sheetmetal with fuel door on driver side.
    rounded("quarter-"+side,.07,.49,.92,side*1.095,.91,1.97,"paint",.022);
    if(side<0){
      cyl("quarter-"+side,.12,.012,side*1.137,1.05,2.20,"chromeSoft","x");
      cyl("quarter-"+side,.098,.014,side*1.146,1.05,2.20,"paint","x");
    }

    // Three distinct chrome bands.
    tube("sill-"+side,[
      [side*1.145,.56,-2.55],
      [side*1.165,.55,-.20],
      [side*1.145,.56,2.56]
    ],.026,"chromeBright",22);
    tube("spear-"+side,[
      [side*1.153,.89,-2.84],
      [side*1.176,.90,-.35],
      [side*1.145,.90,2.68]
    ],.025,"chromeBright",26);
    tube("belt-"+side,[
      [side*1.11,1.24,-.99],
      [side*1.08,1.25,.30],
      [side*1.04,1.24,1.58]
    ],.021,"chromeBright",18);

    // Front and rear bright wheel-lip trim.
    for(const wz of [c.front,c.rear]){
      const pts=[];
      for(let i=0;i<=28;i++){
        const a=i*Math.PI/28;
        pts.push([side*1.145,.49+Math.sin(a)*.57,wz+Math.cos(a)*.57]);
      }
      tube(wz<0?"fender-front-"+side:"fender-rear-"+side,pts,.021,"chromeBright",28);
    }

    // Side windows are separate panes with full bright hardtop framing.
    pane("glass-side-front-"+side,[
      [side*1.035,1.25,-.98],
      [side*1.025,1.25,.20],
      [side*.775,1.78,.08],
      [side*.760,1.78,-.67]
    ]);
    pane("glass-side-rear-"+side,[
      [side*1.025,1.25,.25],
      [side*1.000,1.25,1.48],
      [side*.710,1.69,1.20],
      [side*.775,1.78,.10]
    ]);
    tube("window-frame-"+side,[
      [side*1.045,1.24,-1.02],
      [side*.775,1.82,-.70],
      [side*.700,1.72,1.23],
      [side*1.010,1.24,1.52]
    ],.024,"chromeBright",24);
    tube("window-frame-"+side,[
      [side*1.032,1.24,.22],
      [side*.770,1.80,.09]
    ],.022,"chromeBright",8);

    // Sculpted mirror housing and stalk.
    tube("mirror-"+side,[
      [side*1.02,1.26,-.78],
      [side*1.18,1.40,-.86]
    ],.025,"chromeSoft",6);
    rounded("mirror-"+side,.16,.18,.26,side*1.24,1.43,-.88,"paint",.045,0,0,side*.05);
    box("mirror-"+side,.012,.12,.19,side*1.326,1.43,-.88,"chromeBright");

    // Small front fender antenna.
    if(side>0){
      tube("antenna",[
        [side*.96,1.10,-2.55],
        [side*.94,1.80,-2.60],
        [side*.91,2.18,-2.65]
      ],.008,"chromeBright",9);
      cyl("antenna",.025,.035,side*.96,1.11,-2.55,"chromeBright","y");
    }
  }

  // Hardtop greenhouse and roof with a much cleaner silhouette.
  loft("roof",[
    [-.76,.76,1.73,1.81],
    [-.52,.84,1.80,1.91],
    [.48,.84,1.82,1.93],
    [1.02,.75,1.73,1.82],
    [1.30,.67,1.61,1.70]
  ],"paint");
  rounded("roof",1.45,.028,1.78,0,1.932,.28,"vinyl",.012);

  pane("windshield",[
    [-.98,1.26,-1.03],
    [.98,1.26,-1.03],
    [.74,1.80,-.72],
    [-.74,1.80,-.72]
  ]);
  pane("rear-glass",[
    [-.96,1.25,1.52],
    [.96,1.25,1.52],
    [.67,1.69,1.25],
    [-.67,1.69,1.25]
  ]);

  tube("windshield",[
    [-1.00,1.25,-1.04],
    [-.75,1.83,-.74],
    [.75,1.83,-.74],
    [1.00,1.25,-1.04]
  ],.027,"chromeBright",24);
  tube("rear-glass",[
    [-.98,1.24,1.54],
    [-.68,1.72,1.27],
    [.68,1.72,1.27],
    [.98,1.24,1.54]
  ],.026,"chromeBright",24);

  // Wipers and drip rails.
  for(const x of [-.36,.36]){
    tube("windshield",[
      [x-.16,1.29,-1.045],
      [x+.16,1.34,-1.00]
    ],.011,"darkTrim",3);
  }
  for(const side of [-1,1]){
    tube("roof",[
      [side*.76,1.82,-.71],
      [side*.72,1.91,.42],
      [side*.67,1.72,1.27]
    ],.018,"chromeBright",18);
  }

  // Front fascia: deeply detailed grille with stacked quad headlamps.
  rounded("grille",1.86,.61,.10,0,.86,-3.16,"darkTrim",.025);
  rounded("grille",1.73,.52,.04,0,.86,-3.225,"chromeSoft",.018);
  for(let i=-9;i<=9;i++)box("grille",.023,.43,.024,i*.087,.86,-3.254,"chromeBright");
  for(let j=0;j<4;j++)box("grille",1.62,.018,.024,0,.70+j*.11,-3.256,"chromeBright");

  for(const side of [-1,1]){
    // Two vertically stacked lamps per side in chrome pods.
    for(const [y,r] of [[1.00,.17],[.72,.16]]){
      cyl("headlight-"+side,r*1.28,.11,side*.82,y,-3.19,"chromeBright","z");
      lamp("headlight-"+side,side*.82,y,-3.27,r);
    }
    rounded("headlight-"+side,.43,.65,.12,side*.82,.86,-3.12,"paint",.08);
    // Corner marker.
    rounded("marker-"+side,.10,.25,.08,side*1.035,.78,-3.10,"amber",.025);
  }

  // Massive chrome bumpers and guards.
  rounded("front-bumper",2.23,.16,.23,0,.55,-3.23,"chromeBright",.045);
  for(const x of [-.62,.62])rounded("front-bumper",.14,.38,.17,x,.65,-3.28,"chromeSoft",.035);
  rounded("rear-bumper",2.22,.17,.24,0,.57,3.19,"chromeBright",.045);
  for(const x of [-.58,.58])rounded("rear-bumper",.13,.30,.17,x,.65,3.24,"chromeSoft",.032);

  // Rear light panel with separate red/reverse segments.
  rounded("tail-panel",1.76,.38,.10,0,.84,3.08,"darkTrim",.025);
  for(const side of [-1,1]){
    rounded("tail-light-"+side,.66,.19,.06,side*.62,.87,3.145,"redLens",.025);
    rounded("tail-light-"+side,.17,.14,.065,side*.62,.87,3.18,"reverseLens",.025);
    tube("tail-light-"+side,[
      [side*.94,.78,3.18],
      [side*.30,.78,3.18],
      [side*.30,.97,3.18],
      [side*.94,.97,3.18]
    ],.015,"chromeBright",8);
  }
  rounded("trunk",.78,.055,.08,0,1.07,3.08,"chromeBright",.018);

  // Hood ornament and fine center trim.
  tube("ornament",[[0,1.18,-2.64],[0,1.50,-2.70]],.014,"chromeBright",5);
  torus("ornament",.065,.012,0,1.52,-2.70,"chromeBright","z",20);
  tube("bonnet",[[0,1.18,-2.64],[0,1.19,-1.14]],.012,"chromeBright",8);

  // Luxury two-row interior: bench-like seats, detailed dash, wheel and gauges.
  interior({baseY:.78,front:-.16,rear:.92,dash:-.80,width:.84,luxury:true});
  // Overlay the green-toned upholstery over the standard luxury colors.
  for(const item of k.group("cabin").children){
    if(item.material===k.materials.leatherDetail)item.material=k.materials.interiorMint;
  }
  rounded("cabin",1.55,.10,.62,0,.73,.25,"interiorDark",.025);
  rounded("cabin",1.52,.13,.46,0,.88,-.20,"interiorMint",.045);
  rounded("cabin",1.50,.13,.46,0,.88,.88,"interiorMint",.045);

  // Whitewall tires with deep chrome hubcaps.
  for(const side of [-1,1]){
    wheel("wheel-front-"+(side>0?"left":"right"),side*c.track,c.radius,c.front,c.radius,.31,"whitewall");
    wheel("wheel-rear-"+(side>0?"left":"right"),side*c.track,c.radius,c.rear,c.radius,.31,"whitewall");
    // Extra domed hubcaps.
    for(const z of [c.front,c.rear]){
      const face=side*c.track+side*.165;
      cyl("hubcap-"+side+"-"+z,.24,.045,face,c.radius,z,"chromeBright","x");
      torus("hubcap-"+side+"-"+z,.17,.010,face+side*.026,c.radius,z,"chromeSoft","x",24);
    }
  }

  // Real underbody, V8 detail and full dual exhaust routing.
  mechanics(c,{engineZ:-1.55,cylinders:8});

  // Thick polished exhaust tips and animated flames.
  const flameRoots=[];
  for(const side of [-1,1]){
    const x=side*.70;
    cyl("exhaust-tip-"+side,.072,.30,x,.40,2.86,"chromeBright","z");
    cyl("exhaust-tip-"+side,.052,.05,x,.40,3.03,"darkTrim","z");

    const flameGroup=new T.Group();
    flameGroup.position.set(x,.40,3.16);
    flameGroup.visible=false;

    const outerMat=new T.MeshBasicMaterial({
      color:0xff791d,
      transparent:true,
      opacity:.88,
      depthWrite:false,
      blending:T.AdditiveBlending
    });
    const midMat=new T.MeshBasicMaterial({
      color:0xffd36d,
      transparent:true,
      opacity:.86,
      depthWrite:false,
      blending:T.AdditiveBlending
    });
    const innerMat=new T.MeshBasicMaterial({
      color:0x65baff,
      transparent:true,
      opacity:.96,
      depthWrite:false,
      blending:T.AdditiveBlending
    });

    const outer=new T.Mesh(new T.ConeGeometry(.12,.92,12,1,true),outerMat);
    outer.rotation.x=Math.PI/2;
    outer.position.z=.43;

    const mid=new T.Mesh(new T.ConeGeometry(.078,.67,10,1,true),midMat);
    mid.rotation.x=Math.PI/2;
    mid.position.z=.31;

    const inner=new T.Mesh(new T.ConeGeometry(.045,.46,9,1,true),innerMat);
    inner.rotation.x=Math.PI/2;
    inner.position.z=.20;

    flameGroup.add(outer,mid,inner);
    flameRoots.push({group:flameGroup,outer,mid,inner});
  }

  const built=finish();
  for(const flame of flameRoots)built.root.add(flame.group);
  built.root.userData.exhaustFlames=flameRoots;
  built.root.userData.mintMonster=true;

  // Slightly larger presence than Parkside sedans without cartoonish proportions.
  built.root.scale.setScalar(1.08);
  return built;
}
