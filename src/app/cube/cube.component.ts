import { Component, ElementRef, Input, ViewChild, AfterViewInit } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-cube',
  templateUrl: './cube.component.html',
})
export class CubeComponent implements AfterViewInit {
  @ViewChild('canvas') private canvasRef: ElementRef;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private cube: THREE.Mesh;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  /* CUBE PROPERTIES */
  @Input() public rotationSpeedX = 0.005;
  @Input() public rotationSpeedY = 0.01;
  @Input() public size = 200;

  /* STAGE PROPERTIES */
  @Input() public cameraZ = 600;

  private init() {
    const geometry = new THREE.BoxGeometry( this.size, this.size, this.size );
    const material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
    this.cube = new THREE.Mesh( geometry, material );

    this.scene = new THREE.Scene();
    this.scene.add( this.cube );

    this.camera = new THREE.PerspectiveCamera( 75, 1, 100, 1000 );
    this.camera.position.z = this.cameraZ;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
  }

  private animateCube() {
    this.cube.rotation.x += this.rotationSpeedX;
    this.cube.rotation.y += this.rotationSpeedY;
  }

  private startRenderingLoop() {
    const component: CubeComponent = this;
    (function render() {
      requestAnimationFrame(render);
      component.animateCube();
      component.renderer.render(component.scene, component.camera);
    })();
  }

  ngAfterViewInit() {
    this.init();
    this.startRenderingLoop();
  }
}
