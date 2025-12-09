// default-content.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-default-content',
  standalone:false,
  template: `
    <div class="central-image-container">
      <img src="../../../../assets/images/managua.jpg" 
           alt="UNAM - Universidad del Pueblo y para el Pueblo" 
           class="central-image" />
    </div>
  `,
  styles: [`
  .central-image-container{
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
  }
  .central-image{
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  `]
})
export class DefaultContentComponent {}