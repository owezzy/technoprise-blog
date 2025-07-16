import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export interface FuseToastData {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Component({
  selector: 'fuse-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="fuse-toast-container">
      <div class="fuse-toast-icon">
        <mat-icon [ngSwitch]="data.type">
          <span *ngSwitchCase="'success'">check_circle</span>
          <span *ngSwitchCase="'error'">error</span>
          <span *ngSwitchCase="'warning'">warning</span>
          <span *ngSwitchDefault>info</span>
        </mat-icon>
      </div>
      <div class="fuse-toast-message">
        {{ data.message }}
      </div>
      <button 
        mat-icon-button 
        class="fuse-toast-close"
        (click)="dismiss()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .fuse-toast-container {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      padding: 0;
    }

    .fuse-toast-icon {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .fuse-toast-icon mat-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
    }

    .fuse-toast-message {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
    }

    .fuse-toast-close {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      margin-left: auto;
    }

    .fuse-toast-close mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FuseToastComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: FuseToastData,
    private snackBarRef: MatSnackBarRef<FuseToastComponent>
  ) {}

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}