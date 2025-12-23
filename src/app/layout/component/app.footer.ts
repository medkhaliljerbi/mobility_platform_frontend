import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        Esprit Mobility by
        <a href="https://www.esprit.tn/" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">Esprit Tech</a>
    </div>`
})
export class AppFooter {}
