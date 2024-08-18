import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { AppModule } from '@app/app.module';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientModule, AppModule],
            declarations: [MainPageComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it("should have as title 'Jeu de différences'", () => {
        expect(component.title).toEqual('Jeu de différences');
    });

    it('should have a img for the logo', () => {
        const img = fixture.debugElement.query(By.css('img')).nativeElement;
        expect(img).toBeDefined();
    });

    it('should have the source of the image', () => {
        const img = fixture.debugElement.query(By.css('img')).nativeElement;
        expect(img.src).toBeDefined();
        expect(img.getAttribute('src')).toEqual(component.logoSrc);
    });

    it('should have the logo of the game', () => {
        expect(component.logoSrc).toEqual('assets/logo.png');
    });

    it('should have 3 buttons', () => {
        const buttons = fixture.debugElement.queryAll(By.css('button'));
        expect(buttons.length).toEqual(3);
    });

    it('should have the team number: 303', () => {
        expect(component.teamNumber).toEqual('303');
    });
    it('should have the name of all team members in alphabetical order', () => {
        expect(component.teamMembers).toEqual([
            'Farid Bakir,',
            'Louis-Philippe Daigle,',
            'Sucy Han,',
            'Aurélie Nichols,',
            'Anne Raymond,',
            'Enrique Arsenio Rodriguez Rodriguez',
        ]);
    });

    it('should have 3 options: Mode Classique, Mode Temps Limité, Mode Configuration', () => {
        expect(component.options.length).toEqual(3);
        expect(component.options[0]).toEqual({ name: 'Mode Classique', link: '/select' });
        expect(component.options[1]).toEqual({ name: 'Mode Temps Limité', link: '/timed' });
        expect(component.options[2]).toEqual({ name: 'Mode Configuration', link: '/config' });
    });

    it('should have the first button as Mode Classique', () => {
        const button = fixture.debugElement.query(By.css('button')).nativeElement;
        expect(button.textContent).toEqual('Mode Classique');
    });

    it('should have the first button linked to the game-selection-page', () => {
        const button = fixture.debugElement.query(By.css('button')).nativeElement;
        expect(button.getAttribute('ng-reflect-router-link')).toEqual('/select');
    });

    it('should have the second button as Mode Temps Limité', () => {
        const secondButton = fixture.debugElement.queryAll(By.css('button'))[1].nativeElement;
        expect(secondButton.textContent).toEqual('Mode Temps Limité');
    });

    it('should have the second button linked to the timed', () => {
        const secondButton = fixture.debugElement.queryAll(By.css('button'))[1].nativeElement;
        expect(secondButton.getAttribute('ng-reflect-router-link')).toEqual('/timed');
    });

    it('should have the last button as Mode Configuration', () => {
        const lastButton = fixture.debugElement.queryAll(By.css('button'))[2].nativeElement;
        expect(lastButton.textContent).toEqual('Mode Configuration');
    });

    it('should have the last button linked to the configuration-page', () => {
        const lastButton = fixture.debugElement.queryAll(By.css('button'))[2].nativeElement;
        expect(lastButton.getAttribute('ng-reflect-router-link')).toEqual('/config');
    });

    it('should have a footer', () => {
        const footer = fixture.debugElement.query(By.css('footer')).nativeElement;
        expect(footer).toBeDefined();
    });

    it('should have a footer with the team number in a h4', () => {
        const h4 = fixture.debugElement.query(By.css('h4')).nativeElement;
        expect(h4).toBeDefined();
        expect(h4.textContent).toEqual('Équipe 303');
    });

    it('should have a p element in the footer', () => {
        const p = fixture.debugElement.query(By.css('footer p')).nativeElement;
        expect(p).toBeDefined();
    });

    it('should have a p containing 6 span: one for each team member', () => {
        const span = fixture.debugElement.queryAll(By.css('footer p span'));
        expect(span.length).toEqual(component.teamMembers.length);
    });
});
