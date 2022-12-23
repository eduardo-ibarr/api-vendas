import AppError from '@shared/errors/AppError';
import uploadConfig from '@config/upload';
import DiskStorageProvider from '@shared/providers/StorageProvider/DiskStorageProvider';
import S3StorageProvider from '@shared/providers/StorageProvider/S3StorageProvider';
import { inject, injectable } from 'tsyringe/dist/typings/decorators';
import { IUsersRepository } from '../domain/repositories/IUsersRepository';
import { IUser } from '../domain/models/IUser';
import { IUpdateUserAvatar } from '../domain/models/IUpdateUserAvatar';
import { ERROR_MESSAGES } from '@shared/errors/errorMessages';

@injectable()
class UpdateUserAvatarService {
    constructor(
        @inject('UsersRepository')
        private usersRepository: IUsersRepository,
    ) {}

    public async execute({
        user_id,
        avatarFilename,
    }: IUpdateUserAvatar): Promise<IUser> {
        const { USERS } = ERROR_MESSAGES;

        const user = await this.usersRepository.findById(user_id);

        if (!user) {
            throw new AppError(USERS.USER_NOT_FOUND);
        }

        if (uploadConfig.driver === 's3') {
            const s3Provider = new S3StorageProvider();
            if (user.avatar) {
                await s3Provider.deleteFile(user.avatar);
            }
            const filename = await s3Provider.saveFile(avatarFilename);
            user.avatar = filename;
        } else {
            const diskProvider = new DiskStorageProvider();
            if (user.avatar) {
                await diskProvider.deleteFile(user.avatar);
            }
            const filename = await diskProvider.saveFile(avatarFilename);
            user.avatar = filename;
        }

        await this.usersRepository.save(user);

        return user;
    }
}

export default UpdateUserAvatarService;
