import React, { useState, useEffect, useRef } from 'react';
import { Box, Stack } from '@chakra-ui/layout';
import {
  Button, Link, Badge, Flex, Image, StackDivider,  
  HStack, Heading, Center, UnorderedList, ListItem, VStack,
} from '@chakra-ui/react';
import dataStreamIcon from 'img/data-stream-icon.png';
import { ABIS } from 'EVM/ABIs';
import { useMoralis, useMoralisCloudFunction } from 'react-moralis';
import { useUser } from 'store/UserContext';
import { useChainMeta } from 'store/ChainMetaContext';
import { useNavigate } from 'react-router-dom';
import ChainSupportedComponent from 'UtilComps/ChainSupportedComponent';

export default function({ onRfMount, setMenuItem, onRefreshTokenBalance }) {
  const navigate = useNavigate();
  const { chainMeta: _chainMeta } = useChainMeta();
  const { user: _user } = useUser();
  const { user, isWeb3Enabled, Moralis: { web3Library: ethers } } = useMoralis();
  const { web3: web3Provider } = useMoralis();
  const { error: errCfTestData, isLoading: loadingCfTestData, fetch: doCfTestData, data: dataCfTestData } = useMoralisCloudFunction('loadTestData', {}, { autoFetch: false });

  const [faucetWorking, setFaucetWorking] = useState(false);
  const [learnMoreProd, setLearnMoreProg] = useState(null);
  const [txHashFaucet, setTxHashFaucet] = useState(null);
  const [txErrorFaucet, setTxErrorFaucet] = useState(null);
  const [claimsBalances, setClaimsBalances] = useState({
    claimBalanceValues: ['-1', '-1', '-1'], // -1 is loading, -2 is error
    claimBalanceDates: [0, 0, 0]
  });

  let web3Signer = useRef();
  let identityFactory = useRef();
  const [identityAddresses, setIdentityAddresses] = useState([]);
  const [txConfirmationIdentity, setTxConfirmationIdentity] = useState(0);
  const walletAddress = user.get('ethAddress');

  const init = async () => {
    web3Signer.current = web3Provider.getSigner();
    identityFactory.current = new ethers.Contract(_chainMeta.contracts.identityFactory, ABIS.ifactory, web3Signer.current);

    // query-start block number
    // We can only query last 1000 blocks due to the limit of Mumbai Testnet
    const fromBlockNumber = (await web3Provider.getBlockNumber()) - 998;

    let events = await identityFactory.current.queryFilter('IdentityDeployed', fromBlockNumber);
    const identityDeployedEvents = events.filter(event => event.args[1].toLowerCase() === walletAddress.toLowerCase());
    let identityAddresses = identityDeployedEvents.length > 0 ? identityDeployedEvents.map(event => event.args[0]) : [];

    if (identityAddresses.length === 0) {
      events = await identityFactory.current.queryFilter('AdditionalOwnerAction', fromBlockNumber);

      const eventsForWalletAddress = events.filter(event => event.args[2].toLowerCase() === walletAddress.toLowerCase());
      const addingEvents = eventsForWalletAddress.filter(event => event.args[3] === 'added');
      const removingEvents = eventsForWalletAddress.filter(event => event.args[3] === 'removed');

      identityAddresses = addingEvents.map(event => event.args[0]);

      removingEvents.map(event => event.args[0]).forEach(ele => {
        const index = identityAddresses.findIndex(eleToFind => eleToFind === ele);
        if (index >= 0) identityAddresses.splice(index, 1);
      });
    }

    setIdentityAddresses(identityAddresses);
  };

  const deployIdentity = async () => {
    try {
      const deployIdentityTx = await identityFactory.current.connect(web3Signer.current).deployIdentity();
      await deployIdentityTx.wait();
      // load deployed identities
      await init();
    } catch (e) {
      alert(e.reason);
    }
  };

  useEffect(() => {
    // this will trigger during component load/page load, so let's get the latest claims balances
    // ... we need to listed to _chainMeta event as well as it may get set after moralis responds
    if (_chainMeta?.networkId && user && isWeb3Enabled) {
      init();
    }
  }, [user, isWeb3Enabled, _chainMeta]);

  return (
    <VStack
      spacing={5}
      align='stretch'
      >
      <ChainSupportedComponent>
        <Box maxW="sm" borderWidth="1px" p="10" borderRadius="lg" maxWidth="initial">
          {identityAddresses.length === 0 ? (<>
            <Heading size="lg">Step 1: Deploy your Identity Contract</Heading>

            <Box fontSize="sm" mt="9" align="left" flex="1">Your first step is to deploy what we can an identity, this is a smart contract that can be used by you to store your web3 “reputation” and to hold your NFMe ID Souldbound token. You have FULL control over this identity contract and you can choose to use it to “talk” with blockchain based DApps to expose your reputation or other data your have within the Itheum ecosystem. The DApps can then provide you personalized experiences. Think - gated features or immediate whitelists</Box>

            <Button mt="12" colorScheme="teal" variant="outline" onClick={deployIdentity}>Deploy Identity Contract</Button>
          </>) : (
            <>
              <Heading size="lg">My Identity Contracts</Heading>

              <UnorderedList>
                {identityAddresses.map((val, index) => (<ListItem key={`my-indentity-address-${index}`}>{val}</ListItem>))}
              </UnorderedList>
            </>
          )}
          
        </Box>
      </ChainSupportedComponent>
    </VStack>
  );
};
