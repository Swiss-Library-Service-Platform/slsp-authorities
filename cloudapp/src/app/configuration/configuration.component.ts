import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
	AlertService,
	CloudAppConfigService,
	FormGroupUtil,
} from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { Config } from '../models/config.model';

@Component({
	selector: 'app-configuration',
	templateUrl: './configuration.component.html',
	styleUrl: './configuration.component.scss',
})
export class ConfigurationComponent implements OnInit {
	public form!: FormGroup;
	public saving = false;
	private configService = inject(CloudAppConfigService);
	private alert = inject(AlertService);
  private translate = inject(TranslateService);

  public relaunchApp(): void {
    window.location.assign(`${window.location.origin}${window.location.pathname}${window.location.search}`);
  }

	public ngOnInit(): void {
		this.configService.get().subscribe((config) => {
			this.form = FormGroupUtil.toFormGroup(Object.assign(new Config(), config));
		});
	}

  public save(): void {
    this.saving = true;
    this.configService.set(this.form.value).subscribe({
      next: () => {
        this.alert.success(this.translate.instant('config.messages.saveSuccess'));
        this.saving = false;
      },
      error: (err) => {
        this.alert.error(this.translate.instant('config.messages.saveError'), err);
        this.saving = false;
      }
    });
  }

  public reset(): void {
    this.configService.remove().subscribe()

  }
}
