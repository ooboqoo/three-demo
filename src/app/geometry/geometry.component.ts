import { Component, ElementRef, Input, ViewChild, AfterViewInit } from '@angular/core';
import {
  Vector3,
  Scene, PerspectiveCamera, WebGLRenderer,
  Mesh, MeshBasicMaterial, BoxGeometry, SphereGeometry
} from 'three';

@Component({
  selector: 'app-geometry',
  template: `
    <canvas #cube width="500" height="500"></canvas>
    <canvas #sphere width="500" height="500"></canvas>
  `
})
export class GeometryComponent implements AfterViewInit {
  @ViewChild('cube') private cubeRef: ElementRef;
  @ViewChild('sphere') private sphereRef: ElementRef;

  private cube: Mesh;
  private cubeScene: Scene;
  private cubeCamera: PerspectiveCamera;
  private cubeRenderer: WebGLRenderer;

  private sphere: Mesh;
  private sphereScene: Scene;
  private sphereCamera: PerspectiveCamera;
  private sphereRenderer: WebGLRenderer;

  private initCube() {
    this.cubeScene = new Scene();
    this.cube = new Mesh(
      new BoxGeometry( 200, 200, 200 ),
      new MeshBasicMaterial( { color: 0xff0000, wireframe: true } )
    );
    this.cubeScene.add( this.cube );

    this.cubeCamera = new PerspectiveCamera( 75, 1, 100, 1000 );
    this.cubeCamera.position.z = 600;

    this.cubeRenderer = new WebGLRenderer({ canvas: this.cubeRef.nativeElement });
  }

  private initSphere() {
    this.sphereScene = new Scene();
    this.sphere = new Mesh(
      new SphereGeometry(20, 15, 10, Math.PI / 2, Math.PI, Math.PI / 6, Math.PI / 2),
      new MeshBasicMaterial( { color: 0xff0000, wireframe: true } )
    );
    this.sphereScene.add( this.sphere );

    this.sphereCamera = new PerspectiveCamera( 75, 1, 1, 1000 );
    Object.assign(this.sphereCamera.position, { x: -10, y: 20, z: 60 });
    this.sphereCamera.lookAt(new Vector3( 0, 0, 0));

    this.sphereRenderer = new WebGLRenderer({ canvas: this.sphereRef.nativeElement });
  }

  private animateCube() {
    this.cube.rotation.x += 0.005;
    this.cube.rotation.y += 0.01;
  }

  private startRenderingLoop = () => {
      requestAnimationFrame(this.startRenderingLoop);
      this.animateCube();
      this.cubeRenderer.render(this.cubeScene, this.cubeCamera);
      this.sphereRenderer.render(this.sphereScene, this.sphereCamera);
  }

  ngAfterViewInit() {
    this.initCube();
    this.initSphere();
    this.startRenderingLoop();
  }
}
