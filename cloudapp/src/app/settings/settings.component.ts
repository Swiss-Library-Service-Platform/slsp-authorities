import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AlertService, CloudAppSettingsService, FormGroupUtil } from '@exlibris/exl-cloudapp-angular-lib';
import { Settings } from '../models/setting';

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
  

  public ngOnInit(): void {
    this.settingsService.get().subscribe( settings => {
      this.form = FormGroupUtil.toFormGroup(Object.assign(new Settings(), settings))
    });
  }

  public save(): void {
    this.saving = true;
    this.settingsService.set(this.form.value).subscribe({
      next: () => {
        this.alert.success('Settings saved');
        this.saving = false;
      },
      error: (err) => {
        this.alert.error('Error saving settings', err);
        this.saving = false;
      }
    });
  }

}
