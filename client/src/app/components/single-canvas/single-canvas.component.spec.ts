import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SingleCanvasComponent } from './single-canvas.component';

describe('SingleCanvasComponent', () => {
    let component: SingleCanvasComponent;
    let fixture: ComponentFixture<SingleCanvasComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SingleCanvasComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SingleCanvasComponent);
        component = fixture.componentInstance;
        component.layer = 'layer';
        component.index = 0;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('afterViewInit should set the canvas zIndex', () => {
        const canvas = fixture.nativeElement.querySelector('canvas');
        expect(canvas.style.zIndex).toBe('0');
    });
});
