import './style.css';
import { createRenderContext } from './core/renderer.js';
import { InputManager } from './core/input.js';
import { CameraRig } from './core/camera.js';
import { CollisionWorld } from './systems/collision.js';
import { Player } from './entities/player.js';
import { createSky } from './world/sky.js';
import { buildIsland } from './world/diorama.js';
import { bake, place } from './world/builders.js';
import { house, tree, well } from './world/props.js';

const ctx = createRenderContext(document.getElementById('app'));
const input = new InputManager(ctx.renderer.domElement);
const rig = new CameraRig(ctx.camera);
const sky = createSky(ctx.scene);
const collision = new CollisionWorld();

const island = buildIsland({ hw: 22, hd: 20, radius: 7 });
const area = island.group;
area.add(place(house(), -10, 0, -8));
collision.addBox(-10, -8, 2, 1.7);
area.add(place(well(), 5, 0, 3));
collision.addCircle(5, 3, 1.1);
area.add(place(tree(1.1), 8, 0, -8));
collision.addCircle(8, -8, 0.5);
bake(area);
collision.setBounds(21.5, 19.5, 6.5);
ctx.scene.add(area);

const player = new Player();
ctx.scene.add(player.group);
rig.follow(player.position);
rig.snap();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (input.consume('rotateLeft')) rig.rotate(-1);
  if (input.consume('rotateRight')) rig.rotate(1);
  player.update(dt, input, rig, collision);
  rig.follow(player.position);
  rig.update(dt);
  ctx.followShadow(rig.focus);
  sky.update(dt);
  ctx.renderer.render(ctx.scene, ctx.camera);
  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__pt = { player, rig, collision, ctx };
