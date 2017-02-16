// This set of controls performs orbiting, zooming, and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finger swipe

import * as THREE from 'three';

export class OrbitControls extends THREE.EventDispatcher {
  // 将原先方法里面的 closure 统一移出来放这里
  private closure = {
    update: {
      offset: new THREE.Vector3(),
      // so camera.up is the orbit axis
      quat: new THREE.Quaternion().setFromUnitVectors(this.object.up, new THREE.Vector3(0, 1, 0)),
      lastPosition: new THREE.Vector3(),
      lastQuaternion: new THREE.Quaternion(),
    },
    panLeft: { v: new THREE.Vector3() },
    panUp: { v: new THREE.Vector3() },
    pan: { offset: new THREE.Vector3() },
  };

  // Set to false to disable this control
  enabled = true;

  // "target" sets the location of focus, where the object orbits around
  target = new THREE.Vector3();

  // How far you can dolly in and out ( PerspectiveCamera only )
  minDistance = 0;
  maxDistance = Infinity;

  // How far you can zoom in and out ( OrthographicCamera only )
  minZoom = 0;
  maxZoom = Infinity;

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  minPolarAngle = 0; // radians
  maxPolarAngle = Math.PI; // radians

  // How far you can orbit horizontally, upper and lower limits.
  // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
  minAzimuthAngle = - Infinity; // radians
  maxAzimuthAngle = Infinity; // radians

  // Set to true to enable damping (inertia)
  // If damping is enabled, you must call controls.update() in your animation loop
  enableDamping = false;
  dampingFactor = 0.25;

  // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
  // Set to false to disable zooming
  enableZoom = true;
  zoomSpeed = 1.0;

  // Set to false to disable rotating
  enableRotate = true;
  rotateSpeed = 1.0;

  // Set to false to disable panning
  enablePan = true;
  keyPanSpeed = 7.0;	// pixels moved per arrow key push

  // Set to true to automatically rotate around the target
  // If auto-rotate is enabled, you must call controls.update() in your animation loop
  autoRotate = false;
  autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

  // Set to false to disable use of the keys
  enableKeys = true;

  // The four arrow keys
  keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

  // Mouse buttons
  mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };

  // for reset
  target0 = this.target.clone();
  position0 = this.object.position.clone();
  zoom0 = this.object.zoom;

  //
  // internals
  //

  private changeEvent = { type: 'change' };
  private startEvent = { type: 'start' };
  private endEvent = { type: 'end' };

  private STATE = { NONE: - 1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY: 4, TOUCH_PAN: 5 };

  private state = this.STATE.NONE;

  private EPS = 0.000001;

  // current position in spherical coordinates
  private spherical = new THREE.Spherical();
  private sphericalDelta = new THREE.Spherical();

  private scale = 1;
  private panOffset = new THREE.Vector3();
  private zoomChanged = false;

  private rotateStart = new THREE.Vector2();
  private rotateEnd = new THREE.Vector2();
  private rotateDelta = new THREE.Vector2();

  private panStart = new THREE.Vector2();
  private panEnd = new THREE.Vector2();
  private panDelta = new THREE.Vector2();

  private dollyStart = new THREE.Vector2();
  private dollyEnd = new THREE.Vector2();
  private dollyDelta = new THREE.Vector2();

  constructor(public object, public domElement: HTMLElement = document.body) {
    super();

    this.domElement.addEventListener('contextmenu', this.onContextMenu, false);

    this.domElement.addEventListener('mousedown', this.onMouseDown, false);
    this.domElement.addEventListener('wheel', this.onMouseWheel, false);

    this.domElement.addEventListener('touchstart', this.onTouchStart, false);
    this.domElement.addEventListener('touchend', this.onTouchEnd, false);
    this.domElement.addEventListener('touchmove', this.onTouchMove, false);

    window.addEventListener('keydown', this.onKeyDown, false);

    // force an update at start
    this.update();
  }

  public getPolarAngle() {
    return this.spherical.phi;
  };

  public getAzimuthalAngle() {
    return this.spherical.theta;
  };

  public reset() {
    this.target.copy(this.target0);
    this.object.position.copy(this.position0);
    this.object.zoom = this.zoom0;

    this.object.updateProjectionMatrix();
    this.dispatchEvent(this.changeEvent);

    this.update();
    this.state = this.STATE.NONE;
  };

  // this method is exposed, but perhaps it would be better if we can make it private...
  public update() {
    const { offset, quat, lastPosition, lastQuaternion } = this.closure.update;
    const quatInverse = this.closure.update.quat.clone().inverse();
    const position = this.object.position;

    offset.copy(position).sub(this.target);

    // rotate offset to "y-axis-is-up" space
    offset.applyQuaternion(quat);

    // angle from z-axis around y-axis
    this.spherical.setFromVector3(offset);

    if (this.autoRotate && this.state === this.STATE.NONE) {
      this.rotateLeft(this.getAutoRotationAngle());
    }

    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;

    // restrict theta to be between desired limits
    this.spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, this.spherical.theta));

    // restrict phi to be between desired limits
    this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));

    this.spherical.makeSafe();

    this.spherical.radius *= this.scale;

    // restrict radius to be between desired limits
    this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));

    // move target to panned location
    this.target.add(this.panOffset);

    offset.setFromSpherical(this.spherical);

    // rotate offset back to "camera-up-vector-is-up" space
    offset.applyQuaternion(quatInverse);

    position.copy(this.target).add(offset);

    this.object.lookAt(this.target);

    if (this.enableDamping === true) {
      this.sphericalDelta.theta *= (1 - this.dampingFactor);
      this.sphericalDelta.phi *= (1 - this.dampingFactor);
    } else {
      this.sphericalDelta.set(0, 0, 0);
    }

    this.scale = 1;
    this.panOffset.set(0, 0, 0);

    // update condition is:
    // min(camera displacement, camera rotation in radians)^2 > EPS
    // using small-angle approximation cos(x/2) = 1 - x^2 / 8

    if (this.zoomChanged ||
      lastPosition.distanceToSquared(this.object.position) > this.EPS ||
      8 * (1 - lastQuaternion.dot(this.object.quaternion)) > this.EPS) {

      this.dispatchEvent(this.changeEvent);

      lastPosition.copy(this.object.position);
      lastQuaternion.copy(this.object.quaternion);
      this.zoomChanged = false;

      return true;
    }
    return false;
  }

  public dispose() {
    this.domElement.removeEventListener('contextmenu', this.onContextMenu, false);
    this.domElement.removeEventListener('mousedown', this.onMouseDown, false);
    this.domElement.removeEventListener('wheel', this.onMouseWheel, false);

    this.domElement.removeEventListener('touchstart', this.onTouchStart, false);
    this.domElement.removeEventListener('touchend', this.onTouchEnd, false);
    this.domElement.removeEventListener('touchmove', this.onTouchMove, false);

    document.removeEventListener('mousemove', this.onMouseMove, false);
    document.removeEventListener('mouseup', this.onMouseUp, false);

    window.removeEventListener('keydown', this.onKeyDown, false);
  }

  private getAutoRotationAngle() {
    return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
  }

  private getZoomScale() {
    return Math.pow(0.95, this.zoomSpeed);
  }

  private rotateLeft(angle) {
    this.sphericalDelta.theta -= angle;
  }

  private rotateUp(angle) {
    this.sphericalDelta.phi -= angle;
  }

  private panLeft(distance, objectMatrix) {
    const v = this.closure.panLeft.v;
    v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
    v.multiplyScalar(- distance);
    this.panOffset.add(v);
  }

  private panUp (distance, objectMatrix) {
    const v = this.closure.panUp.v;
    v.setFromMatrixColumn(objectMatrix, 1); // get Y column of objectMatrix
    v.multiplyScalar(distance);
    this.panOffset.add(v);
  }

  // deltaX and deltaY are in pixels; right and down are positive
  private pan(deltaX, deltaY) {
    const offset = this.closure.pan.offset;
    const element = this.domElement;

    if (this.object instanceof THREE.PerspectiveCamera) {
      // perspective
      const position = this.object.position;
      offset.copy(position).sub(this.target);
      let targetDistance = offset.length();

      // half of the fov is center to top of screen
      targetDistance *= Math.tan((this.object.fov / 2) * Math.PI / 180.0);

      // we actually don't use screenWidth, since perspective camera is fixed to screen height
      this.panLeft(2 * deltaX * targetDistance / element.clientHeight, this.object.matrix);
      this.panUp(2 * deltaY * targetDistance / element.clientHeight, this.object.matrix);
    } else if (this.object instanceof THREE.OrthographicCamera) {
      // orthographic
      this.panLeft(deltaX * (this.object.right - this.object.left) / this.object.zoom / element.clientWidth, this.object.matrix);
      this.panUp(deltaY * (this.object.top - this.object.bottom) / this.object.zoom / element.clientHeight, this.object.matrix);
    } else {
      // camera neither orthographic nor perspective
      console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
      this.enablePan = false;
    }
  }

  private dollyIn(dollyScale) {
    if (this.object instanceof THREE.PerspectiveCamera) {
      this.scale /= dollyScale;
    } else if (this.object instanceof THREE.OrthographicCamera) {
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom * dollyScale));
      this.object.updateProjectionMatrix();
      this.zoomChanged = true;
    } else {
      console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
      this.enableZoom = false;
    }
  }

  private dollyOut(dollyScale) {
    if (this.object instanceof THREE.PerspectiveCamera) {
      this.scale *= dollyScale;
    } else if (this.object instanceof THREE.OrthographicCamera) {
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / dollyScale));
      this.object.updateProjectionMatrix();
      this.zoomChanged = true;
    } else {
      console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
      this.enableZoom = false;
    }
  }

  //
  // event callbacks - update the object state
  //

  private handleMouseDownRotate(event) {
    this.rotateStart.set(event.clientX, event.clientY);
  }

  private handleMouseDownDolly(event) {
    this.dollyStart.set(event.clientX, event.clientY);
  }

  private handleMouseDownPan(event) {
    this.panStart.set(event.clientX, event.clientY);
  }

  private handleMouseMoveRotate(event) {
    this.rotateEnd.set(event.clientX, event.clientY);
    this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

    const element = this.domElement;

    // rotating across whole screen goes 360 degrees around
    this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientWidth * this.rotateSpeed);

    // rotating up and down along whole screen attempts to go 360, but limited to 180
    this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed);

    this.rotateStart.copy(this.rotateEnd);
    this.update();
  }

  private handleMouseMoveDolly(event) {
    this.dollyEnd.set(event.clientX, event.clientY);
    this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

    if (this.dollyDelta.y > 0) {
      this.dollyIn(this.getZoomScale());
    } else if (this.dollyDelta.y < 0) {
      this.dollyOut(this.getZoomScale());
    }

    this.dollyStart.copy(this.dollyEnd);
    this.update();
  }

  private handleMouseMovePan(event) {
    this.panEnd.set(event.clientX, event.clientY);
    this.panDelta.subVectors(this.panEnd, this.panStart);
    this.pan(this.panDelta.x, this.panDelta.y);
    this.panStart.copy(this.panEnd);
    this.update();
  }

  private handleMouseUp(event) {  }

  private handleMouseWheel(event) {
    if (event.deltaY < 0) {
      this.dollyOut(this.getZoomScale());
    } else if (event.deltaY > 0) {
      this.dollyIn(this.getZoomScale());
    }
    this.update();
  }

  private handleKeyDown(event) {

    switch (event.keyCode) {
      case this.keys.UP:
        this.pan(0, this.keyPanSpeed);
        this.update();
        break;
      case this.keys.BOTTOM:
        this.pan(0, - this.keyPanSpeed);
        this.update();
        break;
      case this.keys.LEFT:
        this.pan(this.keyPanSpeed, 0);
        this.update();
        break;
      case this.keys.RIGHT:
        this.pan(- this.keyPanSpeed, 0);
        this.update();
        break;
    }
  }

  private handleTouchStartRotate(event) {
    this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
  }

  private handleTouchStartDolly(event) {
    const dx = event.touches[0].pageX - event.touches[1].pageX;
    const dy = event.touches[0].pageY - event.touches[1].pageY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.dollyStart.set(0, distance);
  }

  private handleTouchStartPan(event) {
    this.panStart.set(event.touches[0].pageX, event.touches[0].pageY);
  }

  private handleTouchMoveRotate(event) {
    this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
    this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

    const element = this.domElement;

    // rotating across whole screen goes 360 degrees around
    this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientWidth * this.rotateSpeed);

    // rotating up and down along whole screen attempts to go 360, but limited to 180
    this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed);

    this.rotateStart.copy(this.rotateEnd);
    this.update();
  }

  private handleTouchMoveDolly(event) {
    const dx = event.touches[0].pageX - event.touches[1].pageX;
    const dy = event.touches[0].pageY - event.touches[1].pageY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    this.dollyEnd.set(0, distance);
    this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

    if (this.dollyDelta.y > 0) {
      this.dollyOut(this.getZoomScale());
    } else if (this.dollyDelta.y < 0) {
      this.dollyIn(this.getZoomScale());
    }

    this.dollyStart.copy(this.dollyEnd);
    this.update();
  }

  private handleTouchMovePan(event) {
    this.panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
    this.panDelta.subVectors(this.panEnd, this.panStart);
    this.pan(this.panDelta.x, this.panDelta.y);
    this.panStart.copy(this.panEnd);
    this.update();
  }

  private handleTouchEnd(event) { }

  //
  // event handlers - FSM: listen for events and reset state
  //

  private onMouseDown = (event) => {
    if (this.enabled === false) { return; }
    event.preventDefault();

    if (event.button === this.mouseButtons.ORBIT) {
      if (this.enableRotate === false) { return; }
      this.handleMouseDownRotate(event);
      this.state = this.STATE.ROTATE;
    } else if (event.button === this.mouseButtons.ZOOM) {
      if (this.enableZoom === false) { return; }
      this.handleMouseDownDolly(event);
      this.state = this.STATE.DOLLY;
    } else if (event.button === this.mouseButtons.PAN) {
      if (this.enablePan === false) { return; }
      this.handleMouseDownPan(event);
      this.state = this.STATE.PAN;
    }

    if (this.state !== this.STATE.NONE) {
      document.addEventListener('mousemove', this.onMouseMove, false);
      document.addEventListener('mouseup', this.onMouseUp, false);
      this.dispatchEvent(this.startEvent);
    }
  }

  private onMouseMove = (event) => {
    if (this.enabled === false) { return; }
    event.preventDefault();

    if (this.state === this.STATE.ROTATE) {
      if (this.enableRotate === false) { return; }
      this.handleMouseMoveRotate(event);
    } else if (this.state === this.STATE.DOLLY) {
      if (this.enableZoom === false) { return; }
      this.handleMouseMoveDolly(event);
    } else if (this.state === this.STATE.PAN) {
      if (this.enablePan === false) { return; }
      this.handleMouseMovePan(event);
    }
  }

  private onMouseUp = (event) => {
    if (this.enabled === false) { return; }
    this.handleMouseUp(event);

    document.removeEventListener('mousemove', this.onMouseMove, false);
    document.removeEventListener('mouseup', this.onMouseUp, false);

    this.dispatchEvent(this.endEvent);
    this.state = this.STATE.NONE;
  }

  private onMouseWheel = (event) => {
    if (this.enabled === false || this.enableZoom === false ||
        (this.state !== this.STATE.NONE && this.state !== this.STATE.ROTATE)) { return; }

    event.preventDefault();
    event.stopPropagation();

    this.handleMouseWheel(event);

    this.dispatchEvent(this.startEvent); // not sure why these are here...
    this.dispatchEvent(this.endEvent);
  }

  private onKeyDown = (event) => {
    if (this.enabled === false || this.enableKeys === false || this.enablePan === false) { return; }
    this.handleKeyDown(event);
  }

  private onTouchStart = (event) => {
    if (this.enabled === false) { return;  }

    switch (event.touches.length) {
      case 1:	// one-fingered touch: rotate
        if (this.enableRotate === false) { return;  }
        this.handleTouchStartRotate(event);
        this.state = this.STATE.TOUCH_ROTATE;
        break;
      case 2:	// two-fingered touch: dolly
        if (this.enableZoom === false) { return;  }
        this.handleTouchStartDolly(event);
        this.state = this.STATE.TOUCH_DOLLY;
        break;
      case 3: // three-fingered touch: pan
        if (this.enablePan === false) { return;  }
        this.handleTouchStartPan(event);
        this.state = this.STATE.TOUCH_PAN;
        break;
      default:
        this.state = this.STATE.NONE;
    }

    if (this.state !== this.STATE.NONE) {
      this.dispatchEvent(this.startEvent);
    }
  }

  private onTouchMove = (event) => {

    if (this.enabled === false) { return; };

    event.preventDefault();
    event.stopPropagation();

    switch (event.touches.length) {
      case 1: // one-fingered touch: rotate
        if (this.enableRotate === false) { return; }
        if (this.state !== this.STATE.TOUCH_ROTATE) { return; } // is this needed?...
        this.handleTouchMoveRotate(event);
        break;
      case 2: // two-fingered touch: dolly
        if (this.enableZoom === false) { return; }
        if (this.state !== this.STATE.TOUCH_DOLLY) { return; } // is this needed?...
        this.handleTouchMoveDolly(event);
        break;
      case 3: // three-fingered touch: pan
        if (this.enablePan === false) { return; }
        if (this.state !== this.STATE.TOUCH_PAN) { return; } // is this needed?...
        this.handleTouchMovePan(event);
        break;
      default:
        this.state = this.STATE.NONE;
    }
  }

  private onTouchEnd = (event) => {
    if (this.enabled === false) { return; };
    this.handleTouchEnd(event);
    this.dispatchEvent(this.endEvent);
    this.state = this.STATE.NONE;
  }

  private onContextMenu = (event) => {
    event.preventDefault();
  }
}
