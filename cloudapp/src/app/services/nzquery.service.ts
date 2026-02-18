import { inject, Injectable } from '@angular/core';
import {
	AlertService,
	CloudAppRestService,
	CloudAppSettingsService,
	Entity,
	HttpMethod,
} from '@exlibris/exl-cloudapp-angular-lib';
import { Observable, switchMap, catchError, EMPTY, finalize, of, throwError } from 'rxjs';
import { NzBibRecord, DataField, BibRecordField } from '../models/bib-records';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationService } from './authentication.service';
import { LoadingIndicatorService } from './loading-indicator.service';
import { HttpClient } from '@angular/common/http';
import { RecordService } from './record.service';
import { StringUtils } from '../utils/stringUtils';
import { Settings } from '../models/setting';

@Injectable({
	providedIn: 'root',
})
export class NZQueryService {
	//Services
	private loader = inject(LoadingIndicatorService);
	private alert = inject(AlertService);
	private translate = inject(TranslateService);
	private authenticationService = inject(AuthenticationService);
	private restService = inject(CloudAppRestService);
	private http = inject(HttpClient);
	private recordService = inject(RecordService);
	private settingsService = inject(CloudAppSettingsService);
	private proxyUrl: string | undefined;

	public constructor() {
		this.settingsService.get().subscribe((settings) => {
			this.proxyUrl = (settings as Settings).proxyUrl;
		});
	}

	// ---------------------------
	// 📚 Appel NZ : Bib record
	// ---------------------------

	/** Récupère la notice bib de la NZ pour l'entité sélectionnée */
	public getBibRecord(entity: Entity): Observable<NzBibRecord> {
		this.loader.show();

		return this.authenticationService.ensureAccess$().pipe(
			switchMap(() => this.getNzMmsIdFromEntity(entity)),
			switchMap((nzMmsId) =>
				this.http.get<NzBibRecord>(
					`${this.proxyUrl}/p/api-eu.hosted.exlibrisgroup.com/almaws/v1/bibs/${nzMmsId}`,
					this.authenticationService.getHttpOptions()
				)
			),
			catchError((error) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const errorMsg = (error as any)?.message || (error as any)?.statusText || 'Unknown error';

				this.alert.error(this.translate.instant('error.restApiError', [errorMsg]), {
					autoClose: false,
				});

				return EMPTY;
			}),
			finalize(() => this.loader.hide())
		);
	}

	/**
	 * Met à jour un champ uniquement si il existe.
	 * Renvoie une erreur si le champ n'est pas trouvé.
	 */
	public updateFieldIfExists(
		selectedEntry: BibRecordField,
		updatedDataField: DataField
	): Observable<NzBibRecord> {
		return this.authenticationService.ensureAccess$().pipe(
			switchMap(() => {
				const entity = this.recordService.selectedEntity();

				if (!entity) {
					this.alert.error(this.translate.instant('error.noSelectedEntry'));

					return throwError(() => new Error('Aucune entité sélectionnée.'));
				}

				return this.getNzMmsIdFromEntity(entity);
			}),
			switchMap((nzMmsId) =>
				this.http
					.get<NzBibRecord>(this.buildBibUrl(nzMmsId), this.authenticationService.getHttpOptions())
					.pipe(
						switchMap((bib) => {
							const marcRecord = StringUtils.xmlToMarcRecord(bib.anies[0]);
							const index = marcRecord.dataFields.findIndex((field) =>
								StringUtils.areDataFieldsEqual(field, selectedEntry)
							);

							if (index === -1) {
								return throwError(() => new Error('FIELD_NOT_FOUND'));
							}

							marcRecord.dataFields[index] = updatedDataField;

							const updatedMarcXml = StringUtils.marcRecordToXml(marcRecord);

							return this.http.put<NzBibRecord>(
								this.buildBibUrl(nzMmsId),
								`<bib>${updatedMarcXml}</bib>`,
								this.authenticationService.getXmlHttpOptions()
							);
						})
					)
			),
			catchError((error) => {
				const errorMsg = error?.message || error?.statusText || 'Unknown error';

				// Propagate our specific control errors so callers can react
				if (error?.message === 'FIELD_NOT_FOUND' || error?.message === 'FIELD_ALREADY_EXISTS') {
					return throwError(() => error);
				}

				this.alert.error(this.translate.instant('error.restApiError', [errorMsg]), {
					autoClose: false,
				});

				return EMPTY;
			})
		);
	}

	/**
	 * Crée un champ uniquement si il n'existe pas encore.
	 * Renvoie une erreur si le champ existe déjà.
	 */
	public createFieldIfNotExists(
		updatedDataField: DataField
	): Observable<NzBibRecord> {
		return this.authenticationService.ensureAccess$().pipe(
			switchMap(() => {
				const entity = this.recordService.selectedEntity();

				if (!entity) {
					this.alert.error(this.translate.instant('error.noSelectedEntry'));

					return throwError(() => new Error('Aucune entité sélectionnée.'));
				}

				return this.getNzMmsIdFromEntity(entity);
			}),
			switchMap((nzMmsId) =>
				this.http
					.get<NzBibRecord>(this.buildBibUrl(nzMmsId), this.authenticationService.getHttpOptions())
					.pipe(
						switchMap((bib) => {
							// Always add the new DataField, even if a similar one already exists
							const marcRecord = StringUtils.xmlToMarcRecord(bib.anies[0]);

							marcRecord.dataFields.push(updatedDataField);

							const updatedMarcXml = StringUtils.marcRecordToXml(marcRecord);

							return this.http.put<NzBibRecord>(
								this.buildBibUrl(nzMmsId),
								`<bib>${updatedMarcXml}</bib>`,
								this.authenticationService.getXmlHttpOptions()
							);
						})
					)
			),
			catchError((error) => {
				const errorMsg = error?.message || error?.statusText || 'Unknown error';

				this.alert.error(this.translate.instant('error.restApiError', [errorMsg]), {
					autoClose: false,
				});

				return EMPTY;
			})
		);
	}

	public deleteBibRecord(selectedEntry: BibRecordField): Observable<NzBibRecord> {
		return this.authenticationService.ensureAccess$().pipe(
			// 1. Récupérer l'ID Alma (nzMmsId) depuis l'entité
			switchMap(() => {
				const entity = this.recordService.selectedEntity();

				if (!entity) {
					return throwError(() => new Error('Aucune entité sélectionnée.'));
				}

				return this.getNzMmsIdFromEntity(entity);
			}),

			// 2. Récupérer le Bib le plus à jour
			switchMap((nzMmsId) =>
				this.http
					.get<NzBibRecord>(this.buildBibUrl(nzMmsId), this.authenticationService.getHttpOptions())
					.pipe(
						// 3. Mettre à jour le Bib et faire le PUT
						switchMap((bib) => {
							const updatedMarcXml = this.buildDeletedMarcXml(bib, selectedEntry);

							return this.http.put<NzBibRecord>(
								this.buildBibUrl(nzMmsId),
								`<bib>${updatedMarcXml}</bib>`,
								this.authenticationService.getXmlHttpOptions()
							);
						})
					)
			),

			// 4. Gestion d’erreur globale
			catchError((error) => {
				const errorMsg = error?.message || error?.statusText || 'Unknown error';

				this.alert.error(this.translate.instant('error.restApiError', [errorMsg]), {
					autoClose: false,
				});

				return EMPTY;
			})
		);
	}

	public refreshSelectedEntityDetails(): void {
		const entity = this.recordService.selectedEntity();

		if (!entity) {
			return;
		}

		this.getBibRecord(entity).subscribe({
			next: (bib) => this.recordService.selectedEntityDetails.set(bib),
			error: (err) => {
				console.error('Erreur refreshSelectedEntityDetails', err);
			},
		});
	}

	/**
	 * Construit l'URL d'accès à un Bib via son nzMmsId.
	 */
	private buildBibUrl(nzMmsId: string): string {
		return `${this.proxyUrl}/p/api-eu.hosted.exlibrisgroup.com/almaws/v1/bibs/${nzMmsId}`;
	}

	/**
	 * À partir d'un Bib existant, met à jour/ajoute le DataField
	 * et renvoie le MARC XML prêt à être envoyé.
	 */
	private buildUpdatedMarcXml(
		bib: NzBibRecord,
		selectedEntry: BibRecordField,
		updatedDataField: DataField
	): string {
		const marcRecord = StringUtils.xmlToMarcRecord(bib.anies[0]);
		const index = marcRecord.dataFields.findIndex((field) =>
			StringUtils.areDataFieldsEqual(field, selectedEntry)
		);

		if (index !== -1) {
			// Mise à jour
			marcRecord.dataFields[index] = updatedDataField;
		} else {
			// Ajout si non trouvé
			marcRecord.dataFields.push(updatedDataField);
		}

		return StringUtils.marcRecordToXml(marcRecord);
	}

	private buildDeletedMarcXml(bib: NzBibRecord, selectedEntry: BibRecordField): string {
		const marcRecord = StringUtils.xmlToMarcRecord(bib.anies[0]);
		// Trouver l'index du champ à supprimer
		const index = marcRecord.dataFields.findIndex((field) =>
			StringUtils.areDataFieldsEqual(field, selectedEntry)
		);

		if (index !== -1) {
			// Suppression du DataField correspondant
			marcRecord.dataFields.splice(index, 1);
		}

		return StringUtils.marcRecordToXml(marcRecord);
	}

	/**
	 * Retrieves the NZ MMS ID from the given entity.
	 */
	private getNzMmsIdFromEntity(entity: Entity): Observable<string> {
		const id = entity.id;

		if (entity.link.indexOf('?nz_mms_id') >= 0) {
			return of(id);
		}

		return this.restService
			.call({
				method: HttpMethod.GET,
				url: entity.link,
				queryParams: { view: 'brief' },
			})
			.pipe(
				switchMap((response) => {
					const nzMmsId: string = response?.linked_record_id?.value;

					if (!nzMmsId) throw new Error('No NZ MMSID found in linked record');

					return of(nzMmsId);
				}),
				catchError(() => of(entity.id))
			);
	}
}
