import { useAddContributors } from "../../../hooks/workstream";
import { ContributorRow } from "../ContributorRow";
import {
  Box,
  Button,
  ButtonGroup,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  InputGroup,
  InputRightElement,
  Spacer,
  Icon,
  Text,
  Tooltip,
  Table,
} from "@chakra-ui/react";
import { BigNumber } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { useFieldArray, useForm } from "react-hook-form";
import { BsFillPersonPlusFill } from "react-icons/bs";
import { useState } from "react";

type FormData = {
  contributors: string[];
  newContributors: { address: string }[];
};

const ContributorModal: React.FC<{
  workstreamID: BigNumber;
  workstreamName: string;
  contributors?: { user: { id: string } }[];
}> = ({ workstreamID, workstreamName, contributors }) => {
  const [newContributors, setNewContributors] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data, write } = useAddContributors(workstreamID, newContributors);

  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      contributors:
        contributors?.map(({ user }) => {
          return user.id;
        }) || [],
      newContributors: [{ address: "" }],
    },
  });

  const { fields, append, prepend, remove, swap, move, insert } =
    useFieldArray<FormData>({
      control,
      name: "newContributors",
    });

  

  const onSubmit = (form: FormData) => {
    if (form.newContributors.length > 0) {
      const addressArray = form.newContributors
        .map((entry) => entry.address)
        .filter((address) => isAddress(address));
      write?.();
      onClose();
    }
  };

  const input = (
    <>
      <Text mb={3}>Contributors</Text>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Table>
          {contributors?.map(({ user }, index) => (
            <ContributorRow key={index} address={user.id} />
          ))}
        </Table>

        <Box mt={6}>
          <hr />
        </Box>
        <Text mt={6}>Invite Contributors</Text>

        {fields.map((field, index) => (
          <InputGroup key={field.id} marginTop={"1em"}>
            <Input
              id="newContributors"
              defaultValue={`${field.address}`}
              {...register(`newContributors.${index}.address`)}
            />
            {index == fields.length - 1 ? (
              <InputRightElement>
                <Tooltip
                  hasArrow
                  label="Add Another Contributor"
                  aria-label="Add Another Contributor"
                >
                  <IconButton
                    aria-label="Add another contributor"
                    onClick={() => append({ address: "" })}
                    icon={<Icon as={BsFillPersonPlusFill} />}
                  />
                </Tooltip>
              </InputRightElement>
            ) : undefined}
          </InputGroup>
        ))}
        <ButtonGroup justifyContent="space-between" w="100%" marginTop={"1em"}>
          <Button isLoading={isSubmitting} type="reset" onClick={() => reset()}>
            Reset
          </Button>
          <Spacer />
          <Button isLoading={isSubmitting} type="submit">
            Submit
          </Button>
        </ButtonGroup>
      </form>
    </>
  );

  return (
    <>
      <Tooltip
        hasArrow
        label="Manage Contributors"
        aria-label="Manage Contributors"
      >
        <IconButton
          onClick={onOpen}
          aria-label="Manage contributors"
          icon={<Icon as={BsFillPersonPlusFill} />}
        ></IconButton>
      </Tooltip>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay bg="#1D131D" />
        <ModalContent bg="#221527">
          <ModalHeader>{workstreamName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{input}</ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ContributorModal;
