import React, { useState, useEffect } from 'react';
import { Box, Stack } from '@chakra-ui/layout';
import {
  Button, Link, Badge, Flex, Image, StackDivider,  
  HStack, Heading, Center,
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

  async function init() {
    web3Signer.current = web3Provider.getSigner();
    identityFactory.current = new ethers.Contract(_chainMeta.contracts.identifyFactory, ABIS.ifactory, web3Signer.current);

    let events = await identityFactory.current.queryFilter('IdentityDeployed', 0);
    const identityDeployedEvents = events.filter(event => event.args[1] === walletAddress);
    let identityAddresses = identityDeployedEvents.length > 0 ? identityDeployedEvents.map(event => event.args[0]) : [];

    if (identityAddresses.length === 0) {
      events = await identityFactory.current.queryFilter('AdditionalOwnerAction', 0);

      const eventsForWalletAddress = events.filter(event => event.args[2] === walletAddress);
      const addingEvents = eventsForWalletAddress.filter(event => event.args[3] === "added");
      const removingEvents = eventsForWalletAddress.filter(event => event.args[3] === "removed");

      identityAddresses = addingEvents.map(event => event.args[0]);

      removingEvents.map(event => event.args[0]).forEach(ele => {
        const index = identityAddresses.findIndex(eleToFind => eleToFind === ele);
        if (index >= 0) identityAddresses.splice(index, 1);
      });
    }

    setIdentityAddresses(identityAddresses);
  }

  useEffect(() => {
    init();
  },[]);

  return (
    <Stack spacing={5}>      
      <Flex align="top" spacing={10}>
        <ChainSupportedComponent feature="Identity Container">
          <Box maxW="sm" borderWidth="1px" p="10" m="auto" borderRadius="lg" w="90%" maxWidth="initial">
            <Center flexDirection="column">
              <Heading size="lg">Step 1: Deploy your Identity Container</Heading>

              <Box fontSize="sm" mt="9" align="center" flex="1">Your first step is to deploy what we can an identity container, this is a smart contract that can be used by you to store your web3 “reputation” and to hold your NFMe ID Souldbound token. You have FULL control over this identity container and you can choose to use it to “talk” with blockchain based DApps to expose your reputation or other data your have within the Itheum ecosystem. The DApps can then provide you personalized experiences. Think - gated features or immediate whitelists</Box>

              <Button mt="12" colorScheme="teal" variant="outline" onClick={() => {}}>Deploy Identity Container</Button>

            </Center>
          </Box>
        </ChainSupportedComponent>
      </Flex>
    </Stack>
  );
};
