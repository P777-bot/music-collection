import { BadRequestException } from '@nestjs/common';
import { AuthValidationPipe } from './auth.dto';

describe('AuthValidationPipe', () => {
  const body = (password: string) => ({ email: ' LISTENER@example.test ', password });

  it('requires at least 15 characters during registration and permits long passphrases', () => {
    const register = new AuthValidationPipe(true);
    expect(() => register.transform(body('12345678901234'))).toThrow(BadRequestException);
    expect(register.transform(body('a passphrase with 15+ characters')).email).toBe('listener@example.test');
  });

  it('retains the previous minimum when logging in existing accounts', () => {
    const login = new AuthValidationPipe();
    expect(login.transform(body('legacy123')).password).toBe('legacy123');
    expect(() => login.transform(body('short'))).toThrow(BadRequestException);
  });

  it('limits passwords to 128 characters', () => {
    expect(() => new AuthValidationPipe(true).transform(body('x'.repeat(129))))
      .toThrow(BadRequestException);
  });
});
