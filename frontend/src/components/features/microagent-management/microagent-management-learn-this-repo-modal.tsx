import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { FaCircleInfo } from "react-icons/fa6";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import { BrandButton } from "../settings/brand-button";
import { I18nKey } from "#/i18n/declaration";
import { RootState } from "#/store";
import XIcon from "#/icons/x.svg?react";
import { cn } from "#/utils/utils";
import { LearnThisRepoFormData } from "#/types/microagent-management";
import { Branch } from "#/types/git";
import { useRepositoryBranches } from "#/hooks/query/use-repository-branches";
import {
  BranchDropdown,
  BranchLoadingState,
  BranchErrorState,
} from "../home/repository-selection";

interface MicroagentManagementLearnThisRepoModalProps {
  onConfirm: (formData: LearnThisRepoFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function MicroagentManagementLearnThisRepoModal({
  onConfirm,
  onCancel,
  isLoading = false,
}: MicroagentManagementLearnThisRepoModalProps) {
  const { t } = useTranslation();

  const [query, setQuery] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const { selectedRepository } = useSelector(
    (state: RootState) => state.microagentManagement,
  );

  // Add a ref to track if the branch was manually cleared by the user
  const branchManuallyClearedRef = useRef<boolean>(false);

  const {
    data: branches,
    isLoading: isLoadingBranches,
    isError: isBranchesError,
  } = useRepositoryBranches(selectedRepository?.full_name || null);

  const branchesItems = branches?.map((branch) => ({
    key: branch.name,
    label: branch.name,
  }));

  // Auto-select main or master branch if it exists.
  useEffect(() => {
    if (
      branches &&
      branches.length > 0 &&
      !selectedBranch &&
      !isLoadingBranches
    ) {
      // Look for main or master branch
      const mainBranch = branches.find((branch) => branch.name === "main");
      const masterBranch = branches.find((branch) => branch.name === "master");

      // Select main if it exists, otherwise select master if it exists
      if (mainBranch) {
        setSelectedBranch(mainBranch);
      } else if (masterBranch) {
        setSelectedBranch(masterBranch);
      }
    }
  }, [branches, isLoadingBranches, selectedBranch]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!query.trim()) {
      return;
    }

    onConfirm({
      query: query.trim(),
      selectedBranch: selectedBranch?.name || "",
    });
  };

  const handleConfirm = () => {
    if (!query.trim()) {
      return;
    }

    onConfirm({
      query: query.trim(),
      selectedBranch: selectedBranch?.name || "",
    });
  };

  const handleBranchSelection = (key: React.Key | null) => {
    const selectedBranchObj = branches?.find((branch) => branch.name === key);
    setSelectedBranch(selectedBranchObj || null);
    // Reset the manually cleared flag when a branch is explicitly selected
    branchManuallyClearedRef.current = false;
  };

  const handleBranchInputChange = (value: string) => {
    // Clear the selected branch if the input is empty or contains only whitespace
    // This fixes the issue where users can't delete the entire default branch name
    if (value === "" || value.trim() === "") {
      setSelectedBranch(null);
      // Set the flag to indicate that the branch was manually cleared
      branchManuallyClearedRef.current = true;
    } else {
      // Reset the flag when the user starts typing again
      branchManuallyClearedRef.current = false;
    }
  };

  // Render the appropriate UI for branch selector based on the loading/error state
  const renderBranchSelector = () => {
    if (!selectedRepository) {
      return (
        <BranchDropdown
          items={[]}
          onSelectionChange={() => {}}
          onInputChange={() => {}}
          isDisabled
          wrapperClassName="max-w-full w-full"
          label={t(I18nKey.REPOSITORY$SELECT_BRANCH)}
        />
      );
    }

    if (isLoadingBranches) {
      return <BranchLoadingState wrapperClassName="max-w-full w-full" />;
    }

    if (isBranchesError) {
      return <BranchErrorState wrapperClassName="max-w-full w-full" />;
    }

    return (
      <BranchDropdown
        items={branchesItems || []}
        onSelectionChange={handleBranchSelection}
        onInputChange={handleBranchInputChange}
        isDisabled={false}
        selectedKey={selectedBranch?.name}
        wrapperClassName="max-w-full w-full"
        label={t(I18nKey.REPOSITORY$SELECT_BRANCH)}
      />
    );
  };

  return (
    <ModalBackdrop onClose={onCancel}>
      <ModalBody
        className="items-start rounded-[12px] p-6 min-w-[611px]"
        data-testid="learn-this-repo-modal"
      >
        <div className="flex flex-col gap-2 w-full">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2
                className="text-white text-xl font-medium"
                data-testid="modal-title"
              >
                {t(I18nKey.MICROAGENT_MANAGEMENT$LEARN_THIS_REPO_MODAL_TITLE)}
              </h2>
              <a
                href="https://docs.all-hands.dev/usage/prompting/microagents-overview#microagents-overview"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="modal-info-link"
              >
                <FaCircleInfo className="text-primary" />
              </a>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer"
              data-testid="modal-close-button"
            >
              <XIcon width={24} height={24} color="#F9FBFE" />
            </button>
          </div>
          <span
            className="text-white text-sm font-normal"
            data-testid="modal-description"
          >
            {t(I18nKey.MICROAGENT_MANAGEMENT$LEARN_THIS_REPO_MODAL_DESCRIPTION)}
          </span>
        </div>
        <form
          data-testid="learn-this-repo-form"
          onSubmit={onSubmit}
          className="flex flex-col gap-6 w-full"
        >
          <div data-testid="branch-selector-container">
            {renderBranchSelector()}
          </div>
          <label
            htmlFor="query-input"
            className="flex flex-col gap-2 w-full text-sm font-normal"
          >
            {t(
              I18nKey.MICROAGENT_MANAGEMENT$WHAT_YOU_WOULD_LIKE_TO_KNOW_ABOUT_THIS_REPO,
            )}
            <textarea
              required
              data-testid="query-input"
              name="query-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(
                I18nKey.MICROAGENT_MANAGEMENT$DESCRIBE_WHAT_TO_KNOW_ABOUT_THIS_REPO,
              )}
              rows={6}
              className={cn(
                "bg-tertiary border border-[#717888] bg-[#454545] w-full rounded-sm p-2 placeholder:italic placeholder:text-tertiary-alt resize-none",
                "disabled:bg-[#2D2F36] disabled:border-[#2D2F36] disabled:cursor-not-allowed",
              )}
            />
          </label>
        </form>
        <div
          className="flex items-center justify-end gap-2 w-full"
          onClick={(event) => event.stopPropagation()}
          data-testid="modal-actions"
        >
          <BrandButton
            type="button"
            variant="secondary"
            onClick={onCancel}
            testId="cancel-button"
          >
            {t(I18nKey.BUTTON$CANCEL)}
          </BrandButton>
          <BrandButton
            type="button"
            variant="primary"
            onClick={handleConfirm}
            testId="confirm-button"
            isDisabled={
              !query.trim() ||
              isLoading ||
              isLoadingBranches ||
              !selectedBranch ||
              isBranchesError
            }
          >
            {isLoading || isLoadingBranches
              ? t(I18nKey.HOME$LOADING)
              : t(I18nKey.MICROAGENT$LAUNCH)}
          </BrandButton>
        </div>
      </ModalBody>
    </ModalBackdrop>
  );
}
