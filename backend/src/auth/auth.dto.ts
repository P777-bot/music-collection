import { BadRequestException, PipeTransform } from '@nestjs/common';

export class AuthCredentialsDto {
  email!: string;
  password!: string;
}

export class AuthValidationPipe implements PipeTransform<unknown, AuthCredentialsDto> {
  constructor(private readonly registering = false) {}

  transform(value: unknown): AuthCredentialsDto {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Request body must be an object.');
    }
    const body = value as Record<string, unknown>;
    if (typeof body.email !== 'string') throw new BadRequestException('Email is required.');
    const email = body.email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Enter a valid email address.');
    }
    const minimum = this.registering ? 15 : 8;
    if (typeof body.password !== 'string' || body.password.length < minimum || body.password.length > 128) {
      throw new BadRequestException(this.registering
        ? 'Password must be between 15 and 128 characters.'
        : 'Password must be between 8 and 128 characters.');
    }
    return { email, password: body.password };
  }
}
