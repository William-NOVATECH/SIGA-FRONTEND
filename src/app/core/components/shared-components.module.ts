import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTableComponent } from './data-table/data-table.component';

@NgModule({
  declarations: [
    DataTableComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    DataTableComponent
  ]
})
export class SharedComponentsModule { }

