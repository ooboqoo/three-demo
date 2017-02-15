import { Component, ElementRef, Input, ViewChild, AfterViewInit } from '@angular/core';
import {
  Scene, PerspectiveCamera, WebGLRenderer, AxisHelper, CameraHelper,
  Mesh, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry, BoxGeometry, SphereGeometry,
  SpotLight,
} from 'three';

@Component({
  selector: 'app-c1',
  template: `
    <canvas #canvas></canvas>
  `
})
export class C1Component implements AfterViewInit {
  @ViewChild('canvas') private canvasRef: ElementRef;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private scene: Scene;
  private axes: AxisHelper;
  private plane: Mesh;
  private cube: Mesh;
  private sphere: Mesh;
  private camera: PerspectiveCamera;
  private spotLight: SpotLight;
  private renderer: WebGLRenderer;

  private step = 0;

  private init() {
    this.scene = new Scene();

    this.camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
    Object.assign(this.camera.position, { x: -30, y: 40, z: 30 });
    this.camera.lookAt(this.scene.position);

    this.renderer = new WebGLRenderer({ canvas: this.canvas });
    this.renderer.setClearColor(0xeeeeee);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMapEnabled = true;

    this.axes = new AxisHelper(20);
    this.scene.add(this.axes);

    this.plane = new Mesh(
      new PlaneGeometry(60, 20, 1, 1),
      new MeshLambertMaterial({ color: 0xcccccc })
    );
    this.plane.rotation.x = -0.5 * Math.PI;
    Object.assign(this.plane.position, { x: 10, y: 0, z: 0 });
    this.plane.receiveShadow = true;
    this.scene.add(this.plane);

    this.cube = new Mesh(
      new BoxGeometry(5, 5, 5),
      new MeshLambertMaterial({ color: 0xff0000, wireframe: false })
    );
    Object.assign(this.cube.position, { x: -8, y: 3, z: 0 });
    this.cube.castShadow = true;
    this.scene.add(this.cube);

    this.sphere = new Mesh(
      new SphereGeometry(4, 20, 20),
      new MeshLambertMaterial({ color: 0x4444ff, wireframe: false })
    );
    Object.assign(this.sphere.position, { x: 15, y: 4, z: 2 });
    this.sphere.castShadow = true;
    this.scene.add(this.sphere);

    this.spotLight = new SpotLight( 0xffffff );
    this.spotLight.position.set( -40, 60, -20 );
    this.spotLight.castShadow = true;
    this.scene.add( this.spotLight );
  }

  private animateGeometry() {
    this.cube.rotation.x += 0.02;
    this.cube.rotation.y += 0.02;
    this.cube.rotation.z += 0.02;

    this.step += 0.04;
    this.sphere.position.x = 15 + ( 10 * (Math.cos(this.step)));
    this.sphere.position.y = 2 + ( 10 * Math.abs(Math.sin(this.step)));
  }

  private renderSence = () => {               // binding `this`
    requestAnimationFrame(this.renderSence);  // simply regard it as setTimeout()
    this.animateGeometry();
    this.renderer.render(this.scene, this.camera);
  }

  ngAfterViewInit() {
    this.init();
    this.renderSence();
  }
}
