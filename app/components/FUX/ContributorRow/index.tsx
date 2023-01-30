import { HStack, Avatar, Icon, Text, Button, useToast } from "@chakra-ui/react";
import { formatAddress, useENS } from "@raidguild/quiver";
import { CopyIcon }from "@chakra-ui/icons";

export const ContributorRow: React.FC<{ address: string }> = ({ address }) => {
  const { address: _address, ens, avatar } = useENS({ address });
  const toast = useToast();

  const handleClick = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: `Copied address to clipboard`,
      status: "success",
    });
  };

  return ens ? (
    <HStack spacing={3} mb={3}>
      <Avatar name={ens} src={avatar} />
      <Button variant={"link"} onClick={() => handleClick()}>
        <Text mr={2}>{ens}</Text>
        <CopyIcon />
      </Button>
    </HStack>
  ) : (
    <HStack spacing={3} mb={3}>
      <Avatar name={address} src={avatar} />
      <Button variant={"link"} onClick={() => handleClick()}>
        <Text mr={2}>{formatAddress(address)}</Text>
        <CopyIcon />
      </Button>
    </HStack>
  );
};
