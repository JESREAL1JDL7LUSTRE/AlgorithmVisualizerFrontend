import { Box, Text, Circle, VStack, HStack } from '@chakra-ui/react';

const nodeColors = {
  default: '#ccc',
  source: '#68D391',
  sink: '#F56565',
  visited: '#4299E1',
  active: '#ED8936',
  path: '#805AD5',
};

const GraphLegend = () => {
  return (
    <Box p={3} borderWidth="1px" borderRadius="md" bg="white">
      <VStack align="flex-start" spacing={3}>
        <Text fontWeight="bold">Legend</Text>
        
        <Box>
          <Text mb={1} fontWeight="medium">Nodes:</Text>
          <VStack align="flex-start" spacing={1}>
            <HStack>
              <Circle size="16px" bg={nodeColors.source} border="1px solid #333" />
              <Text fontSize="sm">Source Node</Text>
            </HStack>
            <HStack>
              <Circle size="16px" bg={nodeColors.sink} border="1px solid #333" />
              <Text fontSize="sm">Sink Node</Text>
            </HStack>
            <HStack>
              <Circle size="16px" bg={nodeColors.default} border="1px solid #333" />
              <Text fontSize="sm">Default Node</Text>
            </HStack>
            <HStack>
              <Circle size="16px" bg={nodeColors.visited} border="1px solid #333" />
              <Text fontSize="sm">Visited Node</Text>
            </HStack>
          </VStack>
        </Box>
        
        <Box>
          <Text mb={1} fontWeight="medium">Edges:</Text>
          <VStack align="flex-start" spacing={1}>
            <HStack>
              <Box h="3px" w="20px" bg="#888" />
              <Text fontSize="sm">No Flow</Text>
            </HStack>
            <HStack>
              <Box h="3px" w="20px" bg="rgba(66, 153, 225, 0.6)" />
              <Text fontSize="sm">Partial Flow</Text>
            </HStack>
            <HStack>
              <Box h="3px" w="20px" bg="#F56565" />
              <Text fontSize="sm">Full Capacity</Text>
            </HStack>
            <HStack>
              <Box h="3px" w="20px" bg="#805AD5" />
              <Text fontSize="sm">Currently Explored</Text>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default GraphLegend;
