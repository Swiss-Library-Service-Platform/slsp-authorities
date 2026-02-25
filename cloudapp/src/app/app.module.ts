import {
	provideHttpClient,
	withInterceptorsFromDi,
} from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
	AlertModule,
	CloudAppTranslateModule,
	InitService as ExLibrisInitService,
	MaterialModule,
} from '@exlibris/exl-cloudapp-angular-lib';
import { Observable } from 'rxjs';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { EntityListComponent } from './main/entity-list/entity-list.component';

import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

import { MatPaginatorModule } from '@angular/material/paginator';
import { BiblioRecordComponent } from './main/biblio-record/biblio-record.component';
import { DeleteDialogComponent } from './main/biblio-record/delete-dialog/delete-dialog.component';
import { EntityDetailComponent } from './main/entity-detail/entity-detail.component';
import { IdrefEntryDetailsComponent } from './main/entity-detail/idref-entry-details/idref-entry-details.component';
import { IdrefRecordComponent } from './main/entity-detail/idref-record/idref-record.component';
import { SearchComponent } from './main/biblio-record/search/search.component';
import { To902FormComponent } from './main/biblio-record/search/to902-form/to902-form.component';
import { MainFormComponent } from './main/biblio-record/search/main-form/main-form.component';
import { JsonPipe } from '@angular/common';
import { SettingsComponent } from './settings/settings.component';
import { ConfigurationComponent } from './configuration/configuration.component';
import { InitService } from './services/init.service';


@NgModule({
	declarations: [
		AppComponent,
		MainComponent,
		EntityListComponent,
		EntityDetailComponent,
		SearchComponent,
		BiblioRecordComponent,
		IdrefRecordComponent,
		IdrefEntryDetailsComponent,
		DeleteDialogComponent,
		To902FormComponent,
		MainFormComponent,
		SettingsComponent,
		ConfigurationComponent,
	],
	bootstrap: [AppComponent],
	imports: [
    MaterialModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    AlertModule,
    FormsModule,
    ReactiveFormsModule,
    CloudAppTranslateModule.forRoot(),
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
	JsonPipe,
],
	providers: [
		{
			provide: APP_INITIALIZER,
			useFactory: (initService: InitService): (() => Observable<void>) => () => initService.initialized$,
			deps: [InitService],
			multi: true,
		},
		{
			provide: APP_INITIALIZER,
			useFactory: (): (() => boolean) => () => true,
			deps: [ExLibrisInitService],
			multi: true,
		},
		{
			provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
			useValue: { appearance: 'fill' },
		},
		provideHttpClient(withInterceptorsFromDi()),
	],
})
export class AppModule {}
