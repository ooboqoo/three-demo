import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { GeometryComponent } from './geometry/geometry.component';
import { C1Component } from './charpter1/c1.component';

const appRoutes: Routes = [
  { path: '', redirectTo: 'geo', pathMatch: 'full' },
  { path: 'geo', component: GeometryComponent },
  { path: 'c1', component: C1Component },
];

@NgModule({
  declarations: [
    AppComponent,
    GeometryComponent,
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
