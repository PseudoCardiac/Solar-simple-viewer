import * as THREE from 'three';
import PLANETS from "./planets.js"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { popupOpen, popupClose } from "./popup.js"

// キャラクター紹介文は任意の外部ファイル（characters.js）。
// git管理外のため存在しないこともあるので、無ければ黙ってスキップする。
let CHARACTER_DESCRIPTIONS = {};
try {
  ({ CHARACTER_DESCRIPTIONS } = await import('./characters.js'));
} catch (e) {
  console.info('characters.js が無いため、キャラクター紹介は非表示になります。');
}

// ----------------------------------------------------------------------
// Canvas で惑星テクスチャを生成（外部画像に依存しない）
// ----------------------------------------------------------------------
function makePlanetTexture(planet, size = 512) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size / 2;
  const ctx = c.getContext('2d');
  const [a, b, hi] = planet.colors;
  const w = c.width, h = c.height;

  // ベースの縦グラデーション
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, b); g.addColorStop(0.5, a); g.addColorStop(1, b);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

  const rand = mulberry(planet.key.length * 99 + planet.distance);

  if (planet.texture === 'gas' || planet.texture === 'cloudy') {
    // 横縞模様
    for (let i = 0; i < 26; i++) {
      const y = rand() * h;
      const bh = 4 + rand() * 16;
      ctx.fillStyle = shade([a, b, hi][Math.floor(rand() * 3)], (rand() - 0.5) * 40);
      ctx.globalAlpha = 0.55;
      ctx.fillRect(0, y, w, bh);
    }
    ctx.globalAlpha = 1;
  } else if (planet.texture === 'earth') {
    // 大陸風のブロブ
    ctx.fillStyle = planet.colors[1];
    for (let i = 0; i < 28; i++) {
      ctx.globalAlpha = 0.85;
      blob(ctx, rand() * w, rand() * h, 12 + rand() * 50, rand);
    }
    ctx.globalAlpha = 1;
  } else if (planet.texture === 'ice') {
    for (let i = 0; i < 14; i++) {
      const y = rand() * h;
      ctx.fillStyle = shade(hi, (rand() - 0.5) * 24);
      ctx.globalAlpha = 0.35;
      ctx.fillRect(0, y, w, 3 + rand() * 8);
    }
    ctx.globalAlpha = 1;
  } else {
    // 岩石：クレーターと斑点
    for (let i = 0; i < 260; i++) {
      const x = rand() * w, y = rand() * h, r = rand() * 6 + 1;
      ctx.fillStyle = shade(a, (rand() - 0.5) * 60);
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  return c;
}

function blob(ctx, x, y, r, rand) {
  ctx.beginPath();
  const pts = 8;
  for (let i = 0; i <= pts; i++) {
    const ang = (i / pts) * Math.PI * 2;
    const rr = r * (0.6 + rand() * 0.7);
    const px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr * 0.7;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return `rgb(${r|0},${g|0},${b|0})`;
}
function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ----------------------------------------------------------------------
// Three.js シーン構築
// ----------------------------------------------------------------------
const app = document.getElementById('app');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 5000);
camera.position.set(0, 110, 260);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
app.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 30;
controls.maxDistance = 900;

// テクスチャ読み込み（用意された equirectangular マップ）
const TEX_DIR = 'textures/ssc/';   // Solar System Scope（CC BY 4.0）
const texLoader = new THREE.TextureLoader();
function loadTex(file, { srgb = true } = {}) {
  // スラッシュを含む場合はそのままのパス、含まない場合は既定フォルダ配下とみなす
  const path = file.includes('/') ? file : TEX_DIR + file;
  const t = texLoader.load(path);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

// 天体の表面マテリアル：用意されたテクスチャがあれば使い、無ければ手描きにフォールバック
//   map     … フルカラーのテクスチャをそのまま使う
//   tintMap … モノクロのテクスチャを「模様」として使い、天体の色（colors[0]）で着色する
function bodyMaterial(data, roughness) {
  const opts = { roughness, metalness: 0.04 };
  let map;
  if (data.tintMap) {
    // モノクロの模様 × 天体色 → 色はそのままに模様だけ反映
    map = loadTex(data.tintMap);
    opts.color = new THREE.Color(data.colors ? data.colors[0] : 0xffffff);
  } else if (data.map) {
    map = loadTex(data.map);
  } else {
    map = new THREE.CanvasTexture(makePlanetTexture(data, 256));
    map.colorSpace = THREE.SRGBColorSpace;
  }
  opts.map = map;
  // ノーマルマップ（地球など）— 凹凸の陰影を付ける。色ではないので非sRGBで読み込む。
  if (data.normalMap) {
    opts.normalMap = loadTex(data.normalMap, { srgb: false });
    opts.normalScale = new THREE.Vector2(0.8, 0.8);
  }
  data._tex = map;   // ポップアップのプレビュー描画に流用
  return new THREE.MeshStandardMaterial(opts);
}

// 星空の背景
function makeStars() {
  const geo = new THREE.BufferGeometry();
  const n = 2500, pos = new Float32Array(n * 3);
  const rand = mulberry(7);
  for (let i = 0; i < n; i++) {
    const r = 800 + rand() * 1500;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: true });
  return new THREE.Points(geo, mat);
}
scene.add(makeStars());

// 太陽
const sunTex = loadTex('sun.jpg');
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(12, 48, 48),
  new THREE.MeshBasicMaterial({ map: sunTex })
);
// 太陽もクリックで詳細を表示できるようにデータを持たせる
const SUN = {
  key: 'sun', name: '太陽', en: 'Sun', star: true,
  subtitle: '太陽系の中心に輝く恒星',
  desc: '太陽系の質量の99.8%以上を占める、自ら輝く恒星です。中心部では水素がヘリウムに変わる核融合が起こり、莫大なエネルギーを生み出しています。その重力がすべての惑星をつなぎとめ、光と熱が地球の生命を支えています。',
  facts: { '直径': '1,392,000 km', '表面温度': '約 5,500 ℃', '中心温度': '約 1,500 万℃', '分類': 'G型主系列星' },
  _mesh: sun, _tex: sunTex
};
sun.userData.planet = SUN;
scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff, 0.18));
const sunLight = new THREE.PointLight(0xffffff, 2.6, 0, 0.0);
scene.add(sunLight);

// 惑星と軌道を生成
const orbitLines = [];
const labels = [];
const planetMeshes = [];
const selectables = [sun]; // クリック・ホバー対象（太陽＋惑星＋衛星）
const moonGroups = [];    // 惑星ごとの衛星のまとまり
const moonLabels = [];    // 衛星名ラベル（位置追従用）
const cloudLayers = [];   // 雲・大気レイヤー（オンオフ用）

PLANETS.forEach((p) => {
  // 公転面の傾き（黄道に対する軌道傾斜角）を表すグループ。
  // 軌道線・惑星のピボットをまとめて傾けることで、軌道ごと斜めになる。
  // node（昇交点の向き）を惑星ごとに変えて、傾く方向もばらつかせる。
  const orbitPlane = new THREE.Object3D();
  orbitPlane.rotation.order = 'YXZ';
  orbitPlane.rotation.y = mulberry(Math.round(p.distance) * 7 + 1)() * Math.PI * 2;
  orbitPlane.rotation.x = THREE.MathUtils.degToRad(p.incl || 0);
  scene.add(orbitPlane);

  // 公転の中心となるピボット
  const pivot = new THREE.Object3D();
  orbitPlane.add(pivot);

  // 地軸の傾きを表すグループ（公転とは独立して傾きを保つ）
  const tiltGroup = new THREE.Object3D();
  tiltGroup.position.x = p.distance;
  tiltGroup.rotation.z = THREE.MathUtils.degToRad(p.tilt || 0);
  pivot.add(tiltGroup);

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.size, 48, 48),
    bodyMaterial(p, 0.85)
  );
  mesh.userData.planet = p;
  tiltGroup.add(mesh);          // 傾いた軸のまわりで自転する
  planetMeshes.push(mesh);
  selectables.push(mesh);

  // 雲・大気レイヤー（金星＝不透明な大気 / 地球＝半透明の雲）。オンオフ可能。
  if (p.cloud) {
    const cl = p.cloud;
    let cmat;
    if (cl.opaque) {
      // 金星：分厚い大気が地表を覆い隠す
      cmat = new THREE.MeshStandardMaterial({ map: loadTex(cl.map), roughness: 1, metalness: 0 });
    } else {
      // 地球：白い雲を半透明に重ねる（雲テクスチャの明度をそのまま不透明度に使う）
      cmat = new THREE.MeshStandardMaterial({
        color: 0xffffff, alphaMap: loadTex(cl.map, { srgb: false }),
        transparent: true, depthWrite: false, opacity: 0.9, roughness: 1
      });
    }
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(p.size * (cl.scale || 1.02), 48, 48), cmat);
    mesh.add(cloud);            // 惑星と一緒に自転・傾斜する
    cloudLayers.push(cloud);
    p._cloud = cloud;
  }

  // 環（土星・天王星）— 惑星の赤道面に沿う。
  // 天王星は地軸が約98°傾いているため、環はほぼ縦向きに見える。
  if (p.ring) {
    const inner = p.size * (p.key === 'saturn' ? 1.2 : 1.78);
    const outer = p.size * (p.key === 'saturn' ? 2.3 : 1.98);
    const rgeo = new THREE.RingGeometry(inner, outer, 160);
    // UV を半径方向に貼り直す（リングのテクスチャ＝内→外のグラデーション帯を正しく巻く）
    const rpos = rgeo.attributes.position, ruv = rgeo.attributes.uv, rv = new THREE.Vector3();
    for (let i = 0; i < rpos.count; i++) {
      rv.fromBufferAttribute(rpos, i);
      ruv.setXY(i, (rv.length() - inner) / (outer - inner), 0.5);
    }
    const ringMat = p.ringTex
      ? new THREE.MeshBasicMaterial({ map: loadTex(p.ringTex), side: THREE.DoubleSide, transparent: true })
      : new THREE.MeshBasicMaterial({ color: 0x8fc7cf, side: THREE.DoubleSide, transparent: true, opacity: 0.38 });
    const ring = new THREE.Mesh(rgeo, ringMat);
    ring.rotation.x = Math.PI / 2;   // 赤道面に正確に合わせる
    tiltGroup.add(ring);             // 傾きはグループ側が担う
  }

  // 衛星（普段は非表示。親惑星にフォーカスしたときだけ表示してごちゃつきを防ぐ）
  const group = { planet: p, meshes: [], orbits: [], labels: [] };
  if (p.moons) {
    p.moons.forEach((m) => {
      m.isMoon = true;
      m.parent = p;

      // 衛星の公転ピボット（惑星の赤道面 = tiltGroup 内に置くので地軸の傾きを共有する）
      const mPivot = new THREE.Object3D();
      mPivot.rotation.y = mulberry(m.key.length * 13 + m.distance)() * Math.PI * 2;
      tiltGroup.add(mPivot);

      const mmesh = new THREE.Mesh(
        new THREE.SphereGeometry(m.size, 32, 32),
        bodyMaterial(m, 0.95)
      );
      mmesh.position.x = m.distance;
      // 潮汐ロック：常に同じ面（表側）を母惑星へ向ける。
      // テクスチャの中心（表側）は球の +X 側に来るが、それは母惑星と反対を向くため
      // 180°回して表側を母惑星側へ向ける。
      mmesh.rotation.y = Math.PI;
      mmesh.userData.planet = m;
      mPivot.add(mmesh);
      selectables.push(mmesh);

      // 衛星の軌道線
      const og = new THREE.BufferGeometry();
      const mpts = [];
      for (let i = 0; i <= 80; i++) {
        const a = (i / 80) * Math.PI * 2;
        mpts.push(Math.cos(a) * m.distance, 0, Math.sin(a) * m.distance);
      }
      og.setAttribute('position', new THREE.Float32BufferAttribute(mpts, 3));
      const oline = new THREE.Line(og, new THREE.LineBasicMaterial({ color: 0x70839f, transparent: true, opacity: 0.45 }));
      tiltGroup.add(oline);

      // 衛星名ラベル（惑星より小さめ）
      const mlabel = makeLabel(m.name, { font: 22, scale: [9, 2.25], color: '#dfe7f2' });
      mlabel.userData.mesh = mmesh;
      scene.add(mlabel);
      moonLabels.push(mlabel);

      m._pivot = mPivot;
      m._mesh = mmesh;

      group.meshes.push(mmesh);
      group.orbits.push(oline);
      group.labels.push(mlabel);
    });
  }
  moonGroups.push(group);

  // 軌道線
  const orbitGeo = new THREE.BufferGeometry();
  const seg = 128, pts = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pts.push(Math.cos(a) * p.distance, 0, Math.sin(a) * p.distance);
  }
  orbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const orbit = new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({ color: 0x3a567f, transparent: true, opacity: 0.5 }));
  orbitPlane.add(orbit);   // 軌道線も公転面と一緒に傾く
  orbitLines.push(orbit);

  // 名前ラベル（スプライト）
  const label = makeLabel(p.name);
  label.userData.mesh = mesh;
  scene.add(label);
  labels.push(label);

  // ランダムな初期角度
  pivot.rotation.y = mulberry(p.distance)() * Math.PI * 2;
  p._pivot = pivot;
  p._mesh = mesh;
});

function makeLabel(text, opts = {}) {
  const fs = opts.font || 30;
  const color = opts.color || '#cfe0f5';
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.font = `600 ${fs}px "Hiragino Sans","Noto Sans JP",sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6;
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  const sc = opts.scale || [16, 4];
  sp.scale.set(sc[0], sc[1], 1);
  return sp;
}

// ----------------------------------------------------------------------
// インタラクション：クリック / ホバー
// ----------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
let hovered = null;

function setPointer(e) {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
}

renderer.domElement.addEventListener('pointermove', (e) => {
  setPointer(e);
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(selectables, false).find(h => h.object.visible);
  if (hit) {
    hovered = hit.object;
    renderer.domElement.style.cursor = 'pointer';
    tooltip.textContent = hovered.userData.planet.name;
    tooltip.style.left = e.clientX + 'px';
    tooltip.style.top = e.clientY + 'px';
    tooltip.style.opacity = '1';
  } else {
    hovered = null;
    renderer.domElement.style.cursor = 'grab';
    tooltip.style.opacity = '0';
  }
});

// クリック（ドラッグと区別するため移動量をチェック）
let downPos = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downPos = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  downPos = null;
  if (moved > 6) return; // ドラッグなので無視
  setPointer(e);
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(selectables, false).find(h => h.object.visible);
  if (hit) {
    popupOpen(hit.object.userData.planet);
    focusPlanet(hit.object.userData.planet.isMoon ? hit.object.userData.planet.parent : hit.object.userData.planet);
  }
});

// ----------------------------------------------------------------------
// ポップアップ
// ----------------------------------------------------------------------
// const popup = document.getElementById('popup');
// const popupCanvas = popup.querySelector('canvas.planet-img');
// const popupChar = popup.querySelector('img.char-img');
// const popupPreview = popup.querySelector('.preview');
// // キャラクター画像が無い（git管理外）場合は枠を畳んで通常表示に戻す
// popupChar.onerror = () => { popupChar.removeAttribute('src'); popupPreview.classList.remove('has-character'); };

// function openPopup(p) {
//   popup.querySelector('h2').textContent = `${p.name}（${p.en}）`;
//   popup.querySelector('.subtitle').textContent = p.subtitle;
//   popup.querySelector('p').textContent = p.desc;
//   popup.querySelector('.badge').textContent = p.isMoon
//     ? `MOON · ${p.parent.name}の衛星`
//     : (p.star ? 'STAR' : (p.dwarf ? 'DWARF PLANET' : 'PLANET'));

//   const facts = popup.querySelector('.facts');
//   facts.innerHTML = '';
//   for (const [k, v] of Object.entries(p.facts)) {
//     const d = document.createElement('div');
//     d.innerHTML = `<span class="label">${k}</span><span class="value">${v}</span>`;
//     facts.appendChild(d);
//   }

//   // 惑星の画像をその場で描画（球体風シェーディング）
//   drawPlanetPreview(popupCanvas, p);

//   // イメージキャラクター画像（用意されている惑星のみ）
//   if (p.character) {
//     popupChar.src = p.character;
//     popupChar.alt = `${p.name}のイメージキャラクター`;
//     popupPreview.classList.add('has-character');
//   } else {
//     popupChar.removeAttribute('src');
//     popupChar.alt = '';
//     popupPreview.classList.remove('has-character');
//   }

//   // キャラクター紹介文（characters.js にまとめてある。用意されている天体のみ表示）
//   const charDescBox = popup.querySelector('.char-desc');
//   const charDesc = CHARACTER_DESCRIPTIONS[p.key];
//   if (charDesc) {
//     popup.querySelector('.cd-text').textContent = charDesc;
//     charDescBox.classList.add('show');
//   } else {
//     charDescBox.classList.remove('show');
//   }

//   popup.classList.add('show');

//   // 衛星の表示切り替え：惑星ならその惑星、衛星なら親惑星をアクティブにする
//   activePlanet = p.isMoon ? p.parent : p;
//   updateMoonVisibility();
//   focusPlanet(p.isMoon ? p.parent : p);
// }

// function drawPlanetPreview(canvas, p) {
//   const ctx = canvas.getContext('2d');
//   const W = canvas.width, H = canvas.height, R = W * 0.45, cx = W/2, cy = H/2;
//   ctx.clearRect(0, 0, W, H);
//   ctx.save();
//   ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.clip();
//   // 下地：用意されたテクスチャ画像があれば中央を正方形に切り出して使い、無ければ手描き
//   const img = p._tex && p._tex.image;
//   if (img && img.complete && img.width) {
//     const s = Math.min(img.width, img.height);
//     ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, cx - R, cy - R, R*2, R*2);
//     // モノクロの模様テクスチャは天体色で着色（3D表示と合わせる）
//     if (p.tintMap && p.colors) {
//       ctx.save();
//       ctx.globalCompositeOperation = 'multiply';
//       ctx.fillStyle = p.colors[0];
//       ctx.fillRect(cx - R, cy - R, R*2, R*2);
//       ctx.restore();
//     }
//   } else {
//     ctx.drawImage(makePlanetTexture(p, 600), cx - R, cy - R, R*2, R*2);
//   }
//   // 球体の陰影
//   const sh = ctx.createRadialGradient(cx - R*0.35, cy - R*0.35, R*0.2, cx, cy, R*1.15);
//   sh.addColorStop(0, 'rgba(255,255,255,0.25)');
//   sh.addColorStop(0.5, 'rgba(0,0,0,0)');
//   sh.addColorStop(1, 'rgba(0,0,0,0.75)');
//   ctx.fillStyle = sh; ctx.fillRect(cx-R, cy-R, R*2, R*2);
//   ctx.restore();
//   // 環 — 地軸の傾きに合わせて向きを変える（天王星はほぼ縦向き）
//   if (p.ring) {
//     ctx.save();
//     ctx.translate(cx, cy);
//     ctx.rotate(THREE.MathUtils.degToRad(p.tilt || 0));  // 赤道面の傾き
//     ctx.scale(1, 0.32);                                  // 見込み角による圧縮
//     ctx.strokeStyle = p.key === 'saturn' ? 'rgba(216,199,154,0.85)' : 'rgba(159,212,216,0.6)';
//     ctx.lineWidth = R * (p.key === 'saturn' ? 0.2 : 0.06);
//     ctx.beginPath(); ctx.arc(0, 0, R * 1.5, 0, Math.PI*2); ctx.stroke();
//     ctx.restore();
//   }
// }

// popup.querySelector('.close').addEventListener('click', () => popup.classList.remove('show'));

// 選択した惑星にカメラを寄せる
let focusTarget = null;
function focusPlanet(p) { focusTarget = p._mesh; }

// 衛星の表示制御：アクティブな惑星の衛星だけを見せる
let activePlanet = null;
function updateMoonVisibility() {
  moonGroups.forEach((g) => {
    const on = moonsEnabled && g.planet === activePlanet;
    g.meshes.forEach(x => x.visible = on);
    g.orbits.forEach(x => x.visible = on && showOrbits);
    g.labels.forEach(x => x.visible = on && showLabels);
  });
}

// ----------------------------------------------------------------------
// コントロールボタン
// ----------------------------------------------------------------------
let paused = false, showOrbits = true, showLabels = true, moonsEnabled = true, showClouds = true;
const btnPause = document.getElementById('btn-pause');
const btnOrbits = document.getElementById('btn-orbits');
const btnLabels = document.getElementById('btn-labels');
const btnMoons = document.getElementById('btn-moons');
const btnClouds = document.getElementById('btn-clouds');

btnPause.onclick = () => {
  paused = !paused;
  btnPause.textContent = paused ? '▶ 再生' : '⏸ 一時停止';
  btnPause.classList.toggle('active', paused);
};
btnOrbits.onclick = () => {
  showOrbits = !showOrbits;
  orbitLines.forEach(o => o.visible = showOrbits);
  btnOrbits.classList.toggle('active', showOrbits);
  updateMoonVisibility();
};
btnLabels.onclick = () => {
  showLabels = !showLabels;
  labels.forEach(l => l.visible = showLabels);
  btnLabels.classList.toggle('active', showLabels);
  updateMoonVisibility();
};
btnMoons.onclick = () => {
  moonsEnabled = !moonsEnabled;
  btnMoons.classList.toggle('active', moonsEnabled);
  updateMoonVisibility();
};
btnClouds.onclick = () => {
  showClouds = !showClouds;
  cloudLayers.forEach(c => c.visible = showClouds);
  btnClouds.classList.toggle('active', showClouds);
};

// 初期状態では衛星は非表示（惑星をクリックすると現れる）
updateMoonVisibility();

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') popup.classList.remove('show'); });

// ----------------------------------------------------------------------
// アニメーションループ
// ----------------------------------------------------------------------
const SPEED = 0.0016;
const tmp = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  if (!paused) {
    PLANETS.forEach((p) => {
      p._pivot.rotation.y += p.speed * SPEED;
      p._mesh.rotation.y += p.spin;
      if (p.moons) p.moons.forEach(m => { m._pivot.rotation.y += m.speed * SPEED * 4; });
    });
    sun.rotation.y += 0.001;
  }

  // ラベルを惑星の上に追従
  labels.forEach((l) => {
    l.userData.mesh.getWorldPosition(tmp);
    l.position.set(tmp.x, tmp.y + l.userData.mesh.userData.planet.size + 4, tmp.z);
  });

  // 衛星ラベルの追従（表示中のものだけ）
  moonLabels.forEach((l) => {
    if (!l.visible) return;
    const m = l.userData.mesh.userData.planet;
    l.userData.mesh.getWorldPosition(tmp);
    l.position.set(tmp.x, tmp.y + m.size + 1.6, tmp.z);
  });

  // 惑星にフォーカス中はカメラのターゲットを滑らかに移動
  if (focusTarget) {
    focusTarget.getWorldPosition(tmp);
    controls.target.lerp(tmp, 0.06);
  } else {
    controls.target.lerp(new THREE.Vector3(0,0,0), 0.04);
  }

  controls.update();
  renderer.render(scene, camera);
}

// ダブルクリックでフォーカス解除（衛星も隠してビューをすっきりさせる）
renderer.domElement.addEventListener('dblclick', () => {
  focusTarget = null;
  activePlanet = null;
  updateMoonVisibility();
  popup.classList.remove('show');
});

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

animate();

// ローディング解除
setTimeout(() => document.getElementById('loading').classList.add('hide'), 400);