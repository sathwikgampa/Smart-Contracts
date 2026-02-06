const path = require('path');
const fs = require('fs');
const solc = require('solc');

const contractPath = path.resolve(__dirname, 'Agreement.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
    language: 'Solidity',
    sources: {
        'Agreement.sol': {
            content: source,
        },
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['*'],
            },
        },
    },
};

console.log('Compiling Agreement.sol...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
    output.errors.forEach(err => {
        console.error(err.formattedMessage);
    });
    // Throw if there are errors (not just warnings)
    if (output.errors.some(err => err.severity === 'error')) {
        throw new Error('Compilation failed');
    }
}

const contract = output.contracts['Agreement.sol']['Agreement'];
const abi = contract.abi;
const bytecode = contract.evm.bytecode.object;

const jsContent = `export const AGREEMENT_ABI = ${JSON.stringify(abi, null, 2)};

// Bytecode generated automatically by compile.js
export const AGREEMENT_BYTECODE = "0x${bytecode}";
`;

fs.writeFileSync(path.resolve(__dirname, 'abis.js'), jsContent);
console.log('abis.js successfully updated with latest ABI and Bytecode!');
