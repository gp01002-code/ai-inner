/* 為原作加上環繞觀看：拖曳旋轉、滾輪縮放、方向鍵。
   不改動原作自己的鏡頭邏輯——只在每次繪製（與射線檢測）前，把鏡頭繞場景原點暫時轉到觀眾選的角度，畫完再還原。
   拖動超過一點距離時，會送出「放開」讓原作的長按停止，避免旋轉時誤觸。 */
(function () {
  if (!window.THREE) return;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let yaw = 0, pitch = 0, zoom = 1, tYaw = 0, tPitch = 0, tZoom = 1, drag = null, quiet = false, idle = 0, last = 0;
  const R = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, 'YXZ'), P = new THREE.Vector3(), Q = new THREE.Quaternion();

  function step() {
    const now = performance.now(), dt = last ? Math.min((now - last) / 1000, .05) : .016;
    last = now; idle += dt;
    yaw += (tYaw - yaw) * Math.min(1, dt * 7); pitch += (tPitch - pitch) * Math.min(1, dt * 7); zoom += (tZoom - zoom) * Math.min(1, dt * 7);
    E.set(pitch, yaw, 0); R.setFromEuler(E);
  }
  function apply(camera) {
    P.copy(camera.position); Q.copy(camera.quaternion);
    camera.position.multiplyScalar(zoom).applyQuaternion(R); camera.quaternion.premultiply(R); camera.updateMatrixWorld(true);
  }
  function restore(camera) { camera.position.copy(P); camera.quaternion.copy(Q); camera.updateMatrixWorld(true); }

  const render = THREE.WebGLRenderer.prototype.render;
  THREE.WebGLRenderer.prototype.render = function (scene, camera) {
    if (!camera || !camera.isPerspectiveCamera || (this.xr && this.xr.isPresenting)) return render.call(this, scene, camera);
    step(); apply(camera);
    try { return render.call(this, scene, camera); } finally { restore(camera); }
  };
  const setFromCamera = THREE.Raycaster.prototype.setFromCamera;
  THREE.Raycaster.prototype.setFromCamera = function (coords, camera) {
    if (!camera || !camera.isPerspectiveCamera) return setFromCamera.call(this, coords, camera);
    apply(camera);
    try { return setFromCamera.call(this, coords, camera); } finally { restore(camera); }
  };

  function cancelPress() {
    quiet = true;
    window.dispatchEvent(new MouseEvent('mouseup'));
    window.dispatchEvent(new Event('touchend'));
    window.dispatchEvent(new PointerEvent('pointerup'));
    quiet = false;
  }
  addEventListener('pointerdown', e => { if (e.button) return; drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId }; }, true);
  addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.moved > 12) {
      if (!drag.orbit) { drag.orbit = true; cancelPress(); hint.style.opacity = 0; }
      tYaw -= dx * .006; tPitch = clamp(tPitch - dy * .005, -.9, .9); idle = 0;
    }
  }, true);
  addEventListener('pointerup', () => { if (!quiet) drag = null; }, true);
  addEventListener('pointercancel', () => { drag = null; }, true);
  addEventListener('wheel', e => { tZoom = clamp(tZoom * Math.exp(e.deltaY * .001), .5, 2); hint.style.opacity = 0; }, { passive: true });
  addEventListener('keydown', e => {
    const k = { ArrowLeft: [.15, 0], ArrowRight: [-.15, 0], ArrowUp: [0, .12], ArrowDown: [0, -.12] }[e.key];
    if (k) { e.preventDefault(); tYaw += k[0]; tPitch = clamp(tPitch + k[1], -.9, .9); }
  });

  const hint = document.createElement('div');
  hint.textContent = '拖曳環繞 · 滾輪縮放';
  hint.style.cssText = 'position:fixed;left:0;right:0;bottom:3.2vh;text-align:center;pointer-events:none;z-index:20;font:11px "Courier New",monospace;letter-spacing:5px;color:rgba(150,210,240,.55);transition:opacity 1.5s;opacity:0';
  addEventListener('DOMContentLoaded', () => { document.body.append(hint); setTimeout(() => hint.style.opacity = 1, 2500); setTimeout(() => hint.style.opacity = 0, 12000); });
})();
