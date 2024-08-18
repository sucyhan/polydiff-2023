import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-general-header',
    templateUrl: './general-header.component.html',
    styleUrls: ['./general-header.component.scss'],
})
export class GeneralHeaderComponent {
    @Input() pageTitle: string = '';
    @Input() icon: string = '';
    @Input() link: string = '';
}
