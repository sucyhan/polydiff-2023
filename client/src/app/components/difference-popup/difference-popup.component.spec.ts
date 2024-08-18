import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';

import { AppModule } from '@app/app.module';
import { DifferencePopupComponent } from './difference-popup.component';

describe('DifferencePopupComponent', () => {
    let component: DifferencePopupComponent;
    let fixture: ComponentFixture<DifferencePopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MatIconModule, AppModule],
            declarations: [DifferencePopupComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DifferencePopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('hideDifference should change showPopup to false', () => {
        component.showPopup = true;
        component.hideDifference();
        expect(component.showPopup).toBeFalse();
    });

    it('hideDifference should be called when modal-button is clicked', () => {
        const hideDifferenceSpy = spyOn(component, 'hideDifference');
        const button = fixture.debugElement.query(By.css('.modal-button')).nativeElement;
        button.click();
        expect(hideDifferenceSpy).toHaveBeenCalled();
    });
});
