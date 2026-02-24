/* eslint-disable @typescript-eslint/no-explicit-any */

// main.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { MainFacadeService } from './main-facade.service';
import { LoadingIndicatorService } from '../services/loading-indicator.service';

@Component({
	selector: 'app-main',
	templateUrl: './main.component.html',
})
export class MainComponent implements OnInit {
	public loader = inject(LoadingIndicatorService);
	public facade = inject(MainFacadeService);

	public ngOnInit(): void {
		this.facade.init();
	}


	public openIdref(event: MouseEvent): void {
		event.preventDefault(); // Empêche la navigation interceptée par l'host
		window.location.assign('https://www.idref.fr/');
	}

	public reset(): void {
		this.facade.reset();
	}
}
