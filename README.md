# Create a DID on ION

This page aims to provide a step-by-step instruction to create a [DID](https://w3c.github.io/did-core/) on [ION](https://github.com/decentralized-identity/ion) using the blockchain-agnostic [Sidetree](https://github.com/decentralized-identity/sidetree) protocol on top of Bitcoin.    

*Note: There are also implementations for Ethereum (DID Method [Element](https://github.com/decentralized-identity/element)) and Hyperledger Fabric (DID Method [TrustBlock](https://github.com/trustbloc/trustbloc-did-method)). The ultimate goal is to also provide instructions for each DID method.*

## Contribute

I have gathered this information to gain a better understanding of ION and DIDs in general. As of June 2020 I run a permanent bitcoin and IPFS node:    
```bash
$ curl http://localhost:3000/version
[{"name":"core","version":"0.9.1"},{"name":"bitcoin","version":"0.9.1"},{"name":"ipfs","version":"0.9.1"}]
``` 

For a project I want to create a few hundred DIDs (example [DID Document](did.json)) on the Bitcon Mainnet but so far I'm still stuck with resolving the example DID at the end of the [ION Installation Guide](https://github.com/decentralized-identity/ion/blob/master/install-guide.md).    

Please don't hesitate contact me with any questions and corrections! I will do my best to keep this page up to date and factor in any feedback.

## Prerequisites

* ION Client
    Setup ION client v0.9.1 as described here: [ION Installation Guide](https://github.com/decentralized-identity/ion/blob/master/install-guide.md)    
    Configuration files:

    <details>
      <summary>
        <code>bitcoin.conf</code>
      </summary>


      testnet=1
      server=1
      datadir=/path/to/data
      rpcuser=[RPC-USER]
      rpcpassword=[RPC-PWD]
      txindex=1
    

    *Notes:*    

    * the `rpcuser` and `rpcpassword` is shown when you setup Bitcoin Core    
    * make sure to have `txindex=1` included otherwise you get weird error messages!

    </details>

    <details>
      <summary>
        <code>json/testnet-bitcoin-config.json</code>
      </summary>

        {
          "bitcoinFeeSpendingCutoffPeriodInBlocks": 1,
          "bitcoinFeeSpendingCutoff": 0.001,
          "bitcoinPeerUri": "http://localhost:18332",
          "bitcoinRpcUsername": "[RPC-USER]",
          "bitcoinRpcPassword": "[RPC-PWD]",
          "bitcoinWalletOrImportString": "[WALLET-PRIVATE-KEY]",
          "databaseName": "ion-testnet-bitcoin",
          "genesisBlockNumber": 1764000,
          "mongoDbConnectionString": "mongodb://localhost:27017/",
          "port": 3002,
          "sidetreeTransactionFeeMarkupPercentage": 1,
          "sidetreeTransactionPrefix": "ion:",
          "valueTimeLockAmountInBitcoins": 0
        }

    *Note:*    

    * the `bitcoinRpcUsername` and `bitcoinRpcPassword` is shown when you setup Bitcoin Core    
    * to generate a new wallet run `bitcoin-cli getnewaddress ""` and the output is `<wallet_public_key>`; to generate `[WALLET-PRIVATE-KEY]` run `bitcoin-cli dumpprivkey <wallet_public_key>`    
    </details>


    <details>
      <summary>
        <code>json/testnet-core-config.json</code>
      </summary>

        {
          "batchingIntervalInSeconds": 600,
          "blockchainServiceUri": "http://127.0.0.1:3002",
          "contentAddressableStoreServiceUri": "http://127.0.0.1:3003",
          "databaseName": "ion-testnet-core",
          "didMethodName": "ion:test",
          "maxConcurrentDownloads": 20,
          "mongoDbConnectionString": "mongodb://localhost:27017/",
          "observingIntervalInSeconds": 60,
          "port": 3000
        }

    </details>


* the example here uses the Bitcoin Testnet3 and I made sure to have a configured wallet with some testnet Bitcoins    
    ```bash
    $ ./bitcoin-cli getwalletinfo
    {
      "walletname": "",
      "walletversion": 169900,
      "balance": 0.21609710,
      "unconfirmed_balance": 0.00000000,
      "immature_balance": 0.00000000,
      "txcount": 2,
      "keypoololdest": 1585431000,
      "keypoolsize": 999,
      "keypoolsize_hd_internal": 1000,
      "paytxfee": 0.00000000,
      "hdseedid": "430960395e7a90aaf1dda3fa6f91a6743a313061",
      "private_keys_enabled": true
    }
    ```
    *Note:* I got the following error when creating a DID for the first time (ION v0.5):    
    ```
    Low balance (0 days remaining), please fund your wallet. Amount: >=16128000 satoshis, Address: xyz
  Error: Not enough satoshis to broadcast. Failed to broadcast anchor string EiAQ8Su_nCfE7gApS19Wpob4I2vlC81D3deMSH5yydn1MQ
      at BitcoinProcessor.<anonymous> (/home/user/ion/node_modules/@decentralized-identity/sidetree/dist/lib/bitcoin/BitcoinProcessor.js:213:31)
      at Generator.next (<anonymous>)
      at fulfilled (/home/user/ion/node_modules/@decentralized-identity/sidetree/dist/lib/bitcoin/BitcoinProcessor.js:4:58)
      at process._tickCallback (internal/process/next_tick.js:68:7)
    ```    
    Therefore, I used the following command to transfer the Testnet3 Bitcoins to the stated address:    
    ```bash
    ./bitcoin-cli -testnet -rpcuser=admin -rpcpassword=abc sendtoaddress xyz 0.215
    ```

<!---
* I use Ruby for creating any dynamic fields and require the gems `base64`, `digest`, and `multihashes`        
    ```bash
    $ ruby -v
    ruby 2.5.7p206 (2019-10-01 revision 67816) [x86_64-darwin19]
    $ gem install multihashes
    ```    
    *Verify:* create a [Multihash](https://multiformats.io/multihash/)    
    ```bash
    $ echo "1" | ruby -e 'require "base64"; require "multihashes"; require "digest"; puts Base64.strict_encode64(Multihashes.encode(Digest::SHA256.digest(ARGF.read), "sha2-256")).gsub("=","")'
    ```
--->

## Creating a DID Document

The [Sidetree Protocol Specification](https://github.com/decentralized-identity/sidetree/blob/master/docs/protocol.md#create-operation-request-body-schema) describes the structure of a valid DID Document:    

```json
{
    "type": "create",
    "suffixData": {
        "patchDataHash": "Hash of the patch data.",
        "recoveryKey": "A SECP256K1 public key expressed in compressed JWK format.",
        "nextRecoveryCommitmentHash": "Commitment hash for the next recovery."
    },
    "patchData": {
        "patches": [
            {
                "action": "replace",
                "document": {
                    "publicKeys": [
                        {
                            "id": "A string no longer than 20 characters.",
                            "type": "Secp256k1VerificationKey2019 | EcdsaSecp256k1VerificationKey2019 | JwsVerificationKey2020",
                            "jwk": "Must be JWK format.",
                            "usage": "must be an array containing one or more of the 3 usage types: ops, general, or auth"
                        }
                    ],
                    "serviceEndpoints": [
                        {
                            "id": "A string no longer than 20 characters.",
                            "type": "A string no longer than 30 characters.",
                            "serviceEndpoint": "URIs beginning with a scheme segment (i.e. http://, git://), and be no longer than 80 characters."
                        }
                    ]
                }
            }
        ],
        "nextUpdateCommitmentHash": "Commitment hash to for the next update.",
    }          
}
```    

However, through tests and reading various online sources I found that for a DID registration request a [JSON Web Signature in JSON serialization format](https://tools.ietf.org/html/rfc7515) must be used. The payload has the following format:

```json
{
    "@context": "https://w3id.org/did/v1",
    "publicKey": [{
        "id": "string",
        "type": "Secp256k1VerificationKey2018",
        "publicKeyJwk": { "..."},
        "usage": "signing"
    }, {
        "id": "string",
        "type": "Secp256k1VerificationKey2018",
        "publicKeyJwk": { "..."},
        "usage": "recovery"
    }],
    "service": [{
        "id": "PersonalInfo",
        "type": "AgentService",
        "serviceEndpoint": {
            "@context": "schema.identity.foundation/hub",
            "@type": "UserServiceEndpoint",
            "instance": ["URL"]
        }
    }]
}
```

The request has finally the following format:   
```json
{
    "payload":"<base64 encoded from above>",
    "signature":"<payload signed with your private key>",
    "protected":"<base64 encoded header attributes>"
}
```

Here now the steps to create the documents:
To create such a document use the following 2 helper functions: [generate-keys.js](generate-keys.js) and [make-jws.js](make-jws.js)    

1. Install Prerequisites    
    There are node.js libraries available to create keys and perform the signing. Here my setup and installing the required package.
    ```bash
    $ node -v
    v10.19.0
    $ npm -v
    6.13.4
    $ npm install @decentralized-identity/did-auth-jose
    ``` 

2. Generate Key Pairs    
    Generate your keys as a JSON Web Key (JWK) file using the [did-auth-jose library](https://www.npmjs.com/package/@decentralized-identity/did-auth-jose) and [generate-keys.js](generate-keys.js):    
    ```bash
    $ node generate-keys.js
    ```

3. Create JWS
    For the JSON Web Signature in JSON serialization format another javascript is available that merges the previously generated public key (`./public.jwk`) information with an array of service endpoints ([did_service.json](did_service.json)), signs the payload with private key (`./private.jwk`) and adds the header information:   
    ```bash
    $ cat did_service.json | node make-jws.js > did_jws.json
    ```    

## Write DID Document
Use the following command to write the DID Document:    

```bash    
$ cat did_jws.json | curl -X POST -d @- -H 'Content-Type: application/json' http://localhost:3000
```    

Response:
```
{
  "@context": "https://w3id.org/did/v1",
  "publicKey": [{
    "id": "#key-1",
    "type": "Secp256k1VerificationKey2018",
    "publicKeyJwk": {
      "kty": "EC",
      "kid": "#key-1",
      "crv": "P-256K",
      "x": "j23-trviZytibbYLKND7YR8CYwUAFMYS9PNAaqdSI3k",
      "y": "c7oo1QLOczTP7jbMwmdE9nr64TkuIJTfRuhYYWaKVdQ",
      "use": "verify",
      "defaultEncryptionAlgorithm": "none",
      "defaultSignAlgorithm": "ES256K"
    },
    "usage": "signing"
  }, {
    "id": "#key-1",
    "type": "Secp256k1VerificationKey2018",
    "publicKeyJwk": {
      "kty": "EC",
      "kid": "#key-1",
      "crv": "P-256K",
      "x": "j23-trviZytibbYLKND7YR8CYwUAFMYS9PNAaqdSI3k",
      "y": "c7oo1QLOczTP7jbMwmdE9nr64TkuIJTfRuhYYWaKVdQ",
      "use": "verify",
      "defaultEncryptionAlgorithm": "none",
      "defaultSignAlgorithm": "ES256K"
    },
    "usage": "recovery"
  }],
  "service": [{
    "id": "PersonalInfo",
    "type": "AgentService",
    "serviceEndpoint": {
      "@context": "schema.identity.foundation/hub",
      "@type": "UserServiceEndpoint",
      "instance": ["https://data-vault.eu/api/personal_info"]
    }
  }],
  "id": "did:ion:test:EiANCLg1uCmxUR4IUkpW8Y5_nuuXLbAEwonQd4q8pflTnw"
}
```

You should see on the console running `npm run core` the following output:    
```
Operation type: 'create', DID unique suffix: 'EiANCLg1uCmxUR4IUkpW8Y5_nuuXLbAEwonQd4q8pflTnw'
```

Afterwards it takes some time until the DID registration is processed (can take up to 30min).    
However, when you try to resolve it    
```bash
$ curl http://localhost:3000/did:ion:test:EiANCLg1uCmxUR4IUkpW8Y5_nuuXLbAEwonQd4q8pflTnw
```    
returns status 404 - not found and the Sidetree core service provides the output:    
```
Handling resolution request for: did:ion:test:EiANCLg1uCmxUR4IUkpW8Y5_nuuXLbAEwonQd4q8pflTnw...
Resolving DID unique suffix 'EiANCLg1uCmxUR4IUkpW8Y5_nuuXLbAEwonQd4q8pflTnw'...
Ignored invalid operation for DID 'EiANCLg1uCmxUR4IUkpW8Y5_nuuXLbAEwonQd4q8pflTnw' in transaction '7311022180270081' at time '1702230' at operation index 0.
```    

