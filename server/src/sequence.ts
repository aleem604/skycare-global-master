import {inject} from '@loopback/context';
import {
  FindRoute,
  InvokeMethod,
  ParseParams,
  Reject,
  RequestContext,
  RestBindings,
  Send,
  SequenceHandler,
  ExternalExpressRoutes
} from '@loopback/rest';
import {AuthenticationBindings, AuthenticateFn, UserProfile} from '@loopback/authentication';
import {encode, decode} from 'jwt-simple';
import { Config } from './config';

const SequenceActions = RestBindings.SequenceActions;

export class MySequence implements SequenceHandler {
  constructor(
    @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(SequenceActions.PARSE_PARAMS) protected parseParams: ParseParams,
    @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(SequenceActions.SEND) public send: Send,
    @inject(SequenceActions.REJECT) public reject: Reject,
    @inject(AuthenticationBindings.AUTH_ACTION) protected authenticateRequest: AuthenticateFn,
  ) {}

  async handle(context: RequestContext) {
    try {
      const {request, response} = context;
      //response.setHeader('Access-Control-Allow-Origins', '*');
      response.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, PUT, DELETE, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, X-Requested-With');
      response.setHeader('Access-Control-Allow-Credentials', 'true');

      const route = this.findRoute(request);
      if (route.path != '/ping') {
        console.log(route.path);
      }

      // !!IMPORTANT: authenticateRequest fails on static routes!
      if (!(route instanceof ExternalExpressRoutes)) {
        const user = await this.authenticateRequest(request);
        if (user && 
                    ((request.headers.authorization && request.headers.authorization.indexOf('Basic') == 0) ||
                     ((user as any).role == 'limited'))) {
          // Allow users with Basic login to get an extended expiration if they requested "rememberMe"
          let expirationMultiplier : number = 1;
          if (Object.keys(request.query).indexOf('rememberMe') > -1 && (request.query.rememberMe == "true")) { expirationMultiplier = 1095; }
          
          const jwt = encode({
            sub: user.id,
            iss: Config.jwt.issuer,
            aud: Config.jwt.audience,
            exp: (new Date()).valueOf() + (expirationMultiplier * 24 * 60 * 60 * 1000),
            iat: (new Date()).valueOf(),
            name: user.name,
            email: (user.email) ? user.email.toLowerCase() : '',
            role: (user as any).role,
            caseID: ((user as any).caseID) ? (user as any).caseID : '',
            using2FA: (user as any).using2FA
          }, Config.jwt.encryptingKey, Config.jwt.algorithm);
          response.setHeader('Access-Control-Expose-Headers', 'Authorization');
          response.setHeader('Authorization', 'Bearer ' + jwt);
        }
      }      

      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);
      this.send(response, result);
    } catch (err) {
      if(err.name && err.name == 'NotFoundError'){
        console.log('default redirect');
        context.response.sendFile('public/index.html', {root: './'});
      } else {
        console.log('CAUGHT AN ERROR');
        console.log(err);
        this.reject(context, err);
        
      }      
    }
  }
}
