# Tornado-example
This project is forked from [Tornado Cash](https://tornado.cash/) with slight changes:

- built with hardhat and typescript
- circomlib is updated to 0.5.2
- snarkjs is updated to 0.5.0
- contracts are modified to match the changes of MiMCSponge Hasher and Verifier.sol generated by snarkjs

## Pre-requisites
- Install `circom` and `snarkjs` as global command-line
```
npm install -g circom
npm install -g snarkjs
```

## Usage
```
yarn
yarn build
yarn test 
or with gas report: REPORT_GAS=true yarn test
```
