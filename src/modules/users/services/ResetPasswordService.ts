import AppError from '@shared/errors/AppError';
import { isAfter, addHours } from 'date-fns';
import { inject, injectable } from 'tsyringe/dist/typings/decorators';
import { IUserTokensRepository } from '../domain/repositories/IUserTokensRepository';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';
import { IHashProvider } from '../providers/HashProvider/models/IHashProvider';

interface IRequest {
    token: string;
    password: string;
}

@injectable()
class ResetPasswordService {
    constructor(
        @inject('UsersTokensRepository')
        private userTokensRepository: IUserTokensRepository,
        @inject('UsersRepository')
        private usersRepository: IUsersRepository,
        @inject('HashContainer')
        private hashProvider: IHashProvider,
    ) {}

    public async execute({ token, password }: IRequest): Promise<void> {
        const userToken = await this.userTokensRepository.findByToken(token);

        if (!userToken) {
            throw new AppError('User Token does not exists.');
        }

        const user = await this.usersRepository.findById(userToken.user_id);

        if (!user) {
            throw new AppError('User does not exists.');
        }

        const tokenCreatedAt = userToken.created_at;
        const compareDate = addHours(tokenCreatedAt, 2);

        if (isAfter(Date.now(), compareDate)) {
            throw new AppError('Token expired.');
        }

        user.password = await this.hashProvider.generateHash(password);

        await this.usersRepository.save(user);
    }
}

export default ResetPasswordService;
