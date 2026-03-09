import { inject, Injectable } from '@angular/core';
import {
	CloudAppRestService,
	Entity,
	HttpMethod,
} from '@exlibris/exl-cloudapp-angular-lib';
import { Observable, switchMap, catchError, of, throwError, take, tap, EMPTY } from 'rxjs';
import { NzBibRecord, DataField, BibRecordField } from '../models/bib-record.model';
import { AuthenticationService } from './authentication.service';
import { HttpClient } from '@angular/common/http';
import { SelectedEntityStateService } from './selected-entity-state.service';
import { StringUtils } from '../utils/string-utils';
import { InitService } from './init.service';

@Injectable({
	providedIn: 'root',
})
export class NzBibRecordService {
	private authenticationService = inject(AuthenticationService);
	private restService = inject(CloudAppRestService);
	private http = inject(HttpClient);
	private selectedEntityState = inject(SelectedEntityStateService);
	private initService = inject(InitService);
	private proxyUrl: string | undefined;

	public constructor() {
		this.initService.getConfig$().pipe(take(1)).subscribe((config) => {
			this.proxyUrl = config.proxyUrl;
		});
	}

	public getBibRecord(entity: Entity): Observable<NzBibRecord> {
		return this.authenticationService.ensureAccess$().pipe(
			switchMap(() => this.getNzMmsIdFromEntity(entity)),
			switchMap((nzMmsId) =>
				this.http.get<NzBibRecord>(
					this.buildBibUrl(nzMmsId),
					this.authenticationService.getHttpOptions()
				)
			)
		);
	}

	public updateFieldIfExists(
		selectedEntry: BibRecordField,
		updatedDataField: DataField
	): Observable<NzBibRecord> {
		return this.authenticationService.ensureAccess$().pipe(
			switchMap(() => {
				const entity = this.selectedEntityState.selectedEntity();

				if (!entity) {
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
			)
		);
	}

	public createFieldIfNotExists(updatedDataField: DataField): Observable<NzBibRecord> {
		return this.authenticationService.ensureAccess$().pipe(
			switchMap(() => {
				const entity = this.selectedEntityState.selectedEntity();

				if (!entity) {
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

							marcRecord.dataFields.push(updatedDataField);

							const updatedMarcXml = StringUtils.marcRecordToXml(marcRecord);

							return this.http.put<NzBibRecord>(
								this.buildBibUrl(nzMmsId),
								`<bib>${updatedMarcXml}</bib>`,
								this.authenticationService.getXmlHttpOptions()
							);
						})
					)
			)
		);
	}

	/**
	 * In a single GET→modify→PUT cycle:
	 * 1. Find originalFieldRef in the record and replace it with originalFieldUpdated (e.g. with $$6 added)
	 * 2. Append newField (e.g. the 880 field) to the record
	 */
	public createFieldWithLinkedModification(
		originalFieldRef: BibRecordField,
		originalFieldUpdated: DataField,
		newField: DataField
	): Observable<NzBibRecord> {
		return this.authenticationService.ensureAccess$().pipe(
			switchMap(() => {
				const entity = this.selectedEntityState.selectedEntity();

				if (!entity) {
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
								StringUtils.areDataFieldsEqual(field, originalFieldRef)
							);

							if (index === -1) {
								return throwError(() => new Error('FIELD_NOT_FOUND'));
							}

							marcRecord.dataFields[index] = originalFieldUpdated;
							marcRecord.dataFields.push(newField);

							const updatedMarcXml = StringUtils.marcRecordToXml(marcRecord);

							return this.http.put<NzBibRecord>(
								this.buildBibUrl(nzMmsId),
								`<bib>${updatedMarcXml}</bib>`,
								this.authenticationService.getXmlHttpOptions()
							);
						})
					)
			)
		);
	}

	/**
	 * Delete multiple fields and optionally modify a linked field in one PUT.
	 * Used for $$6 cascade: delete 880 + clean up $$6 in original, or delete original + all linked 880s.
	 */
	public deleteBibRecordWithCascade(
		fieldsToDelete: BibRecordField[],
		fieldToModify?: { original: BibRecordField; replacement: DataField }
	): Observable<NzBibRecord> {
		return this.authenticationService.ensureAccess$().pipe(
			switchMap(() => {
				const entity = this.selectedEntityState.selectedEntity();

				if (!entity) {
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

							for (const toDelete of fieldsToDelete) {
								const idx = marcRecord.dataFields.findIndex((field) =>
									StringUtils.areDataFieldsEqual(field, toDelete)
								);

								if (idx !== -1) {
									marcRecord.dataFields.splice(idx, 1);
								}
							}

							if (fieldToModify) {
								const modIdx = marcRecord.dataFields.findIndex((field) =>
									StringUtils.areDataFieldsEqual(field, fieldToModify.original)
								);

								if (modIdx !== -1) {
									marcRecord.dataFields[modIdx] = fieldToModify.replacement;
								}
							}

							const updatedMarcXml = StringUtils.marcRecordToXml(marcRecord);

							return this.http.put<NzBibRecord>(
								this.buildBibUrl(nzMmsId),
								`<bib>${updatedMarcXml}</bib>`,
								this.authenticationService.getXmlHttpOptions()
							);
						})
					)
			)
		);
	}

	public deleteBibRecord(selectedEntry: BibRecordField): Observable<NzBibRecord> {
		return this.authenticationService.ensureAccess$().pipe(
			switchMap(() => {
				const entity = this.selectedEntityState.selectedEntity();

				if (!entity) {
					return throwError(() => new Error('Aucune entité sélectionnée.'));
				}

				return this.getNzMmsIdFromEntity(entity);
			}),
			switchMap((nzMmsId) =>
				this.http
					.get<NzBibRecord>(this.buildBibUrl(nzMmsId), this.authenticationService.getHttpOptions())
					.pipe(
						switchMap((bib) => {
							const updatedMarcXml = this.buildDeletedMarcXml(bib, selectedEntry);

							return this.http.put<NzBibRecord>(
								this.buildBibUrl(nzMmsId),
								`<bib>${updatedMarcXml}</bib>`,
								this.authenticationService.getXmlHttpOptions()
							);
						})
					)
			)
		);
	}

	public refreshSelectedEntityDetails$(): Observable<NzBibRecord> {
		const entity = this.selectedEntityState.selectedEntity();

		if (!entity) {
			return EMPTY;
		}

		return this.getBibRecord(entity).pipe(
			tap((bib) => this.selectedEntityState.selectedEntityDetails.set(bib))
		);
	}

	private buildBibUrl(nzMmsId: string): string {
		return `${this.proxyUrl}/p/api-eu.hosted.exlibrisgroup.com/almaws/v1/bibs/${nzMmsId}`;
	}

	private buildDeletedMarcXml(bib: NzBibRecord, selectedEntry: BibRecordField): string {
		const marcRecord = StringUtils.xmlToMarcRecord(bib.anies[0]);
		const index = marcRecord.dataFields.findIndex((field) =>
			StringUtils.areDataFieldsEqual(field, selectedEntry)
		);

		if (index !== -1) {
			marcRecord.dataFields.splice(index, 1);
		}

		return StringUtils.marcRecordToXml(marcRecord);
	}

	private getNzMmsIdFromEntity(entity: Entity): Observable<string> {
		if (entity.link.indexOf('?nz_mms_id') >= 0) {
			return of(entity.id);
		}

		return this.restService
			.call({
				method: HttpMethod.GET,
				url: entity.link,
			})
			.pipe(
				switchMap((response) => {
					const nzMmsId: string = response?.linked_record_id?.value;

					if (!nzMmsId) {
						throw new Error('No NZ MMSID found in linked record');
					}

					return of(nzMmsId);
				}),
				catchError(() => of(entity.id))
			);
	}
}
