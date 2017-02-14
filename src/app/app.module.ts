import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { CubeComponent } from './cube/cube.component';
import { C1Component } from './charpter1/c1.component';

const appRoutes: Routes = [
  { path: '', redirectTo: 'cube', pathMatch: 'full' },
  { path: 'cube', component: CubeComponent },
  { path: 'c1', component: C1Component },
];

@NgModule({
  declarations: [
    AppComponent,
    CubeComponent,
    C1Component,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
