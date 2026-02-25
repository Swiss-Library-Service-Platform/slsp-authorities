import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { AlertService, CloudAppSettingsService, FormGroupUtil } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { Settings } from '../models/settings.model';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit{

  public form!: FormGroup;
  public saving = false;

  private settingsService = inject(CloudAppSettingsService);
  private alert = inject(AlertService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  public relaunchApp(): void {
    window.location.assign(`${window.location.origin}${window.location.pathname}${window.location.search}`);
  }
  

  public ngOnInit(): void {
    this.settingsService.get().pipe(takeUntilDestroyed(this.destroyRef)).subscribe( settings => {
      this.form = FormGroupUtil.toFormGroup(Object.assign(new Settings(), settings))
    });
  }

  public save(): void {
    this.saving = true;
    this.settingsService.set(this.form.value).subscribe({
      next: () => {
        this.alert.success(this.translate.instant('settings.messages.saveSuccess'));
        this.saving = false;
      },
      error: (err) => {
        this.alert.error(this.translate.instant('settings.messages.saveError'), err);
        this.saving = false;
      }
    });
  }
  public reset(): void {
    this.settingsService.remove().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.form = FormGroupUtil.toFormGroup(new Settings());
      },
    });
  }

}
