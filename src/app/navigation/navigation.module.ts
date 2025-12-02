import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

import { NavbarComponent } from './navbar/navbar.component';
import { DefaultContentComponent } from './default-content.component';

@NgModule({
  declarations: [
    NavbarComponent,
    DefaultContentComponent // ← SE MANTIENE aquí
  ],
  imports: [
    CommonModule,
    RouterModule,
    
    // PrimeNG Modules
    CardModule,
    ButtonModule,
    TagModule,
    DividerModule
  ],
  exports: [
    NavbarComponent,
    DefaultContentComponent // ← Exporta si es necesario
  ]
})
export class NavigationModule { }