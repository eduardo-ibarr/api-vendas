import AppError from '@shared/errors/AppError';
import { ERROR_MESSAGES } from '@shared/errors/errorMessages';
import { inject, injectable } from 'tsyringe';
import { ICustomer } from '../domain/models/ICustomer';
import { IUpdateCustomer } from '../domain/models/IUpdateCustomer';
import { ICustomersRepository } from '../domain/repositories/ICustomersRepository';

@injectable()
class UpdateCustomerService {
    constructor(
        @inject('CustomersRepository')
        private customerRepository: ICustomersRepository,
    ) {}

    public async execute({
        id,
        name,
        email,
    }: IUpdateCustomer): Promise<ICustomer> {
        const { CUSTOMER } = ERROR_MESSAGES;

        const customer = await this.customerRepository.findById(id);

        if (!customer) {
            throw new AppError(CUSTOMER.NOT_FOUND);
        }

        const customerExists = await this.customerRepository.findByEmail(email);

        if (customerExists && email !== customer.email) {
            throw new AppError(CUSTOMER.EMAIL_ALREADY_IN_USE);
        }

        customer.name = name;
        customer.email = email;

        await this.customerRepository.save(customer);

        return customer;
    }
}

export default UpdateCustomerService;
