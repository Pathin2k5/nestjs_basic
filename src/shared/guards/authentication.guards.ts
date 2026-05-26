import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AUTH_TYPE_KEY } from '../decorator/auth.decorator'

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const authTypeValue = this.reflector.getAllAndOverride<boolean>(AUTH_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    console.log('authTypeValue', authTypeValue)
    return true
  }
}