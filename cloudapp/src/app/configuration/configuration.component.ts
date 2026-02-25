import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private destroyRef = inject(DestroyRef);

  public relaunchApp(): void {
    window.location.assign(`${window.location.origin}${window.location.pathname}${window.location.search}`);
  }

	public ngOnInit(): void {
    this.configService.get().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((config) => {
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
    this.configService.remove().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
		next: () => {
			this.form = FormGroupUtil.toFormGroup(new Config());
		},
	});
  }
}
