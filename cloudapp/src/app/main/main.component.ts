/* eslint-disable @typescript-eslint/no-explicit-any */

// main.component.ts
import { Component, inject, OnInit } from '@angular/core';
import {
  Entity,

} from '@exlibris/exl-cloudapp-angular-lib';
import { MainFacadeService } from '../services/main-facade.service';
import { LoadingIndicatorService } from '../services/loading-indicator.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {

  public loader = inject(LoadingIndicatorService);
  public facade = inject(MainFacadeService);

  public ngOnInit():void {
    this.facade.init();
  }

  public onSelectEntity(entity: Entity):void {
    this.facade.selectEntity(entity);
  }
  
  public reset(): void {
    this.facade.reset();
  }

}
