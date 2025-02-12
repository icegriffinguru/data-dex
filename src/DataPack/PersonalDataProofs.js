import React, { useState, useEffect } from 'react';
import { useMoralis, useMoralisQuery } from 'react-moralis';
import { Box, Stack } from '@chakra-ui/layout';
import {
  CloseButton, Text, Link, HStack, Tooltip,
  Alert, AlertIcon, AlertTitle, Heading,
  Table, Thead, Tbody, Tfoot, Tr, Th, Td, TableCaption,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import ShortAddress from 'UtilComps/ShortAddress';
import SkeletonLoadingList from 'UtilComps/SkeletonLoadingList';
import { CHAIN_TX_VIEWER, sleep } from 'libs/util';
import { tmpProgIdMapping } from 'libs/util';
import { useChainMeta } from 'store/ChainMetaContext';

export default function() {
  const { chainMeta: _chainMeta, setChainMeta } = useChainMeta();
  const { web3 } = useMoralis();
  const { user } = useMoralis();
  const [dataProofs, setDataProofs] = useState([]);
  const [noData, setNoData] = useState(false);
  const { data: dataPacks, error: errorDataPackGet } = useMoralisQuery('DataPack', query =>
    query.descending('createdAt') &&
    query.notEqualTo('txHash', null) &&
    query.notEqualTo('fromProgramId', null) &&
    query.equalTo('txNetworkId', _chainMeta.networkId)
  );

  useEffect(() => {
    if (user && user.get('ethAddress') && dataPacks.length > 0) {
      setDataProofs(dataPacks.filter(i => (i.get('sellerEthAddress') === user.get('ethAddress'))));
    }
  }, [dataPacks]);

  useEffect(() => {
    (async() => {
      if (dataProofs && dataProofs.length === 0) {
        await sleep(5);
        setNoData(true);
      }
    })();
  }, [dataProofs]);

  return (
    <Stack spacing={5}>
      <Heading size="lg">Personal Data Proofs</Heading>
      <Heading size="xs" opacity=".7">These are your on-chain proofs available to Smart Contracts : 
        <Tooltip label="There `Proofs` are available to all Smart Contracts via a service interface and can be used for real-time logic gates" aria-label="A tooltip"> Learn More</Tooltip>
      </Heading>

      {errorDataPackGet && 
        <Alert status="error">
          <Box flex="1">
            <AlertIcon />
            <AlertTitle>{errorDataPackGet.message}</AlertTitle>
          </Box>
          <CloseButton position="absolute" right="8px" top="8px" />
        </Alert>
      }

      {dataProofs.length === 0 &&
        <>{!noData && <SkeletonLoadingList /> || <Text>No data yet...</Text>}</> || 
        <Box overflowX="auto">
          <Table variant="striped" mt="3" size="sm">
            <TableCaption>The following personal data proofs have been made available by you</TableCaption>
            <Thead>
              <Tr>
                <Th>Data Pack ID</Th>
                <Th>Proof Source</Th>
                <Th>On-Chain Proof</Th>
                <Th>Readable Proof</Th>
                <Th>Proof TX</Th>
              </Tr>
            </Thead>
            <Tbody>
            {dataProofs.map((item) => <Tr key={item.id}>
              <Td><ShortAddress address={item.id} /></Td>
              <Td>{tmpProgIdMapping[item.get('fromProgramId')]}</Td>
              <Td><ShortAddress address={item.get('dataHash')} /></Td>
              <Td><Link href={item.get('dataFile').url()} isExternal><Text fontSize="sm">View Proof Data <ExternalLinkIcon mx="2px" /></Text></Link></Td>
              <Td>
                <HStack>
                  <ShortAddress address={item.get('txHash')} />
                  <Link href={`${CHAIN_TX_VIEWER[_chainMeta.networkId]}${item.get('txHash')}`} isExternal><ExternalLinkIcon mx="2px" /></Link>
                </HStack>
              </Td>
            </Tr>)}
          </Tbody>
            <Tfoot>
              <Tr>
                <Th>Data Pack ID</Th>
                <Th>Proof Source</Th>
                <Th>On-Chain Proof</Th>
                <Th>Readable Proof</Th>
                <Th>Proof TX</Th>
              </Tr>
            </Tfoot>
          </Table>        
        </Box>
      }
    </Stack>
  );
};
