/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

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

module.exports.Block = Block;