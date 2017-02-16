import { Component, ElementRef, Input, ViewChild, AfterViewInit } from '@angular/core';
import {
  Scene, PerspectiveCamera, WebGLRenderer, AxisHelper, SpotLight, Object3D,
  Mesh, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry, BoxGeometry, SphereGeometry,
  DoubleSide,
} from 'three';
import { OBJLoader } from '../three-plugin/OBJLoader';
import { OrbitControls } from '../three-plugin/OrbitControls';


@Component({
  selector: 'app-robot',
  template: `
    <canvas #canvas></canvas>
  `
})
export class RobotComponent implements AfterViewInit {
  @ViewChild('canvas') private canvasRef: ElementRef;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private scene: Scene;
  private axes: AxisHelper;
  private plane: Mesh;
  private base: Object3D;
  private arm1: Object3D;
  private arm2: Object3D;
  private zaxis: Object3D;
  private camera: PerspectiveCamera;
  private spotLight: SpotLight;
  private renderer: WebGLRenderer;
  private loader: OBJLoader;
  private controls: OrbitControls;

  private step = 0;

  private init() {
    this.loader = new OBJLoader();
    this.scene = new Scene();

    this.camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
    Object.assign(this.camera.position, { x: -40, y: 30, z: -20 });
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
    Object.assign(this.plane.position, { x: 10, y: -10, z: 0 });
    this.plane.receiveShadow = true;
    this.scene.add(this.plane);

    this.loader.load('assets/robot/base.obj', obj => {
      obj.traverse(function(child) {
        if (child instanceof Mesh) { child.material.side = DoubleSide; }
      });
      obj.rotation.x = Math.PI * -0.5;
      Object.assign(obj.position, { x: -2.8, y: -10, z: 6 });
      this.scene.add(obj);
      this.base = obj;
    });

    this.loader.load('assets/robot/arm_1.obj', obj => {
      obj.traverse(function(child) {
        if (child instanceof Mesh) { child.material.side = DoubleSide; }
      });
      obj.rotation.x = Math.PI * -0.5;
      Object.assign(obj.position, { x: -2.8, y: -10, z: 6 });
      this.scene.add(obj);
      this.arm1 = obj;
    });

    this.loader.load('assets/robot/arm_2.obj', obj => {
      obj.traverse(function(child) {
        if (child instanceof Mesh) { child.material.side = DoubleSide; }
      });
      obj.rotation.x = Math.PI * -0.5;
      Object.assign(obj.position, { x: -2.8, y: -10, z: 6 });
      this.scene.add(obj);
      this.arm2 = obj;
    });

    this.loader.load('assets/robot/z_axis.obj', obj => {
      obj.traverse(function(child) {
        if (child instanceof Mesh) { child.material.side = DoubleSide; }
      });
      obj.rotation.x = Math.PI * -0.5;
      Object.assign(obj.position, { x: -2.8, y: -10, z: 6 });
      this.scene.add(obj);
      this.zaxis = obj;
    });

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableKeys = false;

    this.spotLight = new SpotLight( 0xffffff );
    this.spotLight.position.set( -40, 60, -20 );
    this.spotLight.castShadow = true;
    this.scene.add( this.spotLight );
  }


  private renderSence = () => {
    requestAnimationFrame(this.renderSence);
    this.renderer.render(this.scene, this.camera);
  }

  ngAfterViewInit() {
    this.init();
    this.renderSence();
  }
}
