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
	InitService,
	MaterialModule,
} from '@exlibris/exl-cloudapp-angular-lib';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { EntityListComponent } from './entity-list/entity-list.component';
import { EntityDetailComponent } from './entity-detail/entity-detail.component';
import { ExternalComponent } from './external/external.component';
import { IdrefSearchComponent } from './idref-search/idref-search.component';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

@NgModule({
	declarations: [
		AppComponent,
		MainComponent,
		EntityListComponent,
		EntityDetailComponent,
		ExternalComponent,
		IdrefSearchComponent
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
		MatInputModule
	],
	providers: [
		{
			provide: APP_INITIALIZER,
			useFactory: (): (() => boolean) => () => true,
			deps: [InitService],
			multi: true,
		},
		{
			provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
			useValue: { appearance: 'standard' },
		},
		provideHttpClient(withInterceptorsFromDi()),
	],
})
export class AppModule {}
