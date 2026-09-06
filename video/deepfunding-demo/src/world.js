import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { ramp, windowAt, lerp, startupPosition, cameraAt } from "./timeline.js";

const V = (x, y, z) => new T.Vector3(x, y, z);
const palette = {
  white: 0xe4eeee,
  ink: 0x174957,
  teal: 0x148c99,
  gold: 0xcf9850,
  green: 0x539580,
  water: 0x7cb8c7,
};
const mat = (color, opts = {}) =>
  new T.MeshStandardMaterial({
    color,
    roughness: 0.56,
    metalness: 0.12,
    ...opts,
  });
const material = {
  white: mat(palette.white),
  paving: mat(0xcbdcdd),
  road: mat(0x4b6971),
  teal: mat(palette.teal),
  gold: mat(palette.gold),
  green: mat(palette.green),
  trunk: mat(0x8d7660),
  dark: mat(0x254853),
  trim: mat(0xf6f8eb),
  tower: mat(0x528c9e, { metalness: 0.4, roughness: 0.32 }),
  light: mat(0x74cbd5, { emissive: 0x18a4bb, emissiveIntensity: 0.7 }),
};
function box(parent, w, h, d, x, y, z, m) {
  const o = new T.Mesh(new T.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
function cyl(parent, r, h, x, y, z, m, sides = 12) {
  const o = new T.Mesh(new T.CylinderGeometry(r, r, h, sides), m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
function batch(group) {
  group.updateMatrixWorld(true);
  const byMat = new Map();
  for (const mesh of [...group.children]) {
    if (!mesh.isMesh) continue;
    const g = (
      mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
    ).applyMatrix4(mesh.matrix);
    const list = byMat.get(mesh.material) ?? [];
    list.push(g);
    byMat.set(mesh.material, list);
    group.remove(mesh);
    mesh.geometry.dispose();
  }
  for (const [m, gs] of byMat) {
    const merged = new T.Mesh(mergeGeometries(gs), m);
    merged.castShadow = true;
    merged.receiveShadow = true;
    group.add(merged);
    for (const g of gs) g.dispose();
  }
}
function label(text, color = "#164653", width = 4.4, size = 40) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 150;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f5fbf7";
  ctx.fillRect(0, 0, 1024, 150);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 10, 150);
  ctx.font = `600 ${size}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 518, 78, 975);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const sprite = new T.Sprite(
    new T.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  sprite.scale.set(width, (width * 150) / 1024, 1);
  sprite.renderOrder = 20;
  return sprite;
}
function curveLine(points, color, radius = 0.028) {
  const curve = new T.CatmullRomCurve3(points);
  const mesh = new T.Mesh(
    new T.TubeGeometry(curve, 36, radius, 6, false),
    mat(color, {
      emissive: color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
    }),
  );
  return { mesh, curve };
}

export function createWorld(canvas) {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true,
    alpha: false,
  });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0xcce3ed);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  const scene = new T.Scene();
  scene.background = new T.Color(0xcce3ed);
  scene.fog = new T.Fog(0xcce3ed, 65, 160);
  const camera = new T.PerspectiveCamera(43, 16 / 9, 0.1, 250);
  const pmrem = new T.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.05).texture;
  scene.environmentIntensity = 0.65;
  room.dispose();
  pmrem.dispose();
  scene.add(new T.HemisphereLight(0xd6f2ff, 0x81958b, 1.2));
  const sun = new T.DirectionalLight(0xffefca, 2.1);
  sun.position.set(-25, 45, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 32;
  sun.shadow.camera.bottom = -32;
  sun.shadow.camera.far = 120;
  sun.shadow.normalBias = 0.035;
  scene.add(sun);

  // Procedural architectural set. Nothing is a claimed geographic reconstruction.
  const city = new T.Group();
  scene.add(city);
  const waterGeo = new T.PlaneGeometry(280, 190, 100, 70);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new T.Mesh(
    waterGeo,
    mat(palette.water, { metalness: 0.42, roughness: 0.28 }),
  );
  water.position.set(0, -0.5, -55);
  scene.add(water);
  box(city, 72, 0.8, 37, 0, -0.18, 0, material.white);
  box(city, 75, 0.25, 3, 0, -0.1, 19.2, material.paving);
  box(city, 70, 0.12, 6, 0, 0.24, -12.5, material.road);
  for (let x = -34; x <= 34; x += 3)
    box(city, 1.5, 0.03, 0.09, x, 0.32, -12.5, material.trim);
  box(city, 54, 0.15, 1, 0, 0.3, -8.5, material.trim);
  box(city, 47, 0.18, 15, 0, 0.28, 1, material.paving);
  // Promenade, plant beds and repeated architectural detail hold up in closeups.
  for (let x = -33; x < 34; x += 2) {
    box(city, 0.035, 0.018, 12, x, 0.39, 7, material.white);
  }
  function tree(x, z, scale = 1) {
    cyl(city, 0.09 * scale, 1.2 * scale, x, 0.7 * scale, z, material.trunk, 7);
    const canopy = new T.Mesh(
      new T.IcosahedronGeometry(0.65 * scale, 1),
      material.green,
    );
    canopy.position.set(x, 1.45 * scale, z);
    canopy.scale.set(1, 1.35, 1);
    canopy.castShadow = true;
    city.add(canopy);
  }
  for (const z of [-7, 10.5])
    for (let x = -30; x < 31; x += 3.2) {
      if (Math.abs(x) < 4) continue;
      box(city, 1.5, 0.32, 1.5, x, 0.5, z, material.trim);
      tree(x, z, 0.9);
    }
  for (const x of [-26, 26]) {
    box(city, 5, 0.15, 12, x, 0.37, 0.5, material.green);
    for (let i = 0; i < 5; i++) tree(x - 1 + (i % 2) * 2, -4 + i * 2, 1.15);
  }
  for (let i = 0; i < 10; i++) {
    let x = -32 + i * 7.2;
    let h = 9 + ((i * 7) % 14);
    let z = -22 - (i % 3) * 4;
    let w = 3 + (i % 3) * 0.8;
    box(city, w, h, 4.4, x, h / 2 - 0.2, z, material.tower);
    box(city, w + 0.16, 0.25, 4.55, x, h, z, material.white);
    for (let y = 1; y < h; y += 1.5) {
      box(city, w + 0.03, 0.065, 4.46, x, y, z, material.white);
    }
    for (let j = -1; j <= 1; j++) {
      box(city, 0.07, h, 4.47, x + (j * w) / 3, h / 2 - 0.2, z, material.dark);
    }
    if (i % 3 === 0) {
      box(city, w * 0.6, 3, 3, x, h + 1.5, z, material.tower);
      cyl(city, 0.045, 3, x, h + 4, z, material.white);
    }
  }
  // Distant skyline on the other shore; muted by real depth fog.
  box(city, 210, 1, 26, 0, -1, -88, material.paving);
  for (let i = 0; i < 32; i++) {
    let h = 7 + ((i * 13) % 23);
    box(
      city,
      2.6 + (i % 3),
      h,
      4,
      -93 + i * 6,
      h / 2 - 1,
      -84 - (i % 4) * 2,
      material.tower,
    );
  }
  // Road under the raised A2A bridge is deliberately free of UI panels.
  box(city, 21, 0.22, 5.4, 0, 0.46, 4.2, material.white);
  box(city, 20.8, 0.1, 4.9, 0, 0.61, 4.2, mat(0xc0dadb));
  for (const z of [2.2, 6.2]) {
    box(city, 21, 0.09, 0.09, 0, 0.76, z, material.light);
    for (let x = -10; x <= 10; x += 1.6)
      cyl(city, 0.045, 0.6, x, 0.95, z, material.dark, 6);
    box(city, 21, 0.05, 0.05, 0, 1.27, z, material.trim);
  }
  for (let x = -9; x < 10; x += 1.5)
    box(city, 0.45, 0.03, 0.055, x, 0.68, 4.2, material.teal);
  const roadSign = label("DEEPFUNDING  /  A2A NETWORK", "#087984", 7.6, 45);
  roadSign.position.set(0, 0.9, 8.1);
  city.add(roadSign);
  batch(city);

  const cars = [];
  for (let i = 0; i < 5; i++) {
    const group = new T.Group();
    box(
      group,
      1.2,
      0.38,
      0.55,
      0,
      0.55,
      0,
      i % 2 ? material.teal : material.white,
    );
    box(group, 0.64, 0.28, 0.5, -0.1, 0.85, 0, material.tower);
    group.position.set(i * 12 - 30, 0, -12 + (i % 2 ? 1.2 : -1.2));
    scene.add(group);
    cars.push(group);
  }
  const boats = [];
  for (let i = 0; i < 2; i++) {
    const group = new T.Group();
    box(group, 2, 0.3, 0.7, 0, 0, 0, material.white);
    box(group, 0.9, 0.4, 0.52, 0, 0.35, 0, material.dark);
    group.position.set(-40 + i * 72, 0, -45);
    scene.add(group);
    boats.push(group);
  }

  const heads = new T.SphereGeometry(0.165, 12, 8),
    torsos = new T.CapsuleGeometry(0.15, 0.32, 4, 8),
    limbGeo = new T.CapsuleGeometry(0.062, 0.3, 3, 6);
  const skin = [mat(0xe6c7a6), mat(0xc89773), mat(0x936749)],
    suits = [
      material.teal,
      material.gold,
      mat(0x556590),
      material.green,
      mat(0xc37054),
    ];
  const agents = [];
  function agent(color, index = 0) {
    const group = new T.Group();
    const torso = new T.Mesh(torsos, color);
    torso.position.y = 0.74;
    group.add(torso);
    const head = new T.Mesh(heads, skin[index % 3]);
    head.position.y = 1.2;
    group.add(head);
    const limbs = [];
    for (let j = 0; j < 4; j++) {
      const joint = new T.Group();
      joint.position.set(
        j < 2 ? (j === 0 ? -0.1 : 0.1) : j === 2 ? -0.23 : 0.23,
        j < 2 ? 0.48 : 0.88,
        0,
      );
      const limb = new T.Mesh(limbGeo, j < 2 ? material.dark : color);
      limb.position.y = -0.15;
      joint.add(limb);
      group.add(joint);
      limbs.push(joint);
    }
    group.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });
    scene.add(group);
    const result = { group, limbs, phase: index * 0.87 };
    agents.push(result);
    return result;
  }
  function building(x, company) {
    const group = new T.Group();
    scene.add(group);
    const ext = new T.Group();
    scene.add(ext);
    const steel = new T.Group();
    scene.add(steel);
    const trim = company ? material.teal : material.gold;
    const glass = mat(company ? 0x74b4c0 : 0x93bac4, {
      transparent: true,
      opacity: 0.9,
      metalness: 0.36,
      roughness: 0.26,
      depthWrite: false,
    });
    const roof = mat(0xe7f0eb, { transparent: true, opacity: 1 });
    box(group, 9.2, 0.45, 8.2, x, 0.4, 0, material.white);
    for (let level = 0; level < 3; level++) {
      const y = 0.63 + level * 2.85;
      if (level) box(group, 8.6, 0.14, 7.4, x, y, 0, material.white);
      for (const xx of [-4.05, 4.05])
        for (const zz of [-3.4, 3.4])
          box(steel, 0.16, 8.55, 0.16, x + xx, 4.85, zz, material.white);
      for (let j = 0; j < 6; j++) {
        const a = agent(
          suits[(j + (company ? 0 : 2)) % suits.length],
          j + level * 6,
        );
        a.group.position.set(
          x - 2.65 + (j % 3) * 2.45,
          y,
          -1.75 + Math.floor(j / 3) * 3,
        );
        a.group.rotation.y = j % 2 ? 0.4 : 2.5;
        a.base = [...a.group.position];
        a.building = company ? "company" : "funding";
        a.roleIndex = j;
      }
      // Slim desks are visible through the glass, not a flat window texture.
      for (let j = 0; j < 3; j++) {
        box(
          group,
          1.5,
          0.07,
          0.6,
          x - 2.7 + j * 2.6,
          y + 0.72,
          -2.55,
          material.trim,
        );
        box(
          group,
          0.07,
          0.7,
          0.07,
          x - 2.7 + j * 2.6,
          y + 0.36,
          -2.55,
          material.dark,
        );
        box(
          group,
          0.47,
          0.4,
          0.045,
          x - 2.7 + j * 2.6,
          y + 0.95,
          -2.72,
          material.dark,
        );
      }
      for (const z of [-3.6, 3.6])
        box(ext, 8.6, 2.66, 0.04, x, y + 1.45, z, glass);
      for (const xx of [-4.3, 4.3])
        box(ext, 0.04, 2.66, 7.2, x + xx, y + 1.45, 0, glass);
      box(steel, 8.8, 0.15, 7.65, x, y + 2.8, 0, material.white);
    }
    box(ext, 9, 0.28, 7.9, x, 9.32, 0, roof);
    box(ext, 5, 0.4, 3.6, x, 9.64, -0.6, roof);
    for (let j = 0; j < 8; j++)
      box(
        steel,
        0.06,
        8.45,
        0.07,
        x - 3.8 + j * 1.08,
        4.8,
        3.66,
        material.white,
      );
    box(steel, 9.05, 0.13, 0.13, x, 9.54, 3.94, trim);
    box(group, 2.2, 0.1, 1.5, x, 0.54, 4.2, material.white);
    const title = label(
      company ? "COMPANY & FOUNDER AGENTS" : "FUNDING AGENTS",
      company ? "#076a79" : "#85632e",
      company ? 8.4 : 6.5,
      43,
    );
    title.position.set(x, 10.5, 1.2);
    scene.add(title);
    batch(group);
    batch(steel);
    const roles = company
      ? ["FOUNDER", "STARTUP", "COMPANY", "SME"]
      : ["VC", "PE", "BANK", "ANGEL", "INCUBATOR", "INDUSTRIAL FUND"];
    const labels = roles.map((role, j) => {
      const lab = label(
        role,
        company ? "#147f8a" : "#8d6630",
        role.length > 9 ? 3 : 1.8,
        90,
      );
      lab.position.set(
        x - 2.6 + (j % 3) * 2.5,
        4.25 + (j >= 3 ? 2.85 : 0),
        1.65,
      );
      scene.add(lab);
      return lab;
    });
    return { glass, roof, title, labels };
  }
  const company = building(-11, true),
    funding = building(11, false);
  const selected = agent(
    mat(0xe9aa47, { emissive: 0x975315, emissiveIntensity: 0.15 }),
    77,
  );
  const halo = new T.Mesh(
    new T.TorusGeometry(0.49, 0.035, 8, 48),
    material.light,
  );
  halo.rotation.x = Math.PI / 2;
  selected.group.add(halo);
  halo.position.y = 0.035;
  const selectedLabel = label("AI STARTUP AGENT", "#806127", 3.9, 76);
  scene.add(selectedLabel);
  const flow = [];
  for (let i = 0; i < 16; i++) {
    const a = agent(suits[i % 5], i + 40);
    a.direction = i % 2 ? 1 : -1;
    flow.push(a);
  }
  const pulses = [];
  for (let i = 0; i < 18; i++) {
    const o = box(
      scene,
      0.34,
      0.06,
      0.055,
      0,
      0.76,
      i % 2 ? 2.21 : 6.19,
      material.light,
    );
    pulses.push(o);
  }
  const fundingNodes = agents.filter((a) => a.building === "funding");
  const links = [];
  for (let i = 0; i < fundingNodes.length; i++) {
    const end = fundingNodes[i].group.position.clone().add(V(0, 0.8, 0));
    const start = V(10, 1.45, 1.4);
    const top = start.clone().lerp(end, 0.5);
    top.y += 1.1;
    const selected = [12, 17, 8].includes(i);
    const l = curveLine(
      [start, top, end],
      selected ? 0x078a98 : 0x779197,
      selected ? 0.05 : 0.025,
    );
    l.mesh.material.depthTest = false;
    l.mesh.material.depthWrite = false;
    l.mesh.renderOrder = 12;
    scene.add(l.mesh);
    links.push({ ...l, selected, index: i });
  }
  const network = [];
  for (let i = 0; i < 7; i++) {
    const z = -2.7 + i * 0.9;
    const l = curveLine(
      [V(-10, 1, z), V(-3, 6 + i * 0.5, z), V(3, 6 + i * 0.5, z), V(10, 1, z)],
      i % 2 ? 0xc29c59 : 0x22a4b4,
      0.024,
    );
    scene.add(l.mesh);
    network.push(l);
  }
  const scan = new T.Mesh(
    new T.PlaneGeometry(8.2, 8.3),
    new T.MeshBasicMaterial({
      color: 0x44d3dd,
      transparent: true,
      opacity: 0.12,
      side: T.DoubleSide,
      depthWrite: false,
    }),
  );
  scan.position.set(11, 4.7, 0);
  scene.add(scan);
  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  function update(t) {
    const cam = cameraAt(t);
    camera.position.fromArray(cam.position);
    camera.lookAt(...cam.target);
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();
    const comp = windowAt(t, 7.8, 13, 0.6),
      fund = windowAt(t, 16.7, 24.5, 0.6);
    company.glass.opacity = lerp(0.9, 0.12, comp);
    company.roof.opacity = lerp(1, 0.17, comp);
    funding.glass.opacity = lerp(0.9, 0.12, fund);
    funding.roof.opacity = lerp(1, 0.17, fund);
    company.title.visible = t < 17 || t >= 24.5;
    company.labels.forEach((o) => {
      o.visible = comp > 0.1;
      o.material.opacity = comp;
    });
    funding.labels.forEach((o) => {
      o.visible = fund > 0.1;
      o.material.opacity = fund;
    });
    for (const a of agents) {
      const moving = (a === selected && t > 10 && t < 18) || flow.includes(a);
      for (let j = 0; j < 4; j++)
        a.limbs[j].rotation.x = moving
          ? Math.sin(t * 8 + a.phase + (j % 2) * Math.PI) * 0.5
          : Math.sin(t * 1.4 + a.phase) * 0.025;
    }
    selected.group.position.fromArray(startupPosition(t));
    const next = V(...startupPosition(Math.min(27.99, t + 0.03)));
    const delta = next.clone().sub(selected.group.position);
    selected.group.rotation.y =
      delta.length() > 0.0001 ? Math.atan2(delta.x, delta.z) : -0.4;
    selectedLabel.position.copy(selected.group.position).add(V(0, 1.8, 0));
    selectedLabel.visible = t > 8 && t < 23.7;
    for (let i = 0; i < flow.length; i++) {
      const a = flow[i];
      const travel = (t * 0.58 + i * 1.31) % 21;
      const x = a.direction === 1 ? -10.5 + travel : 10.5 - travel;
      a.group.position.set(x, 0.7, a.direction === 1 ? 3.3 : 5.3);
      a.group.rotation.y = (a.direction * Math.PI) / 2;
      a.group.visible = t >= 3 || i < 8;
    }
    for (let i = 0; i < pulses.length; i++)
      pulses[i].position.x = ((t * 3.3 + i * 1.23) % 21) - 10.5;
    links.forEach((l) => {
      l.mesh.visible = t >= 17.6 && t < 24;
      const scanIn = ramp(t, 17.6 + l.index * 0.035, 18.5 + l.index * 0.035);
      l.mesh.material.opacity =
        scanIn * (l.selected ? 0.95 : 1 - ramp(t, 19.1, 20));
      if (l.mesh.visible && l.mesh.material.opacity > 0.01) {
        l.curve.points[0].copy(selected.group.position).add(V(0, 0.8, 0));
        l.curve.points[2]
          .copy(fundingNodes[l.index].group.position)
          .add(V(0, 0.8, 0));
        l.curve.points[1]
          .copy(l.curve.points[0])
          .lerp(l.curve.points[2], 0.5)
          .add(V(0, 1.1, 0));
        l.mesh.geometry.dispose();
        l.mesh.geometry = new T.TubeGeometry(
          l.curve,
          36,
          l.selected ? 0.05 : 0.025,
          6,
          false,
        );
      }
    });
    scan.visible = t > 17.6 && t < 20;
    scan.position.z = -3.5 + 7 * ((t - 17.6) / 2.4);
    scan.material.opacity = 0.1;
    network.forEach((l) => {
      l.mesh.visible = t >= 24;
      l.mesh.material.opacity = 0.65 * ramp(t, 24, 25.2);
    });
    cars.forEach(
      (o, i) =>
        (o.position.x = ((i * 12 + t * (i % 2 ? -1.8 : 1.8) + 80) % 70) - 35),
    );
    boats.forEach((o, i) => {
      o.position.x = -40 + i * 72 + t * 0.25;
      o.position.y = -0.13 + Math.sin(t * 1.2 + i) * 0.03;
    });
    const pos = water.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(
        i,
        Math.sin(pos.getX(i) * 0.22 + t * 0.7) *
          Math.cos(pos.getZ(i) * 0.19 + t * 0.5) *
          0.055,
      );
    }
    pos.needsUpdate = true;
    water.geometry.computeVertexNormals();
    renderer.render(scene, camera);
    return {
      camera: cam,
      companyOpacity: company.glass.opacity,
      fundingOpacity: funding.glass.opacity,
      agentCount: agents.length,
      flowDirections: [1, -1],
      startup: startupPosition(t),
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      selectedLinks: links.filter(
        (l) => l.mesh.visible && l.mesh.material.opacity > 0.5,
      ).length,
    };
  }
  return { resize, update, renderer };
}
