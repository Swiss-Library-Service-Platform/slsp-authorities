import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
	AlertService,
	CloudAppEventsService,
	Entity,
} from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { catchError, EMPTY, finalize, firstValueFrom, Observable } from 'rxjs';
import { LoadingIndicatorService } from './loading-indicator.service';
import { Bib } from '../models/bib-records';
import { environment } from '../environments/environment';
@Injectable({
	providedIn: 'root',
})
export class ProxyService {
	public loader = inject(LoadingIndicatorService);
	private alert = inject(AlertService);
	private translate = inject(TranslateService);
	private eventsService = inject(CloudAppEventsService);
	private http = inject(HttpClient);

	private httpOptions!: object;
	private baseUrl = environment.proxyUrl;

	public constructor() {
		this.initialize();
	}

	public async initialize(): Promise<void> {
		// Get environment and JWT token
		const initData = await firstValueFrom(this.eventsService.getInitData());
		const authToken = await firstValueFrom(this.eventsService.getAuthToken());
		// Determine if production environment
		const regExp = new RegExp('^https(.*)psb(.*)com/?$|.*localhost.*');
		const isProdEnvironment = !regExp.test(initData.urls.alma);

		// Build HTTP Options
		this.httpOptions = {
			params: { isProdEnvironment },
			headers: new HttpHeaders({
				Authorization: `Bearer ${authToken}`,
				'Content-Type': 'application/json',
			}),
		};
	}

	// get the bib record from the NZ
	public getBibRecord(entity: Entity): Observable<Bib> {
		try {
			// First verify access
			if (!this.checkUserRoles() || !this.isInstitutionAllowed()) {
				throw new Error('Access denied');
			}

			// Then make NZ API call
			const response = this.http
				.get<Bib>(
					`${this.baseUrl}/p/api-eu.hosted.exlibrisgroup.com/almaws/v1/bibs/${entity.id}`,
					this.httpOptions,
				)
				.pipe(
					catchError((error) => {
						const errorMsg = (error as Error).message;

						this.alert.error(
							this.translate.instant('error.restApiError', [errorMsg]),
							{
								autoClose: false,
							},
						);

						return EMPTY;
					}),
					finalize(() => {
						this.loader.hide();
					}),
				);

			return response;
		} catch (error) {
			console.error('Failed to get bib record:', error);
			throw error;
		}
	}

    //ask the proxy if the IZ is allowed to use the cloud-app
	private async isInstitutionAllowed(): Promise<boolean> {
		try {
			const response = await firstValueFrom(
				this.http.get(`${this.baseUrl}/isallowed`, this.httpOptions),
			);

			return !!response;
		} catch (error) {
			console.error('Institution check failed:', error);

			return false;
		}
	}
    //ask the proxy if the user have the right role to use the cloud-app
	private async checkUserRoles(): Promise<boolean> {
		try {
			const response = await firstValueFrom(
				this.http.get<{ hasRequiredRoles: boolean }>(
					`${this.baseUrl}/check-user-roles`,
					this.httpOptions,
				),
			);

			return response?.hasRequiredRoles || false;
		} catch (error) {
			console.error('Role check failed:', error);

			return false;
		}
	}
}
