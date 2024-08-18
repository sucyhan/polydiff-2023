import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppModule } from '@app/app.module';
import { COLOR } from '@common/constants';

import { ToolBoxComponent } from './tool-box.component';

describe('ToolBoxComponent', () => {
    let component: ToolBoxComponent;
    let fixture: ComponentFixture<ToolBoxComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppModule],
            declarations: [ToolBoxComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ToolBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('sliderOnChange should set selectedSize to newRadius', () => {
        component.sliderOnChange(1);
        expect(component.selectedSize).toEqual(1);
    });

    it('sliderOnChange should emit radiusChanged', () => {
        spyOn(component.radiusChanged, 'emit');
        component.sliderOnChange(1);
        expect(component.radiusChanged.emit).toHaveBeenCalledWith('Radius Changed');
    });

    it('colorOnChange should set color to newColor', () => {
        component.colorOnChange('#000000');
        expect(component.color).toEqual('#000000');
    });

    it('colorOnChange should emit colorChanged', () => {
        spyOn(component.colorChanged, 'emit');
        component.colorOnChange('#000000');
        expect(component.colorChanged.emit).toHaveBeenCalledWith('COLOR changed');
    });

    it('selectColor should set selectedColor to newColor', () => {
        component.selectColor('black');
        expect(component.selectedColor).toEqual(COLOR.black);
    });

    it('selectColor should emit colorChanged', () => {
        spyOn(component.colorChanged, 'emit');
        component.selectColor('black');
        expect(component.colorChanged.emit).toHaveBeenCalledWith('COLOR changed');
    });

    it('selectOption should add selected class to element', () => {
        const element = document.createElement('div');
        component.selectOption(element);
        expect(element.classList.contains('selected')).toBeTrue();
    });

    it('unselectOption should remove selected class from element', () => {
        const element = document.createElement('div');
        element.classList.add('selected');
        component.unselectOption(element);
        expect(element.classList.contains('selected')).toBeFalse();
    });

    it('unselectAllOptions should unselect all options', () => {
        spyOn(component, 'unselectOption').and.returnValue();
        component.unselectAllOptions();
        expect(component.unselectOption).toHaveBeenCalledWith(document.getElementById('erase') as HTMLElement);
        expect(component.unselectOption).toHaveBeenCalledWith(document.getElementById('draw') as HTMLElement);
        expect(component.unselectOption).toHaveBeenCalledWith(document.getElementById('rectangle') as HTMLElement);
    });

    it('erase should select erase option', () => {
        spyOn(component, 'selectOption').and.returnValue();
        spyOn(component, 'unselectOption').and.returnValue();
        component.erase();
        expect(component.selectOption).toHaveBeenCalledWith(document.getElementById('erase') as HTMLElement);
        expect(component.unselectOption).toHaveBeenCalledWith(document.getElementById('draw') as HTMLElement);
        expect(component.unselectOption).toHaveBeenCalledWith(document.getElementById('rectangle') as HTMLElement);
    });

    it('erase should emit selectEraser', () => {
        spyOn(component.selectEraser, 'emit');
        component.erase();
        expect(component.selectEraser.emit).toHaveBeenCalledWith('Eraser Selected');
    });

    it('draw should select draw option', () => {
        spyOn(component, 'selectOption').and.returnValue();
        spyOn(component, 'unselectOption').and.returnValue();
        component.draw();
        expect(component.selectOption).toHaveBeenCalledWith(document.getElementById('draw') as HTMLElement);
        expect(component.unselectOption).toHaveBeenCalledWith(document.getElementById('erase') as HTMLElement);
        expect(component.unselectOption).toHaveBeenCalledWith(document.getElementById('rectangle') as HTMLElement);
    });

    it('draw should emit selectDraw', () => {
        spyOn(component.selectDraw, 'emit');
        component.draw();
        expect(component.selectDraw.emit).toHaveBeenCalledWith('Draw Selected');
    });

    it('createRectangle should select rectangle option', () => {
        spyOn(component, 'selectOption').and.returnValue();
        spyOn(component, 'unselectOption').and.returnValue();
        component.createRectangle();
        expect(component.selectOption).toHaveBeenCalledWith(document.getElementById('rectangle') as HTMLElement);
        expect(component.unselectOption).toHaveBeenCalledWith(document.getElementById('draw') as HTMLElement);
        expect(component.unselectOption).toHaveBeenCalledWith(document.getElementById('erase') as HTMLElement);
    });

    it('createRectangle should emit selectRectangles', () => {
        spyOn(component.selectRectangles, 'emit');
        component.createRectangle();
        expect(component.selectRectangles.emit).toHaveBeenCalledWith('Rectangle Selected');
    });

    it('undo should emit undoEvent', () => {
        spyOn(component.undoEvent, 'emit');
        component.undo();
        expect(component.undoEvent.emit).toHaveBeenCalledWith('Undo');
    });

    it('redo should emit redoEvent', () => {
        spyOn(component.redoEvent, 'emit');
        component.redo();
        expect(component.redoEvent.emit).toHaveBeenCalledWith('Redo');
    });

    it('reset should emit resetEvent', () => {
        spyOn(component.resetEvent, 'emit');
        component.reset();
        expect(component.resetEvent.emit).toHaveBeenCalledWith('Reset');
    });

    it('swap should emit swapEvent', () => {
        spyOn(component.swapEvent, 'emit');
        component.swap();
        expect(component.swapEvent.emit).toHaveBeenCalledWith('Swap');
    });
});
