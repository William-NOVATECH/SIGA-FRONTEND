import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { MessageService } from 'primeng/api';
import { JwtInterceptor } from './core/Interceptors/jwt.interceptor';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { DepartamentosComponent } from './features/departamentos/departamentos.component';
import { NavigationModule } from './navigation/navigation.module';

// REMOVED: DefaultContentComponent from declarations

@NgModule({
  declarations: [
    AppComponent,
    AdminLayoutComponent,
    DepartamentosComponent
    // DefaultContentComponent ← ELIMINADO de aquí
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    NavigationModule
  ],
  providers: [
    MessageService,
    { 
      provide: HTTP_INTERCEPTORS, 
      useClass: JwtInterceptor, 
      multi: true 
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }