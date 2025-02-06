import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom"
import { ethers } from "ethers";
import { useSDK } from "@metamask/sdk-react";
import { useSDK as thirdWEBSDK } from "@thirdweb-dev/react";

import { useNavigate } from "react-router-dom";
import { useConnectedWallets, useActiveAccount, useActiveWallet, TransactionButton, useSendTransaction, useSendAndConfirmTransaction } from "thirdweb/react";
import { getWalletBalance, injectedProvider } from "thirdweb/wallets";

import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { estimateGasCost, getContract, prepareContractCall, prepareTransaction, toWei } from "thirdweb";
import { toast } from 'react-toastify';

// import global from "global";
// import WalletConnectProvider from "@walletconnect/web3-provider";


export const TransactionModal = ({ address, tAmount, currency, verifyWalletAddress, metaMaskProvider, trustWalletProvider, client, chain }) => {
    const activeAccount = useActiveAccount();
    const wallet = useActiveWallet();

    const [transactionHash, setTransactionHash] = useState(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    // const [amount, setAmount] = useState(tAmount);
    // const [token, setToken] = useState(0);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [errorMessage, setErrorMessage] = useState(0);
    const [txSuccess, setTxSuccess] = useState(false);

    const { sdk, connected, provider } = useSDK();

    const closeBtn = useRef(null);


    const providerCheck = ethers5Adapter.provider.toEthers({
        client,
        chain: chain,
    });





    const sendTransaction = async (event) => {
        debugger
        console.log(activeAccount)
        console.log(wallet)
        if (currency === "USDT" || currency === "USDC") {

            handleTransfer(currency);
            return
        }

        if (!provider) {
            toast.error("MetaMask provider is not available. Please connect your wallet.");
            return;
        }
        // Check if wallet is connected
        if (!connected) {
            try {
                await sdk.connect();
            } catch (error) {
                console.error("Failed to connect to MetaMask", error);
                return;
            }
        }

        if (!address) {
            toast.error("Please connect your wallet first.");
            return;
        }
        if (!name || !email) {
            toast.error("Please enter all required fields.");
            return;
        }

        // console.log(window.ethereum.request())

        // let provider;

        // // Set up provider depending on whether MetaMask or WalletConnect is available
        // if (typeof window.ethereum !== "undefined") {
        //   // Web3 provider exists (MetaMask or other browser extensions)
        //   provider = new ethers.providers.Web3Provider(window.ethereum);
        // } else {
        //   // Fallback to WalletConnect
        //   const wcProvider = new WalletConnectProvider({
        //     infuraId: "223131ba87834950b982135c0e236c26", // Replace with your Infura project ID
        //   });

        //   try {
        //     // Enable WalletConnect provider
        //     await wcProvider.enable();
        //     provider = new ethers.providers.Web3Provider(wcProvider);
        //   } catch (error) {
        //     console.error("Failed to connect to WalletConnect", error);
        //     return;
        //   }
        // }

        // window.ethereum.enable().then(provider = new ethers.providers.Web3Provider(window.ethereum));

        const provider1 = new ethers.providers.Web3Provider(provider);
        const signer = provider1.getSigner();

        const formattedAmount = Number(tAmount).toFixed(18);
        const usdtcAmount = Number(tAmount);
        let transaction;
        const recipient = "0x6f76231fc960f32a8edda5f156d3e0d863610ffe";
        if (currency === "ETH" || currency === "BNB") {
            // For Ethereum (ETH) and Binance (BNB) transaction
            transaction = {
                to: recipient,
                value: ethers.utils.parseEther(formattedAmount.toString()), // Amount in ETH
            };
        } else {
            // For USDT or USDC on BSC, you will need to use the ERC20 transfer method
            const tokenAddress = currency === "USDT"
                ? "0x55d398326f99059ff775485246999027b3197955"
                : "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d";
            // console.log(currency);
            const tokenABI = [
                "function transfer(address to, uint amount) returns (bool)"
            ];
            const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
            const tokenAmount = ethers.utils.parseUnits(usdtcAmount.toString())
            console.log("Attempting token transfer:", tokenAmount.toString());
            const gasLimit = 21000; // Adjust as needed
            const gasPrice = ethers.utils.parseUnits("6", "gwei");
            transaction = await tokenContract.transfer(recipient, tokenAmount);
        }

        try {
            // Example transaction (Sending 0.01 ETH)
            const tx = await signer.sendTransaction(transaction);

            console.log("Transaction Hash:", tx.hash);
            setTransactionHash(tx.hash);
            // setAmount(formattedAmount);
            // setToken(10000);
            if (tx.hash) {
                alert("Transaction Successfull");
                sendToBackend(tx.hash);
            }
        } catch (error) {
            const balance = await signer.getBalance();
            const tBalance = ethers.utils.formatEther(balance);
            setCurrentBalance(tBalance);


            let errorMessage = `Transaction failed. Current balance: ${currentBalance} ${currency}\n`;

            if (error?.data?.message) {
                errorMessage += `Error message: ${error.data.message}`;
            } else if (error?.message) {
                errorMessage += `Error message: ${error.message}`;
            } else {
                errorMessage += "Unknown error occurred.";
            }

            setErrorMessage(errorMessage); // Store the error message
            console.log("check error", errorMessage);
            showModal(); // Programmatically show the modal
        }
    };

    const ERC20_ABI = [
        "function balanceOf(address owner) view returns (uint256)"
    ];

    const getTokenBalance = async (provider, tokenAddress, accountAddress) => {

        try {
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

            const balance = await tokenContract.balanceOf(accountAddress);

            const formattedBalance = ethers.utils.formatUnits(balance, 18);
            return formattedBalance;
        } catch (error) {
            console.error("Error fetching token balance:", error);
            return null;
        }
    };


    const handleTransfer = async (currency) => {
        debugger;
        try {
            const recipient = "0x6f76231fc960f32a8edda5f156d3e0d863610ffe";
            if (!activeAccount) {
                alert("Please connect your wallet.");
                return;
            }
            let tokenAddress, tokenABI;
            let amount = Number(tAmount);
            if (currency === "USDT") {
                tokenAddress = "0x55d398326f99059ff775485246999027b3197955";
                tokenABI = ["function transfer(address to, uint256 amount) public returns (bool)"];
            } else {
                tokenAddress = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d";
                tokenABI = ["function transfer(address to, uint256 amount) public returns (bool)"];
            }

            // let checkForWallet = wallet.id === "com.trustwallet.app" ? trustWalletProvider : metaMaskProvider;
            const trustWalletProvide = injectedProvider(wallet.id);


            let checkForWallet = providerCheck;


            const provider = new ethers.providers.Web3Provider(checkForWallet);
            const signer = provider.getSigner();

            const address = await signer.getAddress();

            // Get the balance of the wallet in ETH
            const balance = await provider.getBalance(address);
            console.log("Wallet Balance :", ethers.utils.formatEther(balance));

            if (balance.isZero()) {
                alert("Insufficient balance to cover gas fees.");
                return;
            }

            //    const tokenBlnc = await  getTokenBalance(provider,tokenAddress , address);

            //    console.log("check token balance:" , tokenBlnc);

            const contract = new ethers.Contract(tokenAddress, tokenABI, signer);
            const parsedAmount = ethers.utils.parseUnits(amount.toString(), 18);

            console.log(`Parsed ${currency} Amount to Send (Decimal):`, parsedAmount.toString());

            // Estimate gas
            const gasEstimate = await contract.estimateGas.transfer(recipient, parsedAmount);
            const gasPrice = await provider.getGasPrice();
            const gasCost = gasEstimate.mul(gasPrice);

            if (balance.lt(gasCost)) {
                alert("Insufficient balance to cover gas fees.");
                return;
            }

            const transaction = await contract.transfer(recipient, parsedAmount);
            setTransactionHash(transaction.hash);
            await transaction.wait();

            if (transaction.hash) {
                alert("Transaction Successful");
                sendToBackend(transaction.hash);
            }
            alert(`Transaction Successful! Hash: ${transaction.hash}`);
        } catch (err) {
            alert(JSON.stringify(err))

            console.error("Transaction failed:", err);
        }
    };
    const sendToBackend = async (txHash) => {
        const formattedAmount = Number(tAmount).toFixed(18);
        const token = 10000;
        const jsonData = {
            wallet_address: address,
            name: name,
            email: email,
            currency: currency,
            tx_hash: txHash,
            amount: tAmount,
            allocated_tokens: token,
            referrer_id: readRefLink(),
        };

        console.log("sendToBackend", jsonData);

        const MAX_RETRIES = 5; // Maximum retries
        const INITIAL_DELAY = 1000; // Initial delay in ms (1 second)
        let attempts = 0;

        while (attempts < MAX_RETRIES) {
            try {
                if (!navigator.onLine) {
                    throw new Error("Network disconnected. Please check your connection.");
                }

                const response = await fetch('/api/transactions', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(jsonData),
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // alert("Transaction saved successfully on the backend!");
                    toast.success("Transaction saved successfully on the backend!");
                    sessionStorage.setItem('walletAddress', address);
                    verifyWalletAddress(address);
                    return; // Exit the function after success
                } else {
                    console.error("API call failed:", result);
                    throw new Error(result.message || "API error");
                }
            } catch (error) {
                attempts++;
                const delay = INITIAL_DELAY * Math.pow(2, attempts); // Exponential backoff

                console.error(
                    `Attempt ${attempts} failed: ${error.message || error}. Retrying in ${delay / 1000} seconds...`
                );

                if (attempts === MAX_RETRIES) {
                    toast.error(
                        "Failed to save transaction after multiple attempts. Please check your network and try again later."
                    );
                    return;
                }

                // Wait before retrying
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    };

    // const sendToBackend = async (txHash) => {
    //     // Send the data to the backend API
    //     const formattedAmount = Number(tAmount).toFixed(18);
    //     const token = 10000;
    //     const jsonData = {
    //         wallet_address: address,
    //         name: name,
    //         email: email,
    //         currency: currency,
    //         tx_hash: txHash,
    //         amount: tAmount,
    //         allocated_tokens: token,
    //         referrer_id:readRefLink()
    //     };
    //     console.log("sendToBackend", jsonData);
    //     try {
    //         const response = await fetch('/api/transactions', {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify(jsonData),
    //         });

    //         const result = await response.json();
    //         if (result.success) {
    //             alert("Transaction saved successfully on the backend!");
    //             sessionStorage.setItem('walletAddress', address);
    //             verifyWalletAddress(address);
    //         } else {
    //             alert("Failed to save transaction on backend.");
    //         }
    //     } catch (error) {
    //         console.error("Error sending data to backend:", error);
    //         alert("Error sending data to backend:", JSON.stringify(error));
    //     }
    // };
    const showModal = () => {
        const modalElement = new window.bootstrap.Modal(document.getElementById("errorModal"));
        modalElement.show();
    };

    const readRefLink = () => {
        const urlParams = new URLSearchParams(window.location.search);

        const referrerId = urlParams.get('ref');

        let cookieId = getCookie("referrer_id");

        if (referrerId) {
            return referrerId
        } else if (cookieId) {
            return cookieId
        } else {
            ""
        }
    }

    const getCookie = (name) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) return match[2];
        return null;
    };
    const { mutate: sendTx, data: transactionResult } = useSendAndConfirmTransaction();
    // const { mutate: sendTx, data: transactionResult , isSuccess , error , status } =    useSendTransaction({
    //     payModal: {
    //       buyWithFiat: false,
    //       buyWithCrypto:false
    //     },
    //   });

    useEffect(() => {
        console.log(transactionResult)
        if (transactionResult?.transactionHash && !txSuccess) {
            toast.success("Transaction Successful");
            closeBtn?.current?.click()
            sendToBackend(transactionResult?.transactionHash);
            // alert(`Transaction Successful! Hash: ${transactionResult?.transactionHash}`);
            setTxSuccess(true);
        }
    }, [transactionResult]);

    // useEffect(() => {
    //     console.log("isSuccess")
    //     console.log(isSuccess)
    //     console.log("error")
    //     console.log(error)
    //     console.log("status")
    //     console.log(status)
    // }, [isSuccess , error , status]);

    const onClick = async () => {
        debugger
        setTxSuccess(false);
        const recipient = "0x6f76231fc960f32a8edda5f156d3e0d863610ffe";

        try {
            if (!name) {
                toast.error("Please Enter Name");
                return
            }
            if (!email) {
                toast.error("Please Enter Email");
                return
            }
            let tokenAddress;
            let amount = Number(tAmount);
            if (currency === "USDT") {
                tokenAddress = "0x55d398326f99059ff775485246999027b3197955";
            } else if (currency === "USDC") {
                tokenAddress = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d";
            } else {
                tokenAddress = "";
            }

            const parsedAmount = ethers.utils.parseUnits(tAmount.toString(), 18);

            console.log(`Parsed ${currency} Amount to Send (Decimal):`, parsedAmount.toString());

            const balance = await getWalletBalance({
                address: activeAccount.address,
                client,
                chain,
                tokenAddress,
            });

            console.log(balance)
            let transaction = null;
            if (currency === "ETH" || currency === "BNB") {
                transaction = prepareTransaction({
                    to: recipient,
                    value: ethers.utils.parseUnits(tAmount.toFixed(6), 6),
                    // value: parsedAmount,
                    chain: chain,
                    client: client,
                });
            } else {

                if (parseFloat(balance.displayValue) < tAmount) {
                    toast.error("You have insufficient balance.")
                    return false
                }

                const contract = getContract({
                    address: tokenAddress,
                    chain: chain,
                    client,
                });

                //   const amount = tAmount.toFixed(18) * 1000;

                transaction = prepareContractCall({
                    contract,
                    method: "function transfer(address to, uint256 amount) public returns (bool)",
                    // params: [recipient,  ethers.utils.parseUnits(amount.toString(), 14)],
                    params: [recipient, toWei(tAmount.toString())],
                });
            }


            // sendTx(transaction);
            const result = await sendTx(transaction)
            if (result && result.transactionHash) {
                alert("Transaction is complete!")
                toast.success("Transaction Successful")
                closeBtn?.current?.click()
                sendToBackend(result.transactionHash)
                setTxSuccess(true)
            } else {
                alert("Transaction was sent, but we couldn't confirm its completion. Please check your wallet for details.")
            }



            // if (balance.displayValue === "0") {
            //     alert("Insufficient balance to cover both the transaction amount and gas fees.");
            //     return;
            // }
        } catch (err) {
            toast.error(JSON.stringify(err))

            console.error("Transaction failed:", err);
        }



    };
    return createPortal(
        <>
            {address ? (
                <div className="modal fade" id="seedRoundModal" tabIndex="-1" aria-labelledby="seedRoundModalLabel" aria-hidden="true"  >
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="seedRoundModalLabel">Seed Round Whitelist</h5>
                                <button type="button" ref={closeBtn} className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <form>
                                    <p>Thank you for your interest in AMFI Project! Please fill out the form below to apply for our seed round whitelist. By participating in seedround you are expressing your intent to purchase AMFI token at an early stage, subject to approval.</p>
                                    <div className="form-group">
                                        <label>Name: </label>
                                        <input className="form-control" type="text" onChange={(e) => setName(e.target.value)} placeholder="Enter your name" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Email: </label>
                                        <input className="form-control" type="email" onChange={(e) => setEmail(e.target.value)} placeholder="info@amfi.com" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Are you an accredited investor? </label>
                                        <select className="form-control" name="question" id="question" required>
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                        </select>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" value="" id="term&cond" required />
                                        <label className="form-check-label" htmlFor="term&cond">
                                            Do you agree that token purchase in the seed round will be claimed after presale ends?
                                        </label>
                                    </div>
                                    <br />
                                    <div>

                                        <p>Wallet Address: {address}</p>
                                        <p>curr: {tAmount}</p>
                                        {/* <button type="button" className="btn btn-primary" onClick={sendTransaction}>Submit & Pay</button> */}
                                        <button type="button" className="btn btn-primary" onClick={onClick}>Submit & Pay</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="modal fade" id="seedRoundModal" tabIndex="-1" aria-labelledby="seedRoundModalLabel" aria-hidden="true"  >
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="noAddressModalLabel">No Wallet Connected</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <p>Please connect your wallet to apply for the seed round whitelist and participate in the token purchase.</p>
                                {/* <button type="button" className="btn btn-primary" onClick={connectWallet}>Connect Wallet</button> */}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="modal fade" id="errorModal" tabIndex="-1" aria-labelledby="errorModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content" style={{ wordWrap: "break-word", maxWidth: "90%", maxHeight: "80vh", overflowY: "auto", padding: "20px", scrollbarWidth: "none", scrollbarColor: "#6c757d #f1f1f1" }}>
                        <div className="modal-header">
                            <h5 className="modal-title" id="errorModalLabel">Transaction Error</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={() => setErrorMessage('')}><span aria-hidden="true">&times;</span></button>
                        </div>
                        <div className="modal-body">
                            {/* Display the error message */}
                            <p style={{ whiteSpace: 'pre-wrap', fontSize: '13px', maxWidth: '100%' }}>{errorMessage}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
        , document.body)
}

