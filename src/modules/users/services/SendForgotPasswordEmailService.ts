import AppError from '@shared/errors/AppError';
import path from 'path';
import EtherealMail from '@config/mail/EtherealMail';
import SESMail from '@config/mail/SESMail';
import mailConfig from '@config/mail/mail';
import { inject, injectable } from 'tsyringe/dist/typings/decorators';
import { IUserTokensRepository } from '../domain/repositories/IUserTokensRepository';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';
import { ERROR_MESSAGES } from '@shared/errors/errorMessages';

@injectable()
class SendForgotPasswordEmailService {
    constructor(
        @inject('UsersTokensRepository')
        private userTokensRepository: IUserTokensRepository,
        @inject('UsersRepository')
        private usersRepository: IUsersRepository,
    ) {}

    public async execute(email: string): Promise<void> {
        const { USERS } = ERROR_MESSAGES;

        const user = await this.usersRepository.findByEmail(email);

        if (!user) {
            throw new AppError(USERS.USER_NOT_FOUND);
        }

        const { token } = await this.userTokensRepository.generate(user.id);

        const forgotPasswordTemplate = path.resolve(
            __dirname,
            '..',
            'views',
            'forgot_password.hbs',
        );

        if (mailConfig.driver === 'ses') {
            await SESMail.sendMail({
                to: {
                    name: user.name,
                    email: user.email,
                },
                subject: '[API Vendas] Recuperação de Senha',
                templateData: {
                    file: forgotPasswordTemplate,
                    variables: {
                        name: user.name,
                        link: `${process.env.APP_WEB_URL}/reset_password?token=${token}`,
                    },
                },
            });
            return;
        }

        await EtherealMail.sendMail({
            to: {
                name: user.name,
                email: user.email,
            },
            subject: '[API Vendas] Recuperação de Senha',
            templateData: {
                file: forgotPasswordTemplate,
                variables: {
                    name: user.name,
                    link: `${process.env.APP_WEB_URL}/reset_password?token=${token}`,
                },
            },
        });
    }
}

export default SendForgotPasswordEmailService;
