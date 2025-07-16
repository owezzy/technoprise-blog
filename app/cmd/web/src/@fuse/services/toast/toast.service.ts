import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { FuseToastComponent } from './toast.component';

export interface FuseToastConfig {
  duration?: number;
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  verticalPosition?: 'top' | 'bottom';
  panelClass?: string[];
}

@Injectable({ providedIn: 'root' })
export class FuseToastService {
  private defaultConfig: FuseToastConfig = {
    duration: 5000,
    horizontalPosition: 'right',
    verticalPosition: 'top',
    panelClass: ['fuse-toast']
  };

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Show success toast
   */
  success(message: string, config?: Partial<FuseToastConfig>): void {
    this.show(message, 'success', config);
  }

  /**
   * Show error toast
   */
  error(message: string, config?: Partial<FuseToastConfig>): void {
    this.show(message, 'error', config);
  }

  /**
   * Show warning toast
   */
  warning(message: string, config?: Partial<FuseToastConfig>): void {
    this.show(message, 'warning', config);
  }

  /**
   * Show info toast
   */
  info(message: string, config?: Partial<FuseToastConfig>): void {
    this.show(message, 'info', config);
  }

  /**
   * Show toast with custom type
   */
  private show(message: string, type: 'success' | 'error' | 'warning' | 'info', config?: Partial<FuseToastConfig>): void {
    const toastConfig: FuseToastConfig = { ...this.defaultConfig, ...config };
    
    const snackBarConfig: MatSnackBarConfig = {
      duration: toastConfig.duration,
      horizontalPosition: toastConfig.horizontalPosition,
      verticalPosition: toastConfig.verticalPosition,
      panelClass: [
        ...toastConfig.panelClass!,
        `fuse-toast-${type}`
      ],
      data: { message, type }
    };

    this.snackBar.openFromComponent(FuseToastComponent, snackBarConfig);
  }

  /**
   * Dismiss all toasts
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}