import { EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client.service';
import { Socket } from 'socket.io-client';

import { UserNameInputComponent } from './user-name-input.component';

class MockSocketClientService extends SocketClientService {
    override connect(): void {
        return;
    }
}

describe('UserNameInputComponent', () => {
    let component: UserNameInputComponent;
    let fixture: ComponentFixture<UserNameInputComponent>;
    let socketClientServiceMock: MockSocketClientService;
    let socketHelper: SocketTestHelper;
    const testUsername = 'test';

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketClientServiceMock = new MockSocketClientService();
        socketClientServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            declarations: [UserNameInputComponent],
            providers: [FormBuilder, { provide: SocketClientService, useValue: socketClientServiceMock }],
            imports: [ReactiveFormsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(UserNameInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create a new instance of FormBuilder', () => {
        expect(component['formBuilder']).toBeTruthy();
    });

    it('should create a new instance of FormGroup', () => {
        expect(component['usernameInputForm']).toBeTruthy();
    });

    it('get username should return the username from the form', () => {
        component['usernameInputForm'].setValue({ username: 'test' });
        expect(component.username).toEqual('test');
    });

    it('should return "" when username is set to null', () => {
        component.usernameInputForm.setValue({ username: null });
        expect(component.username).toEqual('');
    });

    it('should return "" when usernameInputForm value is null', () => {
        component.usernameInputForm = FormGroup.prototype;
        expect(component.username).toEqual('');
    });

    it('handleSocket should show error message if verifyUsername event received and verifier is false', () => {
        component.showErrorMessage = false;
        component.ngOnInit();
        socketHelper.peerSideEmit('verifyUsername', false);
        expect(component.showErrorMessage).toBeTruthy();
    });

    it('handleSocket should not show error message if verifyUsername event received and verifier is true', () => {
        component.showErrorMessage = true;
        const emitSpy = spyOn(EventEmitter.prototype, 'emit').and.returnValue();
        component.ngOnInit();
        socketHelper.peerSideEmit('verifyUsername', true);
        expect(component.showErrorMessage).toBeFalsy();
        expect(emitSpy).toHaveBeenCalledWith(component.userName);
    });

    it('sendUsername should put the username in the local storage', () => {
        const setItemSpy = spyOn(localStorage, 'setItem');
        component.usernameInputForm.setValue({ username: testUsername });
        component.sendUsername();
        expect(setItemSpy).toHaveBeenCalledWith('username', testUsername);
    });

    it('verifyUsername should return true if the username is of length 3 or more and 15 or less', () => {
        component.usernameInputForm.setValue({ username: testUsername });
        expect(component.verifyUsername()).toBeTruthy();
    });

    it('verifyUsername should return false if the username is of length less than 3', () => {
        component.usernameInputForm.setValue({ username: 'te' });
        expect(component.verifyUsername()).toBeFalsy();
    });

    it('verifyUsername should return false if the username is of length more than 15', () => {
        component.usernameInputForm.setValue({ username: 'aaaaaaaaaaaaaaaaaa' });
        expect(component.verifyUsername()).toBeFalsy();
    });

    it('verifyKeyPress should return true if the key pressed is a letter', () => {
        expect(
            component.verifyKeyPress({
                key: 'a',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeTruthy();
    });

    it('verifyKeyPress should return true if the key pressed is a number', () => {
        expect(
            component.verifyKeyPress({
                key: '1',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeTruthy();
    });

    it('verifyKeyPress should return false if the key pressed is a space', () => {
        expect(
            component.verifyKeyPress({
                key: ' ',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeFalsy();
    });

    it('verifyKeyPress should return false if the key pressed is a special character', () => {
        expect(
            component.verifyKeyPress({
                key: '!',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeFalsy();
    });

    it('verifyKeyPress should return true if the key pressed is a backspace', () => {
        expect(
            component.verifyKeyPress({
                key: 'Backspace',
                preventDefault: () => {
                    return;
                },
            } as KeyboardEvent),
        ).toBeTruthy();
    });
});
