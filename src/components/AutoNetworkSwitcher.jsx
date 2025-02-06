import React, { useEffect } from 'react';
import { useAddress, useNetworkSwitcherModal } from "thirdweb/react";

const AutoNetworkSwitcher = () => {
  const address = useAddress(); // Get the connected wallet address
  const network = useNetwork(); // Hook to get the network

  // Define the desired chainId
  const desiredNetwork = 56; // Mainnet (Change this to the network chain ID you want)

  useEffect(() => {
    const handleNetworkSwitch = async () => {
      if (address && network.chainId !== desiredNetwork) {
        try {
          await network.switchNetwork(desiredNetwork); // Switch network
          console.log(`Switched to network with chain ID: ${desiredNetwork}`);
        } catch (error) {
          console.error("Error switching network:", error);
        }
      }
    };

    handleNetworkSwitch();
  }, [address, network, desiredNetwork]);

  return null; // No UI, just logic
};

export default AutoNetworkSwitcher;
