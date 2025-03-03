import { Workstream, WorkstreamContributor } from "../../.graphclient";
import { useBlockTx } from "../../hooks/useBlockTx";
import { useCustomToasts } from "../../hooks/useCustomToasts";
import { contractAddresses, contractABI } from "../../utils/constants";
import { CloseButton } from "../CloseButton";
import User from "../User";
import { StarIcon } from "@chakra-ui/icons";
import {
  Button,
  FormControl,
  Grid,
  GridItem,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Spacer,
  Text,
  ButtonGroup,
  VStack,
  Center,
  Flex,
  Stat,
  StatNumber,
} from "@chakra-ui/react";
import { BigNumberish } from "ethers";
import _ from "lodash";
import { useRouter } from "next/router";
import React, { Fragment } from "react";
import { Controller, useForm } from "react-hook-form";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";

type FormData = {
  [address: string]: BigNumberish;
};

const findEvaluations = (workstream: Workstream, user: `0x${string}`) => {
  let data: FormData = {};
  const currentEvaluations = workstream?.evaluations?.filter(
    (evaluation) => evaluation.creator.id.toLowerCase() === user.toLowerCase()
  );

  if (!currentEvaluations) {
    console.log("No current found");
    return data;
  }

  data = _.transform(
    currentEvaluations,
    (result, v, _) => {
      result[v.contributor.id] = v.rating;
    },
    {} as FormData
  );

  return data;
};

const ValueReviewForm: React.FC<{
  workstream: Partial<WorkstreamContributor>;
}> = ({ workstream }) => {
  const router = useRouter();

  const { address: user } = useAccount();
  const toast = useCustomToasts();
  const { checkChain } = useBlockTx();

  const _workstream = workstream as Workstream;

  const currentEvaluations = findEvaluations(
    _workstream,
    user || ("" as `0x${string}`)
  );

  const {
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      ratings: currentEvaluations,
    },
  });

  const formData = watch();

  const _contributors = Object.keys(formData.ratings);
  const _ratings = Object.values(formData.ratings).map((rating) => +rating);
  const total = _ratings.length > 0 ? _ratings.reduce((a, b) => a + b, 0) : 0;

  const { config } = usePrepareContractWrite({
    address: contractAddresses.fuxContractAddress,
    abi: contractABI.fux,
    functionName: "submitEvaluation",
    args: [workstream.id, _contributors, _ratings],
  });

  const { write } = useContractWrite({
    ...config,
    onError(e) {
      toast.error(e);
    },
    onSuccess(data) {
      toast.success("Submitted Evaluation", "Evaluation submitted succesfully");
      console.log(data);
    },
    onSettled() {
      router.back();
    },
  });

  if (!user) {
    return <Text>Cannot determine user</Text>;
  }

  const onSubmit = (_: FormData) => {
    if (total != 100) {
      toast.warning(`Not enough FUX`, `${total || "..."}/100`);
      return;
    }

    if (_contributors.length !== _ratings.length) {
      toast.warning(
        `Contributor <> Evaluation mismatch`,
        `Did you evaluate everybody?`
      );
      return;
    }

    if (checkChain()) {
      write?.();
    }
  };

  const contributors = _workstream.contributors;
  const coordinator = _workstream.coordinator?.id;

  const filterContributors = (contributors: WorkstreamContributor[]) => {
    return contributors.filter(
      (contributor) =>
        contributor.contributor.id.toLowerCase() !== user.toLowerCase()
    );
  };

  const filtered = filterContributors(contributors || []);

  if (filtered.length === 0) {
    return (
      <Flex direction={"column"} gap={2}>
        <Text>No contributors found</Text>
        <CloseButton workstreamId={_workstream.id} disabled={false} />
      </Flex>
    );
  }

  const reviewForm = (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Center>
        <Text paddingBottom={"2em"} paddingTop={"2em"} textAlign={"center"}>
          Distribute 100 points to rate value contribution
        </Text>
      </Center>
      <FormControl>
        <Grid gap={2} templateColumns="repeat(12, 1fr)">
          <GridItem colSpan={8}>
            <Text>User</Text>
          </GridItem>
          <GridItem colSpan={2}>
            <Text>Committed</Text>
          </GridItem>
          <GridItem colSpan={2}>
            <Text>vFUX Rating</Text>
          </GridItem>
          {filtered.map((contributor, index) => {
            const address = contributor.contributor.id as `0x${string}`;
            return (
              <Fragment key={index}>
                <GridItem colSpan={8}>
                  <Flex direction={"row"} alignItems={"center"} gap={"2"}>
                    <User
                      address={address as `0x${string}`}
                      direction="horizontal"
                      displayAvatar={true}
                    />
                    {coordinator?.toLowerCase() === address.toLowerCase() ? (
                      <StarIcon color={"yellow"} />
                    ) : undefined}
                  </Flex>
                </GridItem>
                <GridItem colSpan={2}>
                  <Stat>
                    <StatNumber>{`${contributor.commitment || 0}%`}</StatNumber>
                  </Stat>
                </GridItem>
                <GridItem bg="#301A3A" display={"inline-grid"} colSpan={2}>
                  <Controller
                    name={`ratings.${address}`}
                    control={control}
                    rules={{ required: true }}
                    key={`ratings.${address}`}
                    render={({ field: { ref, ...restField } }) => (
                      <NumberInput min={0} max={100} step={1} {...restField}>
                        <NumberInputField
                          ref={ref}
                          name={restField.name}
                          borderRadius={0}
                          placeholder={
                            formData[address.toLowerCase()]?.toString() ?? "0"
                          }
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    )}
                  />
                </GridItem>
              </Fragment>
            );
          })}
        </Grid>
      </FormControl>

      <VStack w={"100%"} pt={4}>
        <ButtonGroup>
          <Button isLoading={isSubmitting} type="reset" onClick={() => reset()}>
            Reset
          </Button>
          <Spacer />
          <Button
            isDisabled={total != 100}
            isLoading={isSubmitting}
            type="submit"
          >
            {total && total != 100
              ? `${100 - total} / 100`
              : "Submit evaluation"}
          </Button>
        </ButtonGroup>
      </VStack>
    </form>
  );

  return reviewForm;
};

export { ValueReviewForm };
