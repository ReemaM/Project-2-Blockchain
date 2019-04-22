/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
//const Block = require('./Block.js');
const level = require('level');

class Block {
    constructor(data){
        // Add your Block properties
        // Example: this.hash = "";
        this.height = '';
        this.timeStamp = '';
        this.data = data;
        this.previousHash = '0x';
        this.hash = '';
    }
}

class BlockchainDb {
    constructor(dbDir) {
        this.db = level(dbDir);
    }
    getDb() {
        return this.db;
    }
    saveBlock(block) {
        let _this = this;
        let key = block.height;
        return new Promise(function(resolve, reject) {
            _this.db.put(key, JSON.stringify(block), function(err){
                if(err) {
                    reject(new Error(`Block ${key} submission failed. ${err.message}`));
                }
                resolve(block);
            })
        });
    }
    getBlock(key) {
        let _this = this;
        return new Promise(function(resolve, reject) {
            _this.db.get(key, function(err, value) {
                if(err) {
                    reject(new Error(`Can not get Block at key = ${key}. ${err.message}`));
                } else {
                    resolve(JSON.parse(value));
                }
            });
        });
    }
    getChainLength() {
        let _this = this;
        return new Promise(function(resolve, reject){
            let length = 0;
            _this.db.createReadStream({ keys: true, values: false })
                .on('data', function (data) {
                    length++;
                })
                .on('error', function(err) {
                    reject(new Error(`Error in DB Read Stream. ${err.message}`));
                })
                .on('close', function(){
                    resolve(length);
                });
        });
    }
    isEmpty() {
        let _this = this;
        return new Promise(function (resolve, reject) {
            let length = _this.getChainLength();
            length.then(result => {
                if(result === 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }).catch(err => {
                reject(new Error(`Can not determine, if DB is empty. ${err.message}`));
            });
        });
    }
};

let objBlock = new BlockchainDb();

class Blockchain {

    //let objBlock = new BlockchainDb();

     constructor() {
        this.bd = new LevelSandbox.LevelSandbox();
        this.generateGenesisBlock();
    }

    // Helper method to create a Genesis Block (always with height= 0)
    // You have to options, because the method will always execute when you create your blockchain
    // you will need to set this up statically or instead you can verify if the height !== 0 then you
    // will not create the genesis block


   generateGenesisBlock(){
        // Add your code here
        return new Block("First block in the chain - Genesis block");
    }

    // Get block height, it is a helper method that return the height of the blockchain
    getBlockHeight() {
        let _this = this;
        return new Promise((resolve, reject) => {
            _this.objBlock.getChainLength().then(currentLength => {
                resolve(currentLength);
            }).catch(err => {
                reject(new Error(`${err.message}`));
            });
        });
    }

    // Add new block
    addBlock(block) {
        let this1 = this;
        return new Promise((resolve, reject) => {
            block.time = new Date().getTime().toString().slice(0,-3);
            this1.objBlock.getChainLength().then(chainLength => {
                block.height = chainLength;
                if(chainLength === 0) {
                    return new Promise((resolve, reject) => {
                        console.log("chain length = 0, return null instead of block");
                        resolve(null);
                    });
                } else {
                    console.log(`chain length is ${chainLength}, return previous block`);
                    return _this.objBlock.getBlock(chainLength - 1);
                }
            }).then(previousBlock => {
                if(previousBlock === null) {
                    block.previousBlockHash = "";
                } else {
                    block.previousBlockHash = previousBlock.hash;
                }
                block.hash = SHA256(JSON.stringify(block)).toString();
                return _this.objBlock.saveBlock(block);
            }).then(saveOperationResult => {
                console.log("block saved");
                resolve(saveOperationResult);
            }).catch(err => {
                reject(new Error(`${err.message}`));
            });
        });
    }

    // Get Block By Height
    getBlock(height) {
        return new Promise((resolve, reject) => {
            this.objBlock.getBlock(height).then(block => {
                resolve(block);
            }).catch(err => {
                reject(new Error(`${err.message}`));
        });
    });
    }


    // Validate if Block is being tampered by Block Height
    validateBlock(height) {
        let this1 = this;
        return new Promise(function(resolve, reject){
            this1.objBlock.getBlock(height).then(block => {
                let blockHash = block.hash;
                block.hash = '';
                let validBlockHash = SHA256(JSON.stringify(block)).toString();
                if (validBlockHash === blockHash) {
                    resolve(true);
                } else {
                    reject(new Error('Block #'+height+' invalid hash:\n'+blockHash+'<>'+validBlockHash));
                }
            });
        });
    }

    // Validate Blockchain
    validateChain() {
        let errors = [];
        let this1 = this;
        return new Promise((resolve, reject) => {
            this1.objBlock.getChainLength()
            .then(currentLength => {
                let allBlockValidations = [];
                for(let i = 0; i < currentLength; i++) {
                    allBlockValidations.push(
                        _this.validateBlock(i)
                        .catch(err => {
                            errors.push(err);
                        })
                        );
                }
                return Promise.all(allBlockValidations);
            })
            .then(value => {
                if(errors.length > 0) {
                    reject(errors);
                } else {
                    resolve(true);
                }
            })
            .catch(err => {
                reject(err);
            });
        });
    }

    // Utility Method to Tamper a Block for Test Validation
    // This method is for testing purpose
    _modifyBlock(height, block) {
        let self = this;
        return new Promise( (resolve, reject) => {
            self.bd.addLevelDBData(height, JSON.stringify(block).toString()).then((blockModified) => {
                resolve(blockModified);
            }).catch((err) => { console.log(err); reject(err)});
        });
    }
}

module.exports.Blockchain = Blockchain;
