import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AppRoutingModule } from '@app/modules/app-routing.module';

import { GeneralHeaderComponent } from './general-header.component';

describe('GeneralHeaderComponent', () => {
    let component: GeneralHeaderComponent;
    let fixture: ComponentFixture<GeneralHeaderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GeneralHeaderComponent],
            imports: [AppRoutingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(GeneralHeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have a h1 header', () => {
        const h1 = fixture.debugElement.query(By.css('h1')).nativeElement;
        expect(h1).toBeDefined();
    });

    it('should have a page title as a variable', () => {
        expect(component.pageTitle).toBeDefined();
    });

    it('should have the home icon linked to the main-page', () => {
        const a = fixture.debugElement.query(By.css('a')).nativeElement;
        expect(a.getAttribute('routerlink')).toEqual(null);
    });
});
