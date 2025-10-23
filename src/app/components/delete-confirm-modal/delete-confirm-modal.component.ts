import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-delete-confirm-modal',
    standalone: true,
    templateUrl: './delete-confirm-modal.component.html',
})
export class DeleteConfirmModalComponent {
    count = input<number>(0);
    busy = input<boolean>(false);

    cancelModal = output<void>();
    confirm = output<void>();

    onCancel() {
        this.cancelModal.emit();
    }

    onConfirm() {
        this.confirm.emit();
    }
}
