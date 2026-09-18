import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

// ThrottlerGuard lee req/res del contexto HTTP; en GraphQL hay que sacarlos del contexto Apollo.
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context) {
    const gqlContext = GqlExecutionContext.create(context).getContext();
    return { req: gqlContext.req, res: gqlContext.res };
  }

  async throwThrottlingException() {
    throw new Error(
      'Demasiadas inscripciones seguidas. Intenta de nuevo en un minuto.',
    );
  }
}
