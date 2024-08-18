import { UsernameMessage } from '@common/messages';
import { expect } from 'chai';
import { UsernameService } from './username.service';

describe('Username Service', () => {
    let usernameService: UsernameService;
    const testUsername = 'test';
    let message: UsernameMessage;

    beforeEach(async () => {
        usernameService = new UsernameService();
        message = { id: 1, username: testUsername };
    });

    it('should add a username if it is not taken', () => {
        expect(usernameService.addUsername(message)).equal(true);
        expect(usernameService.usernames[0].usernames[0]).equal(testUsername);
        expect(usernameService.usernames[0].id).equal(message.id);
    });

    it('should not add a username if it is taken', () => {
        usernameService.usernames.push({ id: message.id, usernames: [message.username] });
        expect(usernameService.addUsername(message)).equal(false);
    });

    it('should add a username if it is taken in another game', () => {
        usernameService.usernames.push({ id: 2, usernames: [message.username] });
        expect(usernameService.addUsername(message)).equal(true);
    });

    it('should add username to existing game', () => {
        usernameService.usernames.push({ id: message.id, usernames: [] });
        expect(usernameService.addUsername(message)).equal(true);
        expect(usernameService.usernames[0].usernames[0]).equal(testUsername);
        expect(usernameService.usernames[0].id).equal(message.id);
    });

    it('should remove a username', () => {
        usernameService.usernames.push({ id: message.id, usernames: [message.username] });
        expect(usernameService.removeUsername(message)).equal(true);
        expect(usernameService.usernames.length).equal(0);
    });

    it('should remove all usernames from an specific if', () => {
        usernameService.usernames.push({ id: message.id, usernames: [message.username] });
        usernameService.removeAllUserFromId(2);
        expect(usernameService.usernames.length).equal(0);
    });

    it('should not remove a username if it is not in a game', () => {
        expect(usernameService.removeUsername(message)).equal(false);
    });

    it('should not remove a username if it is in another game', () => {
        usernameService.usernames.push({ id: 2, usernames: [message.username] });
        expect(usernameService.removeUsername(message)).equal(false);
    });

    it('should remove a game if it has no usernames', () => {
        usernameService.usernames.push({ id: message.id, usernames: [message.username] });
        expect(usernameService.removeUsername(message)).equal(true);
        expect(usernameService.usernames.length).equal(0);
    });

    it('should keep a game if it has usernames', () => {
        usernameService.usernames.push({ id: message.id, usernames: [message.username, 'test2'] });
        expect(usernameService.removeUsername(message)).equal(true);
        expect(usernameService.usernames.length).equal(1);
    });

    it('should return all usernames', () => {
        usernameService.usernames.push({ id: 1, usernames: [testUsername] });
        expect(usernameService.getAllUsernames().usernames).equal(usernameService.usernames);
    });

    it('should return false if a username is taken', () => {
        usernameService.usernames.push({ id: message.id, usernames: [message.username] });
        expect(usernameService.isUsernameAvailable(message).valid).equal(false);
    });

    it('should return true if a username is not taken', () => {
        usernameService.usernames.push({ id: message.id, usernames: [] });
        expect(usernameService.isUsernameAvailable(message).valid).equal(true);
    });

    it('should return true if a username is taken in another game', () => {
        usernameService.usernames.push({ id: 2, usernames: [message.username] });
        expect(usernameService.isUsernameAvailable(message).valid).equal(true);
    });

    it('should return true if no game exists', () => {
        expect(usernameService.isUsernameAvailable(message).valid).equal(true);
    });

    it('should return false if the username is too short', () => {
        const shortMessage = { id: 1, username: 'te' };
        expect(usernameService.isUsernameAvailable(shortMessage).valid).equal(false);
    });

    it('should return false if the username is too long', () => {
        const longMessage = { id: 1, username: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' };
        expect(usernameService.isUsernameAvailable(longMessage).valid).equal(false);
    });

    it('should return false if the username contains spaces', () => {
        const spaceMessage = { id: 1, username: 'test ' };
        expect(usernameService.isUsernameAvailable(spaceMessage).valid).equal(false);
    });

    it('should return false if the username contains special characters', () => {
        const specialMessage = { id: 1, username: 'test"' };
        expect(usernameService.isUsernameAvailable(specialMessage).valid).equal(false);
    });
});
