var fs = require('fs');
var path = require('path');
var didAuth = require('@decentralized-identity/did-auth-jose');

// load JWKs from files
const jwkPriv = JSON.parse(fs.readFileSync(path.resolve(__dirname, './private.jwk'), 'ascii'));
const jwkPub = JSON.parse(fs.readFileSync(path.resolve(__dirname, './public.jwk'), 'ascii'));

// load JWK into an EcPrivateKey object
const privateKey = didAuth.EcPrivateKey.wrapJwk(jwkPriv.kid, jwkPriv);

async function makeJws() {

    // construct the JWS payload
    const body = {
        "@context": "https://w3id.org/did/v1",
        publicKey: [
            {
                id: jwkPub.kid,
                type: "Secp256k1VerificationKey2018",
                publicKeyJwk: jwkPub
            }
        ],
        service: [
            {
                id: "IdentityHub",
                type: "IdentityHub",
                serviceEndpoint: {
                    "@context": "schema.identity.foundation/hub",
                    "@type": "UserServiceEndpoint",
                    instance: [
                        "did:test:hub.id",
                    ]
                }
            }
        ],
    };

    // Construct the JWS header
    const header = {
        alg: jwkPub.defaultSignAlgorithm,
        kid: jwkPub.kid,
        //operation:'create',
        //proofOfWork:'{}'
    };

    // Sign the JWS
    const cryptoFactory = new didAuth.CryptoFactory([new didAuth.Secp256k1CryptoSuite()]);
    const jwsToken = new didAuth.JwsToken(body, cryptoFactory);
    const signedBody = await jwsToken.signAsFlattenedJson(privateKey, {header}.Protect);
    //const signedBody = await jwsToken.Protect.sign(privateKey, {header});

    // Print out the resulting JWS to the console in JSON format
    console.log(JSON.stringify(signedBody));

}

makeJws();  
