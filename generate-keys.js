var didAuth = require('@decentralized-identity/did-auth-jose');
var fs = require('fs');

(async () => {

  const kid = '#key-1';
  const privKey = await didAuth.EcPrivateKey.generatePrivateKey(kid);
  const pubKey = privKey.getPublicKey();
  pubKey.defaultSignAlgorithm = 'ES256K';

  fs.writeFileSync('./private.jwk', JSON.stringify(privKey));
  fs.writeFileSync('./public.jwk', JSON.stringify(pubKey));

})();
