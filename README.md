# Create a DID on ION

This page aims to provide a step-by-step instruction to create a [DID](https://w3c.github.io/did-core/) on [ION](https://github.com/decentralized-identity/ion).

## Contribute

I have gathered this information to gain a better understanding of ION and DIDs in general. These steps are currently not working and I ask you to contact me with any questions and corrections! I will do my best to keep this page up to date and factor in any feedback.

## Prerequisites

* ION Client
    Setup ION client v0.5 as described here: [ION Installation Guide](https://github.com/decentralized-identity/ion/blob/master/install-guide.md)    
    *Verify:* `curl http://localhost:3000/did:ion:test:EiDk2RpPVuC4wNANUTn_4YXJczjzi10zLG1XE4AjkcGOLA` returns a DID Document

    the `json/bitcoin-config.json`   
    ```json
    {
      "bitcoinPeerUri": "http://localhost:18332",
      "bitcoinRpcUsername": "admin",
      "bitcoinRpcPassword": "xxx",
      "bitcoinWalletImportString": "xxx",
      "bitcoinFee": 4000,
      "sidetreeTransactionPrefix": "ion:test:",
      "genesisBlockNumber": 1500000,
      "databaseName": "sidetree-bitcoin",
      "transactionFetchPageSize": 100,
      "mongoDbConnectionString": "mongodb://localhost:27017/",
      "port": 3002
    }
    ```
    *Note:*    

    * the `bitcoinRpcPassword` is shown when you execute the ION Installation Guide    
    * the `bitcoinWalletImportString` is shown as error message when you execute `npm run bitcoin` for the first time in the course of the ION Installation Guide

* the example here uses the Bitcoin Testnet3 and I made sure to have a configured wallet with some testnet Bitcoins    
    ```bash
    bitcoin-0.18.0/bin$ ./bitcoin-cli getwalletinfo
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

## Creating a DID Document

According to the [Sidetree Protocol Specification](https://github.com/decentralized-identity/sidetree/blob/master/docs/protocol.md#create-operation-request-body-schema) a DID Document should have the following structure:    

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

Here some auxiliary functions to create the individual attributes in the DID Document using as concrete example [`did.json`](did.json):    

* `patchDataHash`: use the following Ruby script to remove any white-space characters and calculate the multihash    
    ```bash    
    $ cat patchData.json | ruby -e 'require "base64"; require "multihashes"; require "digest"; puts Base64.strict_encode64(Multihashes.encode(Digest::SHA256.digest(ARGF.read.gsub(/\s+/,"")), "sha2-256")).gsub("=","")'
    ```    
    Output: `EiBLwuKP50apvP8s6EAAytlYBMcSGZjhfnOba+efshTiIA`
* `CommitmentHash`: I think you can use basicaly any string and create the multihash    
    ```bash
    $ echo "1" | ruby -e 'require "base64"; require "multihashes"; require "digest"; puts Base64.strict_encode64(Multihashes.encode(Digest::SHA256.digest(ARGF.read), "sha2-256")).gsub("=","")'
    ```    
    Output: `EiBDVaRrGdNI3C9XwEb472PUU467k2AA88nulUonRg3YZQ`    
* `Keys`: OPEN - I don't know how to create Public/Private Key Pairs and use as placeholder for now the public key from an example    
    Public Key: `0268ccc80007f82d49c2f2ee25a9dae856559330611f0a62356e59ec8cdb566e69`

## Writing the DID Document

Use the following command to write the DID Document:    

```bash    
$ cat did.json | ruby -e 'puts ARGF.read.gsub(/\s+/,"")' | curl -s -o /dev/null -w "%{http_code}" -X POST -d @- -H 'Content-Type: application/json' http://localhost:3000
```    

... leads to response `400` - client-side error