import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '@common/constants';
import { UsernamesObject } from '@common/interfaces';
import { AllUsernamesMessage, IsUsernameAvailableMessage, UsernameMessage } from '@common/messages';
import { Service } from 'typedi';

@Service()
export class UsernameService {
    usernames: UsernamesObject[] = [];

    addUsername(message: UsernameMessage): boolean {
        if (this.isUsernameAvailable(message).valid) {
            for (const game of this.usernames) {
                if (game.id === message.id) {
                    game.usernames.push(message.username);
                    return true;
                }
            }
            this.usernames.push({ id: message.id, usernames: [message.username] });
            return true;
        }
        return false;
    }

    removeUsername(message: UsernameMessage): boolean {
        for (const game of this.usernames) {
            if (game.id === message.id) {
                game.usernames = game.usernames.filter((username) => username !== message.username);
                if (!game.usernames.length) {
                    this.usernames = this.usernames.filter((gameObj) => gameObj.id !== message.id);
                }
                return true;
            }
        }
        return false;
    }

    getAllUsernames(): AllUsernamesMessage {
        return { usernames: this.usernames };
    }

    isUsernameAvailable(message: UsernameMessage): IsUsernameAvailableMessage {
        if (message.username.length < USERNAME_MIN_LENGTH || message.username.length > USERNAME_MAX_LENGTH) return { valid: false };
        if (message.username.includes(' ')) return { valid: false };
        if (!/^[A-Za-z0-9]*$/.test(message.username)) return { valid: false };

        for (const game of this.usernames) {
            if (game.id === message.id) {
                return { valid: !game.usernames.includes(message.username) };
            }
        }
        return { valid: true };
    }

    removeAllUserFromId(id: number) {
        this.usernames = this.usernames.filter((gameObj) => gameObj.id !== id - 1);
    }
}
