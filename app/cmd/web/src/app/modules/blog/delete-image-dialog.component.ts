import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'delete-image-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-6">
      <div class="flex items-center mb-4">
        <mat-icon class="text-red-500 mr-3">warning</mat-icon>
        <h2 class="text-xl font-semibold">Delete Featured Image</h2>
      </div>
      
      <p class="text-gray-600 mb-6">
        Are you sure you want to delete this featured image? This action cannot be undone.
      </p>
      
      <div class="flex justify-end gap-3">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-flat-button color="warn" (click)="onDelete()">
          <mat-icon class="mr-2">delete</mat-icon>
          Delete Image
        </button>
      </div>
    </div>
  `
})
export class DeleteImageDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<DeleteImageDialogComponent>
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onDelete(): void {
    this.dialogRef.close(true);
  }
}