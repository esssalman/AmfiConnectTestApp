import React, { useState, useEffect } from "react";
import { createThirdwebClient, defineChain } from "thirdweb";
import { ThirdwebProvider, ConnectButton, ConnectEmbed, darkTheme, useNetworkSwitcherModal } from "thirdweb/react";
// import { sepolia, lineaSepolia  } from "thirdweb/chains"
// import { polygon } from "thirdweb/chains"
import { ethereum, bsc, polygon } from "thirdweb/chains"
import { createWallet, injectedProvider, inAppWallet } from "thirdweb/wallets";
import { TransactionModal } from './TransactionModal'
import { MetaMaskProvider } from "@metamask/sdk-react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { SassColor } from "sass";
import ReferralModal from "./referralLink";
import Countdown from "react-countdown";
import { ToastContainer, toast } from 'react-toastify';
import { createPortal } from 'react-dom';

// Initialize Thirdweb Client with your client ID
const client = createThirdwebClient({
    clientId: "6e3341558f26a47c34200697879915fb", // Replace with your actual Thirdweb client ID
});

// List of wallets you want to support
const wallets = [
    // inAppWallet(),
    createWallet("io.metamask"), // MetaMask
    createWallet("com.trustwallet.app"),
    createWallet("me.rainbow"), // Rainbow Wallet
    createWallet("com.coinbase.wallet"), // Coinbase Wallet
    createWallet("io.zerion.wallet"), // Zerion Wallet
];

//Get live rates of currencies
const getLiveRates = async (currency) => {
    try {
        const response = await fetch(`/api/crypto-price/${currency}`);
        const data = await response.json();
        console.log("data", data.data[currency].quote.USD.price);
        return data.data[currency].quote.USD.price; // Extract price from the response
    } catch (error) {
        console.error("Error fetching live rates:", error);
        return null;
    }
};

// const defaultChain = defineChain(56)

const defaultChain = defineChain({
    id: 56,  // Binance Smart Chain (BSC) Mainnet
    rpc: "https://bsc-dataseed.bnbchain.org"
});
// const defaultChain = defineChain({
//     // id: 11155111
//     id: 56
// })


const allChanis = {
    ETH: 1,
    BNB: 56,
    USDT: 56,
    USDC: 56,
}

const setCookie = (name, value, days) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

export function WalletConnection() {
    const [currency, setCurrency] = useState("")
    const [chainObject, setChainObject] = useState(defaultChain)
    const [address, setAddress] = useState(null); // For storing the connected wallet address
    const [loading, setLoading] = useState(false);
    const [transactionAmount, setTransactionAmount] = useState(null); // Example amount (can be dynamic)
    const [networkChain, setNetworkChain] = useState("ethereum"); // Default network is Ethereum
    const [walAddress, setWalAddress] = useState(null);
    const [metaMaskProvider, setMetaMaskProvider] = useState(null)
    const [trustWalletProvider, setTrustWalletProvider] = useState(null)
    const [referral_link, setReferral_link] = useState("");
    const [isReferral_active, setIsReferral_active] = useState(false);



    useEffect(() => {
        window.addEventListener("eip6963:announceProvider", (event) => {
            const provider = event.detail.provider

            if (provider.isMetaMask) {
                console.log("metamask Provider");
                setMetaMaskProvider(provider)
            }

            if (provider.isTrust) {
                console.log("trustWallet Provider");
                setTrustWalletProvider(provider)
            }
        })

        window.dispatchEvent(new Event("eip6963:requestProvider"))
        ReadRefFromLink();

    }, [])


    const ReadRefFromLink = () => {
        debugger
        const urlParams = new URLSearchParams(window.location.search);

        const referrerId = urlParams.get('ref');

        if (referrerId) {
            setCookie('referrer_id', referrerId, 1);
        }
    }

    // Handle Wallet Connect
    const handleConnect = (walletAddress) => {
        setAddress(walletAddress?.getAccount()?.address);
        sessionStorage.setItem('walletAddress', walletAddress?.getAccount()?.address);
        // sendToBackend(walletAddress?.getAccount()?.address);
        verifyWalletAddress(walletAddress?.getAccount()?.address);
        console.log("Connected with address:", walletAddress?.getAccount()?.address);
    };

    // Handle Wallet Disconnect
    const handleDisconnect = () => {
        setWalAddress(null); // Clear the address when disconnected
        const walletAddress = sessionStorage.removeItem("walletAddress"); // Optionally clear session storage
        verifyWalletAddress(walletAddress);
        console.log("Disconnected wallet");
    };

    const handleSwitch = (walletAddress) => {
        setAddress(walletAddress?.getAccount()?.address);
        sessionStorage.setItem('walletAddress', walletAddress?.getAccount()?.address);
        // sendToBackend(walletAddress?.getAccount()?.address);
        verifyWalletAddress(walletAddress?.getAccount()?.address);
        console.log("Connected with address:", walletAddress?.getAccount()?.address);
    };


    const handleCurrencyChange = async (event) => {
        const selectedCurrency = event.target.value;
        setCurrency(selectedCurrency);

        if (selectedCurrency === "") {
            setTransactionAmount(null)
            return
        }
        let amount = null;
        if (selectedCurrency === "USDT" || selectedCurrency === "USDC") {
            setLoading(true);
            const liveRate = await getLiveRates(selectedCurrency);
            // amount = (250); // Multiply by 250 (your fixed amount)
            // amount = (0.5 / liveRate); // Multiply by 250 (your fixed amount)
            amount = (250 / liveRate);
            setTransactionAmount(amount);
            setLoading(false);
        }
        else {
            setLoading(true);
            const liveRate = await getLiveRates(selectedCurrency); // Fetch live rate for the selected currency
            amount = (250 / liveRate); // Divide by 250 (your fixed amount)
            // amount = (0.000001)
            setTransactionAmount(amount);
            setLoading(false);
        }
        // const amount = (250 / liveRate); // Multiply by 250 (your fixed amount)
        // const amount = 0.0001;
        if (selectedCurrency === "ETH") {
            setNetworkChain("ethereum");
        }
        else {
            setNetworkChain("bsc");
        }
        // const selectedCurrency = event.target.value;
        const networkChainId = allChanis[selectedCurrency]
        const currentSelectedChain = defineChain({
            id: networkChainId
        })
        console.log("networkchain id:", networkChainId);
        setChainObject(currentSelectedChain)
        // setCurrency(selectedCurrency)
        // setLoading(true);
        // // // const rate = await getLiveRates(selectedCurrency); // Fetch live rate for the selected currency
        // // // const totalCostInUSD = (5 / rate); // Multiply by 250 (your fixed amount)
        // const totalCostInUSD = (0.0001); // testing amount
        // setcurrencyCost(totalCostInUSD); // Update the input with the calculated USD cost
        // setLoading(false);
    };

    // Handle network selection manually (if needed)
    const handleNetworkChange = (event) => {
        setNetworkChain(event.target.value);
        // setChainObject(networkChain)
        const currentSelectedChain = defineChain({
            id: networkChain
        })
        console.log("network chain", networkChain);
        setChainObject(currentSelectedChain)
    };

    // const sendToBackend = async (address) => {
    //     // Send the data to the backend API
    //     const data = {
    //         wallet_address: address,
    //     };
    //     try {
    //         const response = await fetch("/api/login", {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify(data),
    //         });

    //         const result = await response.json();
    //         if (result.success) {
    //             alert("Wallet Address sent on backend");
    //         } else {
    //             alert("Failed to save transaction on backend.");
    //         }
    //     } catch (error) {
    //         console.error("Error sending data to backend:", error);
    //     }
    // };
    useEffect(() => {
        const walletAddress = sessionStorage.getItem('walletAddress');
        if (walletAddress) {
            verifyWalletAddress(walletAddress);
        } else {
            console.log('useEffect not running'); // No wallet address to verify
        }
    }, []);

    const verifyWalletAddress = async (walletAddress) => {
        try {
            const response = await fetch('/auth/verify-wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ walletAddress }),
            });
            const data = await response.json();
            if (data.success) {
                // Handle dashboard access, perhaps redirect to the dashboard or set a session
                // window.location.href = "/dashboard";
                setWalAddress(walletAddress);
                fetchReferalLink(walletAddress);
                console.log(data);
            } else {
                console.log('Wallet not found in the database connect file');
            }
        } catch (error) {
            console.error('Error verifying wallet address:', error);
        }
    };


    const [progressValue, setProgressValue] = useState(0);
    const maxValue = 2331; // You can also fetch this from the database if needed

    useEffect(() => {
        const fetchProgressValue = async () => {
            try {
                const response = await fetch('/api/progressbar'); // Replace with your API endpoint
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json(); // Assuming the response is in JSON format
                setProgressValue(data.total_transactions); // Set the value from the response
            } catch (error) {
                console.error('Error fetching progress value:', error);
            }
        };

        fetchProgressValue();
        fetchReferalLink();
    }, []);
    console.log("progess value", progressValue);


    useEffect(() => {
        if (address) {
            fetchReferalLink(address)
        }
    }, [address]);

    const fetchReferalLink = async (address) => {
        fetch(`/api/referral-link?wallet_address=${address}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok " + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    console.log("testing Referral Link:", data.referral_link);
                    setReferral_link(data.referral_link);
                    setIsReferral_active(data.is_active === 1 ? true : false);
                } else {
                    console.error("Failed to get referral link:", data.message);
                }
            })
            .catch(error => {
                console.error("Error fetching referral link:", error);
            });

    };

    const allowedWallets = [
        "0xe09fdFD7e8B4D6e9F4ba4A01cD3ff404aF2dE260",
        "0x143c5eC14522d150F4F5E1ddCA7E90BA42dbD438",
        "0x7FCC0499430D29eBc5C80a6CdE92d7011E8e236B",
        "0x633063f5A4ae1E301aFd38F9b98dd87F5BE07690",
        "0x6fC4973c04dcB1A64837c6BbF27b593DBcCcdCa6",
        "0x8934938A9514C922543Aff57761d4f5bd8e44C02",
        "0x7b08569500A235Fd1612071E561c0dfBcE540e01",
        "0xFC1f2F131a035e7493662Fd453Dc90821Ddf3bF0",
        "0xCc8a40efB5De50927f27c698dA28925E009e1BC3",
        "0xD29401b9B025b70d15556e4888aCa12149CaF5E9",
        "0x3d8435157e99828Fd96b80896E686950B34c4f6a",
        "0x19B1DF1e56F267466D7A16bD3f33394938C1A96e",
        "0xCc8a40efB5De50927f27c698dA28925E009e1BC3",
        "0x814acC647856b465D2304Fa069e5182ebbB9c92f",
        "0xC90986F390A45d1D1353c1A1a4DbB763Cd3933a3"
    ];
    return (
        <>
            {createPortal(
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={true}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable={false}
                    pauseOnHover
                    theme="dark"
                />,
                document.body
            )}

            <MetaMaskProvider
                debug={true}
                sdkOptions={{
                    dappMetadata: {
                        name: "AMFI",
                        url: window.location.href,
                    },
                    infuraAPIKey: "223131ba87834950b982135c0e236c26",
                }}
            >
                <ThirdwebProvider >
                    <link rel="stylesheet" href="/frontend/css/style.css?v=1.2" />
                    <div className="counter-down">
                        <div className="content">
                            <div className="digit-text-container">
                                <div className="d-flex justify-content-between digit-text-box">
                                    <span className="text-center digit-text">Days</span>
                                    <span className="text-center digit-text">Hours</span>
                                    <span className="text-center digit-text">Min</span>
                                    <span className="text-center digit-text">Sec</span>
                                </div>
                            </div>
                            <div className="row align-items-stretch counter-row">
                                <div className="col-md-4 counter-down-first-col">
                                    <div className="start-soon h-100 d-flex align-items-center justify-content-center">
                                        Ends in
                                    </div>
                                </div>
                                <div className="col-md-8">
                                    <div>
                                        <Countdown autoStart date={new Date('2025-02-16')} renderer={countdownRenderer} />
                                    </div>
                                </div>
                            </div>

                            <div className="counterdown-content">
                                <div className="amfi-price">
                                    <div className="live-status">
                                        <span className="live-text">Seed Round is live</span>
                                        <span className="blinking-dot"></span>
                                    </div>
                                    <div className="">Target: <strong>$582,750</strong></div>
                                    <h1 className="amfi-number-heading">1 AMFI = $0.025</h1>
                                </div>
                                <div className="position-relative">

                                    <div className="progress " style={{ height: '15px', backgroundColor: '#e9ecef', marginTop: '10px' }}>
                                        <div
                                            className="pro-bar"
                                            role="progressbar"
                                            style={{
                                                width: `${((progressValue >= 1165 ? progressValue : 1165) / maxValue) * 100}%`,
                                                "--progress-left": `${(((progressValue >= 1165 ? progressValue : 1165) / maxValue) * 100) - 2}%`,
                                                left: `${(((progressValue >= 1165 ? progressValue : 1165) / maxValue) * 100) - 2}%`
                                            }}
                                            aria-valuenow={progressValue}
                                            aria-valuemin="0"
                                            aria-valuemax={maxValue}
                                        >
                                        </div>
                                    </div>




                                    <span className="progresbarDot position-absolute d-block " style={{
                                        left: `${(((progressValue >= 1165 ? progressValue : 1165) / maxValue) * 100) - 2}%`,
                                        width: '20px',
                                        height: ' 20px',
                                        background: "#3396ed",
                                        borderRadius: "50%",
                                        zIndex: "99999",
                                        top: "-3px"

                                    }}></span>
                                </div>

                                <div className="listing">
                                    <div className="listing-text">Total Seeds:</div>
                                    <div>2,331</div>
                                    {/*<div className="listing-text">Sold:</div>*/}
                                    <div className="listing-text">Next Price:</div>
                                    <div>$0.03</div>
                                </div>
                                <div className="listing">
                                    <div className="listing-text">Seed Amount:</div>
                                    <div>$250</div>
                                    <div className="listing-text">Allocation:</div>
                                    <div>10,000 AMFI </div>
                                </div>
                                <div className="payment-cost">
                                    <div className="payment-dropdown">
                                        <label>Payment</label>
                                        <select id="payment-method" className="dropdown-select" value={currency} onChange={handleCurrencyChange}>
                                            <option value="">Select</option>
                                            {/* <option value="ETH">ETH</option> */}
                                            <option value="BNB">BNB</option>
                                            <option value="USDT">USDT</option>
                                            <option value="USDC">USDC</option>
                                        </select>
                                    </div>
                                    <div className="payment-dropdown usd-cost">
                                        <label>Network</label>
                                        <input type="text" value={(networkChain === "bsc" && currency !== "") ? "BSC (BEP20)" : "Select"} disabled />
                                        {/* <select id="payment-method" className="dropdown-select" value={networkChain} onChange={handleNetworkChange} disabled>
                                        <option>Select</option>
                                        <option value="bsc">BSC (BEP20)</option>
                                        {/* <option value="ethereum">ETH</option> */}
                                        {/* </select> */}
                                    </div>
                                    <div className="usd-cost">
                                        <label>Total </label>
                                        <input type="text" defaultValue={loading ? 'Calculating...' : transactionAmount !== null ? transactionAmount : ''} disabled />
                                    </div>

                                </div>
                                <div className="ICO-buttons mt-30" >

                                    <div className=" wow fadeInUp">
                                        <a href="#" className="dream-btn" data-bs-toggle="modal"
                                            data-bs-target="#seedRoundModal">Join Whitelist</a>
                                    </div>
                                    {/* <div className=" wow fadeInUp">
                                <a href="#" className="dream-btn">Connect Wallet</a>
                            </div> */}
                                    <div className="text-right" >
                                        <div>
                                            <ConnectButton
                                                client={client}
                                                chain={chainObject}
                                                wallets={wallets}
                                                switchButton={{
                                                    label: "Switch Network",
                                                    className: "dream-btn",
                                                }}
                                                connectButton={{
                                                    label: "Connect Wallet",
                                                    style: { fontSize: "12px" },
                                                    className: "dream-btn",
                                                }}
                                                detailsButton={{
                                                    className: "detail-btn",
                                                }}
                                                connectModal={{
                                                    size: "compact",
                                                    title: "Select Wallet to Connect",
                                                    showThirdwebBranding: false,
                                                }}
                                                onConnect={(walletData) => handleConnect(walletData)}
                                                onDisconnect={handleDisconnect}
                                                onSwitch={(walletData) => handleSwitch(walletData)}
                                            />
                                            {/* <ConnectEmbed client={client} wallets={wallets} /> */}
                                        </div>
                                    </div>
                                </div>
                                {/* <button className="btn btn-primary" onClick={loginUser}>Go to dashboard</button> */}
                            </div>
                        </div>
                    </div>
                    {walAddress ? (
                        <div className="mt-2" style={{ textAlign: 'center', display: "flex", justifyContent: "space-around" }}>
                            <a href="/dashboard" style={{ fontWeight: 'bold', fontStyle: 'italic', textDecoration: 'underline' }}>Go to Dashboard</a>
                            {referral_link && (allowedWallets.includes(walAddress) || isReferral_active === true) && <a href="javascript:;" style={{ fontWeight: 'bold', fontStyle: 'italic', textDecoration: 'underline' }} className=" d-block italic fw-bold " data-bs-toggle="modal"
                                data-bs-target="#RefferalModal">Get Referral Link</a>}
                        </div>
                    ) : ''}
                    <TransactionModal metaMaskProvider={metaMaskProvider} trustWalletProvider={trustWalletProvider} client={client} chain={defaultChain} address={address} tAmount={transactionAmount} currency={currency} verifyWalletAddress={verifyWalletAddress} />
                    <ReferralModal link={referral_link} />
                </ThirdwebProvider>
            </MetaMaskProvider>
        </>
    );
}

const countdownRenderer = ({ days, hours, minutes, seconds }) => {
    return (
        <div className="d-flex justify-content-between gap-1 h-100 counter-container">
            <div className="digit-box h-100">
                <div className="count-digit start-soon h-100">
                    {days}
                </div>
            </div>
            <div className="digit-box h-100">
                <div className="count-digit start-soon h-100">
                    {hours}
                </div>
            </div>
            <div className="digit-box h-100">
                <div className="count-digit start-soon h-100">
                    {minutes}
                </div>
            </div>
            <div className="digit-box h-100">
                <div className="count-digit start-soon h-100">
                    {seconds}
                </div>
            </div>
        </div>
    );
};