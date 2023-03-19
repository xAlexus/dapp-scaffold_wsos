
import { verify } from '@noble/ed25519';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { setRequestMeta } from 'next/dist/server/request-meta';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

import { Program, AnchorProvider, web3, utils, BN, Wallet } from "@project-serum/anchor";
import idl from "./solanapdas.json";

const idL_string = JSON.stringify(idl);
const idl_object = JSON.parse(idL_string);
const programID = new PublicKey(idl.metadata.address)



export const Bank: FC = () => {
    const ourWallet = useWallet();
    const { connection } = useConnection();

    const [banks, setBanks] = useState([]);

    const getProvider = () => {
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions());
        return provider;
    }

    const createBank = async() => {
        try {
            const anchProvider = getProvider();
            const program = new Program(idl_object, programID, anchProvider);

            const [bank, _] = await PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode("bankaccount"),
                anchProvider.wallet.publicKey.toBuffer(),
            ], program.programId)

            await program.methods.create("WSoS Bank").accounts({
              bank,
              user: anchProvider.wallet.publicKey,
              systemProgram: web3.SystemProgram.programId,
            }).rpc();

            console.log("New Bank just created" + bank.toString());
        } catch (error) {
            console.log("Error creating new Bank", error);

        }

    }
    const getBanks = async () => {
        const anchProvider = getProvider();
        const program = new Program(idl_object, programID, anchProvider);

        try {
            Promise.all((await connection.getProgramAccounts(programID)).map(async bank => ({
                ...(await program.account.bank.fetch(bank.pubkey)),
                pubkey: bank.pubkey
            }))).then(banks => {
                console.log(banks);
                setBanks(banks);
            })
        } catch (error) {
            console.log("Error while getting the banks", error);
        }

    }

    const depositBank = async (PublicKey) => {
        try {
            const anchProvider = getProvider();
            const program = new Program(idl_object, programID, anchProvider);

            await program.methods.deposit(new BN(0.1 * LAMPORTS_PER_SOL)).accounts({
                bank: PublicKey,
                user: anchProvider.wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
              }).rpc();
            console.log("Deposit done" + PublicKey);
        } catch (error) {
            console.log("Error while depositing: " + error)
        }

    }
    const withdrawBank = async (PublicKey) => {
        try {
            const anchProvider = getProvider();
            const program = new Program(idl_object, programID, anchProvider);

            await program.methods.withdraw(new BN(0.1 * LAMPORTS_PER_SOL)).accounts({
                bank: PublicKey,
                user: anchProvider.wallet.publicKey,
            }).rpc();
            console.log("Withdrawl done" + PublicKey);
        } catch (error) {
            console.log("Error while withdrawing: " + error)
        }

    }

    return (
        <>
            {banks.map((bank) => {
                return (
                    <div>
                        <h1>{bank.name.toString()}</h1>
                        <span>{bank.balance.toString()}</span>
                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={() => depositBank(bank.pubkey)}
                        >
                            Deposit 0.1 Sol
                        </button>
                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={() => withdrawBank(bank.pubkey)}
                        >
                            Withdraw 0.1 Sol
                        </button>
                    </div>
                )
            })}
            <div className="flex flex-row justify-center">
                <>
                    <div className="relative group items-center">
                        <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={createBank}
                        >
                            <span className='block group-disabled:hidden'>
                                Create Bank
                            </span>
                        </button>
                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={getBanks}
                        >
                            <span className='block group-disabled:hidden'>
                                Fetch Banks
                            </span>
                        </button>
                    </div>
                </>
            </div>
        </>
    );
};

