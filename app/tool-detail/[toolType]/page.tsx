"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageNavbar } from "@/components/PageNavbar/PageNavbar";
import { ActionSheet } from "@/components/ActionSheet/ActionSheet";
import { useTrip } from "@/src/lib/hooks/use-trip";
import type {
  ToolType,
  VoteSelectionMode,
  ToolDetailViewModel,
  VoteChoice,
} from "@/src/domain/types";
import { TOOL_META } from "@/src/domain/constants";
import styles from "./page.module.css";

// 常量定义
const DRAW_COUNT_OPTIONS = [1, 2, 3, 4, 5];
const VOTE_REFRESH_INTERVAL_MS = 10000;
const WHEEL_SLICE_COLORS = [
  "#fff0b5",
  "#ffd4de",
  "#d8c8ff",
  "#c9f2c2",
  "#bfe6ff",
  "#ffe1b2",
  "#ffd7b8",
  "#c8f3ec",
  "#d4e4ff",
  "#f5d7ff",
] as const;

// 辅助函数
function isToolType(value: string): value is ToolType {
  return ["seat-draw", "vote", "wheel", "lottery"].includes(value);
}

function getHeroTopic(topic: string | null | undefined, fallback: string): string {
  const normalized = typeof topic === "string" ? topic.trim() : "";
  return normalized || fallback;
}

function parseWheelItems(input: string): string[] {
  return input
    .split(/\n|,|，|;|；/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseVoteOptions(input: string): string[] {
  return input
    .split(/\n|,|，|;|；/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLotteryAnswers(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// 工具详情页组件
export default function ToolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data, getToolDetail, toolAction } = useTrip();

  const toolTypeParam = params.toolType as string;
  const isValid = isToolType(toolTypeParam);
  const toolType = isValid ? toolTypeParam : "seat-draw";

  // 状态
  const [pageData, setPageData] = useState<ToolDetailViewModel | null>(null);
  const [heroView, setHeroView] = useState<{
    eyebrowText: string;
    titleText: string;
    subtitleText: string;
    illustrationSrc: string;
    illustrationClassName: string;
    resultTitle: string;
  } | null>(null);
  const [isDraftEditing, setIsDraftEditing] = useState(false);
  const [isRecreateMode, setIsRecreateMode] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // 表单状态
  const [seatDrawTopicInput, setSeatDrawTopicInput] = useState("");
  const [drawCountPickerValue, setDrawCountPickerValue] = useState(0);
  const [seatDrawCountLabel, setSeatDrawCountLabel] = useState("1人");
  const [seatDrawExcludePreviouslyDrawn, setSeatDrawExcludePreviouslyDrawn] = useState(false);
  const [seatDrawExcludeAdmin, setSeatDrawExcludeAdmin] = useState(false);
  const [voteTopicInput, setVoteTopicInput] = useState("");
  const [voteOptionsInput, setVoteOptionsInput] = useState("");
  const [voteSelectionMode, setVoteSelectionMode] = useState<VoteSelectionMode>("single");
  const [voteMaxSelectionsInput, setVoteMaxSelectionsInput] = useState("1");
  const [voteExcludeAdmin, setVoteExcludeAdmin] = useState(false);
  const [voteSelectedOptionIds, setVoteSelectedOptionIds] = useState<string[]>([]);
  const [voteViewerResultLabel, setVoteViewerResultLabel] = useState("");
  const [voteApproveDisabled, setVoteApproveDisabled] = useState(true);
  const [voteAbstainDisabled, setVoteAbstainDisabled] = useState(true);
  const [wheelTopicInput, setWheelTopicInput] = useState("");
  const [wheelItemsInput, setWheelItemsInput] = useState("");
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelTransitionMs, setWheelTransitionMs] = useState(0);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelVisibleHistoryLabels, setWheelVisibleHistoryLabels] = useState<string[]>([]);
  const [wheelAllowAssignedUser, setWheelAllowAssignedUser] = useState(false);
  const [wheelAssignedUserId, setWheelAssignedUserId] = useState<string>("");
  const [wheelAssignedUserIndex, setWheelAssignedUserIndex] = useState(0);
  const [wheelShowResult, setWheelShowResult] = useState(false);
  const [lotteryTopicInput, setLotteryTopicInput] = useState("");
  const [lotteryAnswersInput, setLotteryAnswersInput] = useState("");
  const [lotteryDrawLimitInput, setLotteryDrawLimitInput] = useState("1");
  const [lotteryAllowAssignedUser, setLotteryAllowAssignedUser] = useState(false);
  const [lotteryAssignedUserId, setLotteryAssignedUserId] = useState<string>("");
  const [lotteryAssignedUserIndex, setLotteryAssignedUserIndex] = useState(0);
  const [lotteryFlippingCardId, setLotteryFlippingCardId] = useState<string>("");

  // 定时器引用
  const seatDrawRollingSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const voteRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 获取工具详情
  const fetchToolDetail = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getToolDetail(toolType);
      setPageData(result);
      applyPageData(result);
    } catch (error) {
      console.error("获取工具详情失败:", error);
    } finally {
      setLoading(false);
    }
  }, [toolType, getToolDetail]);

  // 应用页面数据
  const applyPageData = useCallback((pageData: ToolDetailViewModel) => {
    // 构建英雄视图
    let newHeroView: ReturnType<typeof buildToolHeroView> = null;
    if (pageData.isStarted) {
      newHeroView = buildToolHeroView(pageData);
    }
    setHeroView(newHeroView);

    // 设置座位抽号表单
    const seatDrawCount = Math.max(
      1,
      Math.min(5, pageData.seatDrawDetail?.drawCount ?? 1)
    );
    setSeatDrawTopicInput(pageData.seatDrawDetail?.topic ?? "");
    setDrawCountPickerValue(seatDrawCount - 1);
    setSeatDrawCountLabel(`${seatDrawCount}人`);
    setSeatDrawExcludePreviouslyDrawn(pageData.seatDrawDetail?.excludePreviouslyDrawn ?? false);
    setSeatDrawExcludeAdmin(pageData.seatDrawDetail?.excludeAdmin ?? false);

    // 设置投票表单
    const voteSelectionModeVal = pageData.voteDetail?.selectionMode ?? "single";
    setVoteTopicInput(pageData.voteDetail?.topic ?? "");
    setVoteOptionsInput(pageData.voteDetail?.options.map(opt => opt.label).join("\n") ?? "");
    setVoteSelectionMode(voteSelectionModeVal);
    setVoteMaxSelectionsInput(String(
      pageData.voteDetail?.maxSelections ?? (voteSelectionModeVal === "multiple" ? 2 : 1)
    ));
    setVoteExcludeAdmin(pageData.voteDetail?.excludeAdmin ?? false);
    setVoteSelectedOptionIds(pageData.voteDetail?.viewerSelectedOptionIds ?? []);

    // 构建投票交互状态
    const voteInteraction = buildVoteInteractionState(pageData, pageData.voteDetail?.viewerSelectedOptionIds ?? []);
    setVoteViewerResultLabel(voteInteraction.viewerResultLabel);
    setVoteApproveDisabled(voteInteraction.approveDisabled);
    setVoteAbstainDisabled(voteInteraction.abstainDisabled);

    // 设置转盘表单
    const wheelEligibleUsers = pageData.wheelDetail?.eligibleUsers ?? [];
    const defaultWheelAssignedUserId =
      pageData.wheelDetail?.assignedUserId ??
      wheelEligibleUsers.find(member => member.isSelf)?.userId ??
      wheelEligibleUsers[0]?.userId ??
      "";
    const defaultWheelAssignedUserIndex = Math.max(
      0,
      wheelEligibleUsers.findIndex(member => member.userId === defaultWheelAssignedUserId)
    );
    setWheelTopicInput(pageData.wheelDetail?.topic ?? "");
    setWheelItemsInput(pageData.wheelDetail?.items.join("\n") ?? "");
    setWheelAllowAssignedUser(pageData.wheelDetail?.allowAssignedUser ?? false);
    setWheelAssignedUserId(defaultWheelAssignedUserId);
    setWheelAssignedUserIndex(defaultWheelAssignedUserIndex);
    setWheelVisibleHistoryLabels(pageData.wheelDetail?.resultHistoryLabels ?? []);
    setWheelShowResult(Boolean(
      pageData.wheelDetail?.resultLabel || pageData.wheelDetail?.resultHistoryLabels.length
    ));
    // 设置转盘初始旋转角度
    if (pageData.wheelDetail?.resultIndex != null && pageData.wheelDetail.items.length > 0) {
      setWheelRotation(getWheelTargetRotation(pageData.wheelDetail.items.length, pageData.wheelDetail.resultIndex));
    }

    // 设置抽签表单
    const lotteryEligibleUsers = pageData.lotteryDetail?.eligibleUsers ?? [];
    const defaultLotteryAssignedUserId =
      pageData.lotteryDetail?.assignedUserId ??
      lotteryEligibleUsers.find(member => member.isSelf)?.userId ??
      lotteryEligibleUsers[0]?.userId ??
      "";
    const defaultLotteryAssignedUserIndex = Math.max(
      0,
      lotteryEligibleUsers.findIndex(member => member.userId === defaultLotteryAssignedUserId)
    );
    setLotteryTopicInput(pageData.lotteryDetail?.topic ?? "");
    setLotteryAnswersInput(pageData.lotteryDetail?.answers.join("\n") ?? "");
    setLotteryDrawLimitInput(String(pageData.lotteryDetail?.drawLimitPerUser ?? 1));
    setLotteryAllowAssignedUser(pageData.lotteryDetail?.allowAssignedUser ?? false);
    setLotteryAssignedUserId(defaultLotteryAssignedUserId);
    setLotteryAssignedUserIndex(defaultLotteryAssignedUserIndex);
  }, []);

  // 同步抽号滚动
  const syncSeatDrawRollingTimer = useCallback((pageData: ToolDetailViewModel) => {
    const shouldSync =
      pageData.toolType === "seat-draw" && pageData.seatDrawDetail?.phase === "rolling";

    if (!shouldSync) {
      if (seatDrawRollingSyncTimerRef.current) {
        clearInterval(seatDrawRollingSyncTimerRef.current);
        seatDrawRollingSyncTimerRef.current = null;
      }
      return;
    }

    if (seatDrawRollingSyncTimerRef.current !== null) {
      return;
    }

    seatDrawRollingSyncTimerRef.current = setInterval(() => {
      fetchToolDetail();
    }, 120);
  }, [fetchToolDetail]);

  // 同步投票刷新
  const syncVoteRefreshTimer = useCallback((pageData: ToolDetailViewModel) => {
    const shouldSync =
      pageData.toolType === "vote" &&
      pageData.isStarted &&
      pageData.voteDetail?.phase === "active" &&
      pageData.voteDetail.viewerHasSubmitted &&
      !isDraftEditing;

    if (!shouldSync) {
      if (voteRefreshTimerRef.current) {
        clearInterval(voteRefreshTimerRef.current);
        voteRefreshTimerRef.current = null;
      }
      return;
    }

    if (voteRefreshTimerRef.current !== null) {
      return;
    }

    voteRefreshTimerRef.current = setInterval(() => {
      fetchToolDetail();
    }, VOTE_REFRESH_INTERVAL_MS);
  }, [fetchToolDetail, isDraftEditing]);

  // 显示 Toast
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 1600);
  }, []);

  // 处理返回
  const handleBack = useCallback(() => {
    router.push("/tools");
  }, [router]);

  // 创建草稿
  const handleCreateDraft = useCallback(() => {
    if (toolType === "seat-draw") {
      setSeatDrawTopicInput("");
      setDrawCountPickerValue(0);
      setSeatDrawCountLabel("1人");
      setSeatDrawExcludePreviouslyDrawn(false);
      setSeatDrawExcludeAdmin(false);
    } else if (toolType === "wheel") {
      const eligibleUsers = pageData?.wheelDetail?.eligibleUsers ?? [];
      const defaultAssignedUserId =
        eligibleUsers.find((member) => member.isSelf)?.userId ?? eligibleUsers[0]?.userId ?? "";
      const defaultAssignedUserIndex = Math.max(
        0,
        eligibleUsers.findIndex((member) => member.userId === defaultAssignedUserId)
      );
      setWheelTopicInput("");
      setWheelItemsInput("");
      setWheelAllowAssignedUser(false);
      setWheelAssignedUserId(defaultAssignedUserId);
      setWheelAssignedUserIndex(defaultAssignedUserIndex);
    } else if (toolType === "lottery") {
      const eligibleUsers = pageData?.lotteryDetail?.eligibleUsers ?? [];
      const defaultAssignedUserId =
        eligibleUsers.find((member) => member.isSelf)?.userId ?? eligibleUsers[0]?.userId ?? "";
      const defaultAssignedUserIndex = Math.max(
        0,
        eligibleUsers.findIndex((member) => member.userId === defaultAssignedUserId)
      );
      setLotteryTopicInput("");
      setLotteryAnswersInput("");
      setLotteryDrawLimitInput("1");
      setLotteryAllowAssignedUser(false);
      setLotteryAssignedUserId(defaultAssignedUserId);
      setLotteryAssignedUserIndex(defaultAssignedUserIndex);
    }
    setIsDraftEditing(true);
    setIsRecreateMode(false);
  }, [toolType, pageData]);

  // 重新创建
  const handleRecreateDraft = useCallback(async () => {
    if (toolType === "seat-draw") {
      try {
        await toolAction(toolType, "close-seat-draw");
        setIsDraftEditing(true);
        setIsRecreateMode(true);
        setShowActionSheet(false);
        setSeatDrawTopicInput("");
        setDrawCountPickerValue(0);
        setSeatDrawCountLabel("1人");
        setSeatDrawExcludePreviouslyDrawn(false);
        setSeatDrawExcludeAdmin(false);
        showToast("已清除原有内容，请重新创建");
      } catch (error) {
        console.error("关闭失败:", error);
      }
    } else if (toolType === "lottery") {
      const eligibleUsers = pageData?.lotteryDetail?.eligibleUsers ?? [];
      const assignedUserId =
        pageData?.lotteryDetail?.assignedUserId ??
        eligibleUsers.find((member) => member.isSelf)?.userId ??
        eligibleUsers[0]?.userId ??
        "";
      const assignedUserIndex = Math.max(
        0,
        eligibleUsers.findIndex((member) => member.userId === assignedUserId)
      );
      setIsDraftEditing(true);
      setIsRecreateMode(true);
      setShowActionSheet(false);
      setLotteryTopicInput(pageData?.lotteryDetail?.topic ?? "");
      setLotteryAnswersInput(pageData?.lotteryDetail?.answers.join("\n") ?? "");
      setLotteryDrawLimitInput(String(pageData?.lotteryDetail?.drawLimitPerUser ?? 1));
      setLotteryAllowAssignedUser(pageData?.lotteryDetail?.allowAssignedUser ?? false);
      setLotteryAssignedUserId(assignedUserId);
      setLotteryAssignedUserIndex(assignedUserIndex);
    } else {
      setIsDraftEditing(true);
      setIsRecreateMode(true);
      setShowActionSheet(false);
    }
  }, [toolType, pageData, toolAction, showToast]);

  // 座位抽号主题输入
  const handleSeatDrawTopicInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSeatDrawTopicInput(e.target.value);
  }, []);

  // 座位抽号数量变化
  const handleSeatDrawCountChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(e.target.value);
    setDrawCountPickerValue(value);
    setSeatDrawCountLabel(`${value + 1}人`);
  }, []);

  // 座位抽号去除已抽
  const handleSeatDrawExcludePreviouslyDrawnChange = useCallback((checked: boolean) => {
    setSeatDrawExcludePreviouslyDrawn(checked);
  }, []);

  // 座位抽号去除管理员
  const handleSeatDrawExcludeAdminChange = useCallback((checked: boolean) => {
    setSeatDrawExcludeAdmin(checked);
  }, []);

  // 座位抽号发布
  const handleSeatDrawPublish = useCallback(async () => {
    try {
      const input = {
        topic: seatDrawTopicInput,
        drawCount: drawCountPickerValue + 1,
        excludePreviouslyDrawn: seatDrawExcludePreviouslyDrawn,
        excludeAdmin: seatDrawExcludeAdmin,
      };
      const action = isRecreateMode ? "recreate-seat-draw" : "publish-seat-draw";
      await toolAction(toolType, action, input);
      setIsDraftEditing(false);
      showToast(isRecreateMode ? "玩法已重新创建" : "玩法已创建");
      await fetchToolDetail();
    } catch (error) {
      console.error("发布失败:", error);
      showToast("创建失败，请重试");
    }
  }, [
    toolType,
    toolAction,
    isRecreateMode,
    seatDrawTopicInput,
    drawCountPickerValue,
    seatDrawExcludePreviouslyDrawn,
    seatDrawExcludeAdmin,
    fetchToolDetail,
    showToast,
  ]);

  // 开始抽号
  const handleSeatDrawRun = useCallback(async () => {
    try {
      await toolAction(toolType, "start-seat-draw");
      await fetchToolDetail();
    } catch (error) {
      console.error("开始抽号失败:", error);
    }
  }, [toolType, toolAction, fetchToolDetail]);

  // 投票主题输入
  const handleVoteTopicInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVoteTopicInput(e.target.value);
  }, []);

  // 投票选项输入
  const handleVoteOptionsInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setVoteOptionsInput(e.target.value);
  }, []);

  // 投票模式选择
  const handleVoteModeSelect = useCallback((mode: VoteSelectionMode) => {
    setVoteSelectionMode(mode);
    if (mode === "single") {
      setVoteMaxSelectionsInput("1");
    }
  }, []);

  // 投票最多可选输入
  const handleVoteMaxSelectionsInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVoteMaxSelectionsInput(e.target.value);
  }, []);

  // 投票去除管理员
  const handleVoteExcludeAdminChange = useCallback((checked: boolean) => {
    setVoteExcludeAdmin(checked);
  }, []);

  // 投票发布
  const handleVotePublish = useCallback(async () => {
    try {
      const input = {
        topic: voteTopicInput,
        options: parseVoteOptions(voteOptionsInput),
        selectionMode: voteSelectionMode,
        maxSelections:
          voteSelectionMode === "multiple" ? Number(voteMaxSelectionsInput) : 1,
        excludeAdmin: voteExcludeAdmin,
      };
      const action = isRecreateMode ? "recreate-vote" : "publish-vote";
      await toolAction(toolType, action, input);
      setIsDraftEditing(false);
      showToast(isRecreateMode ? "投票已重新创建" : "投票已发布");
      await fetchToolDetail();
    } catch (error) {
      console.error("发布失败:", error);
      showToast("创建失败，请重试");
    }
  }, [
    toolType,
    toolAction,
    isRecreateMode,
    voteTopicInput,
    voteOptionsInput,
    voteSelectionMode,
    voteMaxSelectionsInput,
    voteExcludeAdmin,
    fetchToolDetail,
    showToast,
  ]);

  // 投票选项选择
  const handleVoteOptionSelect = useCallback((optionId: string) => {
    if (!pageData?.voteDetail?.viewerEligible) return;
    if (pageData.voteDetail.phase !== "active") return;
    if (pageData.voteDetail.viewerChoice === "abstain") return;

    const validOptionIds = new Set(pageData.voteDetail.options.map(opt => opt.id));
    const persistedOptionIds = new Set(pageData.voteDetail.viewerSelectedOptionIds);
    if (voteSelectionMode === "multiple" && persistedOptionIds.has(optionId)) return;

    let newSelectedOptionIds: string[];
    if (voteSelectionMode === "single") {
      newSelectedOptionIds = voteSelectedOptionIds.includes(optionId)
        ? []
        : [optionId];
    } else {
      if (voteSelectedOptionIds.includes(optionId)) {
        newSelectedOptionIds = voteSelectedOptionIds.filter(id => id !== optionId);
      } else {
        if (voteSelectedOptionIds.length >= pageData.voteDetail.maxSelections) {
          showToast(`当前投票最多可选择 ${pageData.voteDetail.maxSelections} 项。`);
          return;
        }
        newSelectedOptionIds = [...voteSelectedOptionIds, optionId];
      }
    }

    const validSelectedOptionIds = newSelectedOptionIds.filter(id => validOptionIds.has(id));
    setVoteSelectedOptionIds(validSelectedOptionIds);

    const voteInteraction = buildVoteInteractionState(pageData, validSelectedOptionIds);
    setVoteApproveDisabled(voteInteraction.approveDisabled);
    setVoteAbstainDisabled(voteInteraction.abstainDisabled);
    setVoteViewerResultLabel(voteInteraction.viewerResultLabel);
  }, [pageData, voteSelectionMode, voteSelectedOptionIds, showToast]);

  // 提交投票
  const handleVoteSubmit = useCallback(async (choice: VoteChoice) => {
    if (choice === "approve" && voteApproveDisabled) return;
    if (choice === "abstain" && voteAbstainDisabled) return;

    try {
      await toolAction(toolType, "submit-vote", {
        choice,
        optionIds: choice === "approve" ? voteSelectedOptionIds : [],
      });
      showToast("已完成投票");
      await fetchToolDetail();
    } catch (error) {
      console.error("提交失败:", error);
    }
  }, [toolType, toolAction, voteApproveDisabled, voteAbstainDisabled, voteSelectedOptionIds, fetchToolDetail, showToast]);

  // 结束投票
  const handleVoteEnd = useCallback(async () => {
    try {
      await toolAction(toolType, "end-vote");
      showToast("投票已结束");
      await fetchToolDetail();
    } catch (error) {
      console.error("结束投票失败:", error);
    }
  }, [toolType, toolAction, fetchToolDetail, showToast]);

  // 转盘主题输入
  const handleWheelTopicInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWheelTopicInput(e.target.value);
  }, []);

  // 转盘选项输入
  const handleWheelItemsInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWheelItemsInput(e.target.value);
  }, []);

  // 转盘允许指定用户
  const handleWheelAllowAssignedUserChange = useCallback((checked: boolean) => {
    setWheelAllowAssignedUser(checked);
  }, []);

  // 转盘指定用户变化
  const handleWheelAssignedUserChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = Number(e.target.value);
    const eligibleUsers = pageData?.wheelDetail?.eligibleUsers ?? [];
    const targetUser = eligibleUsers[index] ?? eligibleUsers[0] ?? null;
    setWheelAssignedUserIndex(index);
    setWheelAssignedUserId(targetUser?.userId ?? "");
  }, [pageData]);

  // 转盘发布
  const handleWheelPublish = useCallback(async () => {
    try {
      const input = {
        topic: wheelTopicInput,
        items: parseWheelItems(wheelItemsInput),
        allowAssignedUser: wheelAllowAssignedUser,
        assignedUserId: wheelAllowAssignedUser ? wheelAssignedUserId : null,
      };
      const action = isRecreateMode ? "recreate-wheel" : "publish-wheel";
      await toolAction(toolType, action, input);
      setIsDraftEditing(false);
      showToast(isRecreateMode ? "转盘已重新创建" : "转盘内容已确定");
      await fetchToolDetail();
    } catch (error) {
      console.error("发布失败:", error);
      showToast("创建失败，请重试");
    }
  }, [
    toolType,
    toolAction,
    isRecreateMode,
    wheelTopicInput,
    wheelItemsInput,
    wheelAllowAssignedUser,
    wheelAssignedUserId,
    fetchToolDetail,
    showToast,
  ]);

  // 转盘旋转
  const handleWheelSpin = useCallback(async () => {
    if (wheelSpinning) return;
    if (!pageData?.wheelDetail?.viewerCanSpin) return;

    try {
      const currentItems = pageData.wheelDetail?.items ?? [];
      const previousHistoryLabels = wheelVisibleHistoryLabels.slice();
      
      // 随机选择结果
      const selectedIndex = await pickSecureRandomIndex(currentItems.length);

      // 先开始旋转，设置旋转动画
      setWheelSpinning(true);
      setWheelShowResult(false);
      setWheelVisibleHistoryLabels(previousHistoryLabels);

      // 调用服务层
      await toolAction(toolType, "spin-wheel");
      
      // 等待获取最新结果
      await fetchToolDetail();

      // 获取最新的工具详情
      const updatedResult = await getToolDetail(toolType);
      if (updatedResult.wheelDetail) {
        const resultIndex = updatedResult.wheelDetail.resultIndex ?? 0;
        const resultItems = updatedResult.wheelDetail.items ?? [];
        const targetRotationBase = getWheelTargetRotation(resultItems.length, resultIndex);
        const currentRotationBase = normalizeRotation(wheelRotation);
        const rotationDelta = normalizeRotation(targetRotationBase - currentRotationBase);
        const targetRotation = wheelRotation + 2160 + rotationDelta;

        // 设置旋转动画
        setWheelTransitionMs(4800);
        setWheelRotation(targetRotation);
      }

      // 4.8秒后完成旋转
      setTimeout(() => {
        setWheelSpinning(false);
        setWheelShowResult(true);
        showToast("大转盘已启动");
      }, 4800);
    } catch (error) {
      console.error("旋转失败:", error);
      setWheelSpinning(false);
    }
  }, [toolType, toolAction, wheelSpinning, pageData, wheelVisibleHistoryLabels, wheelRotation, fetchToolDetail, getToolDetail, showToast]);

  // 转盘中心点击
  const handleWheelCenterTap = useCallback(() => {
    if (!pageData?.isStarted || isDraftEditing) return;
    handleWheelSpin();
  }, [pageData, isDraftEditing, handleWheelSpin]);

  // 抽签主题输入
  const handleLotteryTopicInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLotteryTopicInput(e.target.value);
  }, []);

  // 抽签答案输入
  const handleLotteryAnswersInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLotteryAnswersInput(e.target.value);
  }, []);

  // 抽签次数输入
  const handleLotteryDrawLimitInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLotteryDrawLimitInput(e.target.value);
  }, []);

  // 抽签允许指定用户
  const handleLotteryAllowAssignedUserChange = useCallback((checked: boolean) => {
    setLotteryAllowAssignedUser(checked);
  }, []);

  // 抽签指定用户变化
  const handleLotteryAssignedUserChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = Number(e.target.value);
    const eligibleUsers = pageData?.lotteryDetail?.eligibleUsers ?? [];
    const targetUser = eligibleUsers[index] ?? eligibleUsers[0] ?? null;
    setLotteryAssignedUserIndex(index);
    setLotteryAssignedUserId(targetUser?.userId ?? "");
  }, [pageData]);

  // 抽签发布
  const handleLotteryPublish = useCallback(async () => {
    try {
      const input = {
        topic: lotteryTopicInput,
        answers: parseLotteryAnswers(lotteryAnswersInput),
        drawLimitPerUser: Number(lotteryDrawLimitInput),
        allowAssignedUser: lotteryAllowAssignedUser,
        assignedUserId: lotteryAllowAssignedUser ? lotteryAssignedUserId : null,
      };
      const action = isRecreateMode ? "recreate-lottery" : "publish-lottery";
      await toolAction(toolType, action, input);
      setIsDraftEditing(false);
      showToast(isRecreateMode ? "抓阄已重新创建" : "抓阄已发布");
      await fetchToolDetail();
    } catch (error) {
      console.error("发布失败:", error);
      showToast("创建失败，请重试");
    }
  }, [
    toolType,
    toolAction,
    isRecreateMode,
    lotteryTopicInput,
    lotteryAnswersInput,
    lotteryDrawLimitInput,
    lotteryAllowAssignedUser,
    lotteryAssignedUserId,
    fetchToolDetail,
    showToast,
  ]);

  // 抽签卡片点击
  const handleLotteryCardTap = useCallback(async (cardId: string) => {
    const cards = pageData?.lotteryDetail?.cards ?? [];
    const card = cards.find(c => c.id === cardId);
    if (!card?.canClaim) return;

    try {
      setLotteryFlippingCardId(cardId);
      await toolAction(toolType, "claim-lottery", { cardId });
      showToast("结果已揭晓");
      await fetchToolDetail();
    } catch (error) {
      console.error("翻卡失败:", error);
      setLotteryFlippingCardId("");
    }
  }, [toolType, toolAction, pageData, fetchToolDetail, showToast]);

  // 重置
  const handleReset = useCallback(async () => {
    try {
      let action: string;
      switch (toolType) {
        case "seat-draw":
          action = "reset-seat-draw";
          break;
        case "vote":
          action = "reset-vote";
          break;
        case "wheel":
          action = "reset-wheel";
          break;
        case "lottery":
          action = "reset-lottery";
          break;
        default:
          return;
      }
      setShowActionSheet(false);
      await toolAction(toolType, action);
      showToast("已重置当前玩法");
      await fetchToolDetail();
    } catch (error) {
      console.error("重置失败:", error);
    }
  }, [toolType, toolAction, fetchToolDetail, showToast]);

  // 关闭工具
  const handleCloseTool = useCallback(async () => {
    try {
      let action: string;
      switch (toolType) {
        case "seat-draw":
          action = "close-seat-draw";
          break;
        case "vote":
          action = "close-vote";
          break;
        case "wheel":
          action = "close-wheel";
          break;
        case "lottery":
          action = "close-lottery";
          break;
        default:
          return;
      }
      setShowActionSheet(false);
      await toolAction(toolType, action);
      showToast("玩法已关闭");
      router.push("/tools");
    } catch (error) {
      console.error("关闭失败:", error);
    }
  }, [toolType, toolAction, router, showToast]);

  // 打开操作菜单
  const handleOpenActionSheet = useCallback(() => {
    setShowActionSheet(true);
  }, []);

  // 关闭操作菜单
  const handleCloseActionSheet = useCallback(() => {
    setShowActionSheet(false);
  }, []);

  // 初始化和清理
  useEffect(() => {
    if (isValid && data?.currentTrip) {
      fetchToolDetail();
    }

    return () => {
      if (seatDrawRollingSyncTimerRef.current) {
        clearInterval(seatDrawRollingSyncTimerRef.current);
      }
      if (voteRefreshTimerRef.current) {
        clearInterval(voteRefreshTimerRef.current);
      }
    };
  }, [isValid, data?.currentTrip, fetchToolDetail]);

  // 页面数据更新后同步定时器
  useEffect(() => {
    if (pageData) {
      syncSeatDrawRollingTimer(pageData);
      syncVoteRefreshTimer(pageData);
    }
  }, [pageData, syncSeatDrawRollingTimer, syncVoteRefreshTimer]);

  // 验证工具类型
  if (!isValid) {
    return (
      <div className={styles.page}>
        <PageNavbar title="工具详情" onBack={handleBack} />
        <div className={styles.invalidWrap}>
          <div className={styles.invalidText}>未知的工具类型</div>
          <button className={styles.backHomeBtn} onClick={handleBack}>
            返回工具列表
          </button>
        </div>
      </div>
    );
  }

  // 没有当前车次
  if (!data?.currentTrip) {
    return (
      <div className={styles.page}>
        <PageNavbar title={TOOL_META[toolType].title} onBack={handleBack} />
        <div className={styles.invalidWrap}>
          <div className={styles.invalidText}>请先加入或创建车次</div>
          <button className={styles.backHomeBtn} onClick={handleBack}>
            返回工具列表
          </button>
        </div>
      </div>
    );
  }

  // 加载中
  if (loading || !pageData) {
    return (
      <div className={styles.page}>
        <PageNavbar title={TOOL_META[toolType].title} onBack={handleBack} />
        <div className={styles.loadingWrap}>
          <span style={{ color: "#b6bac1", fontSize: 13 }}>加载中...</span>
        </div>
      </div>
    );
  }

  // 主渲染
  return (
    <div className={`${styles.page} ${toolType === "seat-draw" ? styles["page--seat-draw"] : ""} ${pageData.isAdmin && (!pageData.isStarted || isDraftEditing) ? styles["page--editor"] : ""}`}>
      <PageNavbar title={pageData.toolTitle} onBack={handleBack} />

      <div className={styles.content}>
        {/* 未开启 + 管理员 + 未编辑 */}
        {!pageData.isStarted && pageData.isAdmin && !isDraftEditing && (
          <div className={styles.emptyWrap}>
            <div className={styles.emptyHint}>随机从车上成员里抽取1位或多位小伙伴</div>
            <button className={styles.createBtn} onClick={handleCreateDraft}>
              创建玩法
            </button>
          </div>
        )}

        {/* 未开启 + 普通用户 */}
        {!pageData.isStarted && !pageData.isAdmin && (
          <div className={styles.emptyWrap}>
            <div className={styles.viewerEmpty}>🙋‍♀️ 玩法暂未开启</div>
          </div>
        )}

        {/* 编辑草稿 */}
        {pageData.isAdmin && isDraftEditing && (
          <div className={styles.editorWrap}>
            {renderEditor(
              toolType,
              pageData,
              {
                seatDrawTopicInput,
                drawCountPickerValue,
                seatDrawCountLabel,
                seatDrawExcludePreviouslyDrawn,
                seatDrawExcludeAdmin,
                voteTopicInput,
                voteOptionsInput,
                voteSelectionMode,
                voteMaxSelectionsInput,
                voteExcludeAdmin,
                wheelTopicInput,
                wheelItemsInput,
                wheelAllowAssignedUser,
                wheelAssignedUserId,
                lotteryTopicInput,
                lotteryAnswersInput,
                lotteryDrawLimitInput,
                lotteryAllowAssignedUser,
                lotteryAssignedUserId,
              },
              {
                handleSeatDrawTopicInput,
                handleSeatDrawCountChange,
                handleSeatDrawExcludePreviouslyDrawnChange,
                handleSeatDrawExcludeAdminChange,
                handleSeatDrawPublish,
                handleVoteTopicInput,
                handleVoteOptionsInput,
                handleVoteModeSelect,
                handleVoteMaxSelectionsInput,
                handleVoteExcludeAdminChange,
                handleVotePublish,
                handleWheelTopicInput,
                handleWheelItemsInput,
                handleWheelAllowAssignedUserChange,
                handleWheelAssignedUserChange,
                handleWheelPublish,
                handleLotteryTopicInput,
                handleLotteryAnswersInput,
                handleLotteryDrawLimitInput,
                handleLotteryAllowAssignedUserChange,
                handleLotteryAssignedUserChange,
                handleLotteryPublish,
              },
              isRecreateMode,
            )}
          </div>
        )}

        {/* 已开启 - 渲染工具详情 */}
        {pageData.isStarted && renderActiveView(
          toolType,
          pageData,
          heroView,
          {
            voteSelectedOptionIds,
            voteViewerResultLabel,
            voteApproveDisabled,
            voteAbstainDisabled,
            wheelRotation,
            wheelTransitionMs,
            wheelSpinning,
            wheelVisibleHistoryLabels,
            wheelShowResult,
            lotteryFlippingCardId,
          },
          {
            handleSeatDrawRun,
            handleVoteOptionSelect,
            handleVoteSubmit,
            handleVoteEnd,
            handleWheelSpin,
            handleWheelCenterTap,
            handleLotteryCardTap,
            handleOpenActionSheet,
          },
        )}
      </div>

      {/* 操作菜单 */}
      <ActionSheet
        visible={showActionSheet}
        actions={[
          {
            label: "重置",
            onClick: handleReset,
            icon: "/assets/icons/icon_tools_reset.svg",
            description: "清除所有历史结果",
          },
          {
            label: "重新创建",
            onClick: handleRecreateDraft,
            icon: "/assets/icons/icon_tools_recreat.svg",
            description: "清除所有内容",
          },
          {
            label: "关闭玩法",
            onClick: handleCloseTool,
            icon: "/assets/icons/icon_tools_close.svg",
            isDanger: true,
          },
        ]}
        onClose={handleCloseActionSheet}
      />

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}

// 构建英雄视图
function buildToolHeroView(pageData: any) {
  if (!pageData.isStarted) return null;

  const TOOL_HERO_ILLUSTRATIONS: Record<ToolType, string> = {
    "seat-draw": "/assets/icons/pic_tools_seatdraw_star.png",
    "vote": "/assets/icons/icon_tools_投票.png",
    "wheel": "/assets/icons/icon_tools_幸运大转盘.png",
    "lottery": "/assets/icons/icon_tools_抽签.png",
  };

  if (pageData.toolType === "seat-draw" && pageData.seatDrawDetail) {
    return {
      eyebrowText: "本次主题",
      titleText: getHeroTopic(pageData.seatDrawDetail.topic, "随机抽"),
      subtitleText: `要求:${pageData.seatDrawDetail.drawCount}人`,
      illustrationSrc: TOOL_HERO_ILLUSTRATIONS["seat-draw"],
      illustrationClassName: "tool-hero-illustration tool-hero-illustration--seat-draw",
      resultTitle: "历史记录",
    };
  }

  if (pageData.toolType === "vote" && pageData.voteDetail) {
    return {
      eyebrowText: "本次主题",
      titleText: getHeroTopic(pageData.voteDetail.topic, "做选择"),
      subtitleText: `要求:${pageData.voteDetail.maxSelections}项`,
      illustrationSrc: TOOL_HERO_ILLUSTRATIONS["vote"],
      illustrationClassName: "tool-hero-illustration tool-hero-illustration--icon",
      resultTitle: "历史记录",
    };
  }

  if (pageData.toolType === "wheel" && pageData.wheelDetail) {
    return {
      eyebrowText: "本次主题",
      titleText: getHeroTopic(pageData.wheelDetail.topic, "大转盘"),
      subtitleText: `奖项:${pageData.wheelDetail.items.length}项`,
      illustrationSrc: TOOL_HERO_ILLUSTRATIONS["wheel"],
      illustrationClassName: "tool-hero-illustration tool-hero-illustration--icon",
      resultTitle: "历史记录",
    };
  }

  if (pageData.toolType === "lottery" && pageData.lotteryDetail) {
    return {
      eyebrowText: "本次主题",
      titleText: getHeroTopic(pageData.lotteryDetail.topic, "幸运签"),
      subtitleText: `次数:${pageData.lotteryDetail.drawLimitPerUser}次`,
      illustrationSrc: TOOL_HERO_ILLUSTRATIONS["lottery"],
      illustrationClassName: "tool-hero-illustration tool-hero-illustration--icon",
      resultTitle: "历史记录",
    };
  }

  return null;
}

// 构建投票交互状态
function buildVoteInteractionState(
  pageData: any,
  selectedIds: string[]
): {
  approveDisabled: boolean;
  abstainDisabled: boolean;
  viewerResultLabel: string;
} {
  const detail = pageData?.voteDetail;
  if (!detail) {
    return {
      approveDisabled: true,
      abstainDisabled: true,
      viewerResultLabel: "",
    };
  }

  if (!detail.viewerEligible) {
    return {
      approveDisabled: true,
      abstainDisabled: true,
      viewerResultLabel: "",
    };
  }
  if (detail.phase !== "active") {
    return {
      approveDisabled: true,
      abstainDisabled: true,
      viewerResultLabel: detail.phase === "ended" ? "本轮投票已结束。" : "",
    };
  }

  const validOptionIds = new Set(detail.options.map((option: any) => option.id));
  const currentSelectedIds = Array.from(new Set(selectedIds)).filter((optionId) =>
    validOptionIds.has(optionId)
  );

  let viewerResultLabel = "";
  if (detail.viewerChoice === "approve") {
    viewerResultLabel = "你已完成投票。";
  } else if (detail.viewerChoice === "abstain") {
    viewerResultLabel = "你已完成弃权。";
  }

  return {
    approveDisabled: detail.viewerHasSubmitted || currentSelectedIds.length === 0,
    abstainDisabled: detail.viewerHasSubmitted,
    viewerResultLabel,
  };
}

// 构建投票选项卡片
function buildVoteOptionCards(pageData: any, selectedIds: string[]) {
  const detail = pageData?.voteDetail;
  const selectedIdSet = new Set(selectedIds);
  const shouldShowResult = Boolean(
    detail && (detail.phase === "ended" || (detail.phase === "active" && detail.viewerHasSubmitted))
  );
  const shouldShowCheckbox = Boolean(
    detail && detail.phase === "active" && detail.viewerEligible && !detail.viewerHasSubmitted
  );

  return (detail?.options ?? []).map((option: any, index: number) => {
    const isSelected = option.selectedByViewer || selectedIdSet.has(option.id);
    const supportRate =
      detail && detail.participantCount > 0
        ? Math.round((option.supportCount / detail.participantCount) * 100)
        : 0;

    return {
      id: option.id,
      title: `选项${index + 1}`,
      label: option.label,
      supportCount: option.supportCount,
      supportCountText: String(option.supportCount),
      supportRateText: `${supportRate}%`,
      isSelected,
      showCheckbox: shouldShowCheckbox,
      checkboxClassName: isSelected ? "vote-option-check is-selected" : "vote-option-check",
      showResult: shouldShowResult,
      className: isSelected ? "vote-option-card is-selected" : "vote-option-card",
    };
  });
}
// 构建抽号机器类名
function buildSeatDrawMachineClass(slots: any[]) {
  if (slots.length >= 5) {
    return "seat-draw-machine is-compact";
  }
  if (slots.length === 4) {
    return "seat-draw-machine is-medium";
  }
  return "seat-draw-machine is-large";
}

// 渲染编辑器
function renderEditor(
  toolType: ToolType,
  pageData: any,
  formState: any,
  handlers: any,
  isRecreateMode: boolean,
) {
  const styles = require("./page.module.css");
  
  switch (toolType) {
    case "seat-draw":
      return (
        <div className={styles.editorCard}>
          <div className={styles.editorRow}>
            <div className={styles.editorLabel}>主题名称</div>
            <input
              className={styles.editorInput}
              value={formState.seatDrawTopicInput}
              maxLength={20}
              placeholder="请输入主题名称，20个字以内"
              onChange={handlers.handleSeatDrawTopicInput}
            />
          </div>

          <div className={styles.editorRow}>
            <div className={styles.editorLabel}>抽号人数</div>
            <select
              className={styles.editorSelect}
              value={formState.drawCountPickerValue}
              onChange={handlers.handleSeatDrawCountChange}
            >
              {DRAW_COUNT_OPTIONS.map((count, index) => (
                <option key={count} value={index}>
                  {count}人
                </option>
              ))}
            </select>
          </div>

          <div className={styles.switchRow}>
            <div className={styles.switchText}>多次抽取剔除重复号码</div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={formState.seatDrawExcludePreviouslyDrawn}
                onChange={(e) => handlers.handleSeatDrawExcludePreviouslyDrawnChange(e.target.checked)}
              />
              <span className={styles.switchSlider} />
            </label>
          </div>

          <div className={styles.switchRow}>
            <div className={styles.switchText}>不包含管理员</div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={formState.seatDrawExcludeAdmin}
                onChange={(e) => handlers.handleSeatDrawExcludeAdminChange(e.target.checked)}
              />
              <span className={styles.switchSlider} />
            </label>
          </div>

          <button className={styles.publishBtn} onClick={handlers.handleSeatDrawPublish}>
            {isRecreateMode ? "重新创建" : "立即创建"}
          </button>
        </div>
      );

    case "vote":
      return (
        <div className={styles.editorCard}>
          <div className={styles.editorRow}>
            <div className={styles.editorLabel}>主题名称</div>
            <input
              className={styles.editorInput}
              value={formState.voteTopicInput}
              maxLength={30}
              placeholder="请输入主题名称"
              onChange={handlers.handleVoteTopicInput}
            />
          </div>

          <div className={styles.editorField}>
            <div className={styles.editorLabel}>投票选项</div>
            <textarea
              className={styles.editorTextarea}
              value={formState.voteOptionsInput}
              maxLength={240}
              placeholder="一行一个选项"
              onChange={handlers.handleVoteOptionsInput}
            />
          </div>

          <div className={styles.modeRow}>
            <div className={styles.modeTitle}>投票方式</div>
            <div className={styles.modeSwitches}>
              <button
                className={`${styles.modeChip} ${formState.voteSelectionMode === "single" ? styles.modeChipActive : ""}`}
                onClick={() => handlers.handleVoteModeSelect("single")}
              >
                单选
              </button>
              <button
                className={`${styles.modeChip} ${formState.voteSelectionMode === "multiple" ? styles.modeChipActive : ""}`}
                onClick={() => handlers.handleVoteModeSelect("multiple")}
              >
                多选
              </button>
            </div>
          </div>

          {formState.voteSelectionMode === "multiple" && (
            <div className={styles.editorRow}>
              <div className={styles.editorLabel}>最多可选</div>
              <input
                className={styles.editorInput}
                type="number"
                value={formState.voteMaxSelectionsInput}
                placeholder="请输入最多可选项数"
                onChange={handlers.handleVoteMaxSelectionsInput}
              />
            </div>
          )}

          <div className={styles.switchRow}>
            <div className={styles.switchText}>去除管理员</div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={formState.voteExcludeAdmin}
                onChange={(e) => handlers.handleVoteExcludeAdminChange(e.target.checked)}
              />
              <span className={styles.switchSlider} />
            </label>
          </div>

          <button className={styles.publishBtn} onClick={handlers.handleVotePublish}>
            {isRecreateMode ? "重新创建" : "立即创建"}
          </button>
        </div>
      );

    case "wheel":
      return (
        <div className={styles.editorCard}>
          <div className={styles.editorRow}>
            <div className={styles.editorLabel}>主题名称</div>
            <input
              className={styles.editorInput}
              value={formState.wheelTopicInput}
              maxLength={30}
              placeholder="请输入主题名称"
              onChange={handlers.handleWheelTopicInput}
            />
          </div>

          <div className={styles.editorField}>
            <div className={styles.editorLabel}>奖品项</div>
            <textarea
              className={styles.editorTextarea}
              value={formState.wheelItemsInput}
              maxLength={200}
              placeholder="一行一个奖品项"
              onChange={handlers.handleWheelItemsInput}
            />
            <div className={styles.editorHint}>至少 2 项，最多 10 项。</div>
          </div>

          <div className={styles.switchRow}>
            <div className={styles.switchText}>使用人</div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={formState.wheelAllowAssignedUser}
                onChange={(e) => handlers.handleWheelAllowAssignedUserChange(e.target.checked)}
              />
              <span className={styles.switchSlider} />
            </label>
          </div>

          {formState.wheelAllowAssignedUser && pageData.wheelDetail?.eligibleUsers?.length > 0 && (
            <div className={styles.editorField}>
              <div className={styles.editorLabel}>指定成员</div>
              <select
                className={styles.editorSelect}
                value={pageData.wheelDetail.eligibleUsers.findIndex((u: any) => u.userId === formState.wheelAssignedUserId) || 0}
                onChange={handlers.handleWheelAssignedUserChange}
              >
                {pageData.wheelDetail.eligibleUsers.map((member: any, index: number) => (
                  <option key={member.userId} value={index}>
                    {member.nickname} / {member.seatLabel}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className={styles.publishBtn} onClick={handlers.handleWheelPublish}>
            {isRecreateMode ? "重新创建" : "立即创建"}
          </button>
        </div>
      );

    case "lottery":
      return (
        <div className={styles.editorCard}>
          <div className={styles.editorRow}>
            <div className={styles.editorLabel}>主题名称</div>
            <input
              className={styles.editorInput}
              value={formState.lotteryTopicInput}
              maxLength={30}
              placeholder="请输入主题名称"
              onChange={handlers.handleLotteryTopicInput}
            />
          </div>

          <div className={styles.editorField}>
            <div className={styles.editorLabel}>答案</div>
            <textarea
              className={styles.editorTextarea}
              value={formState.lotteryAnswersInput}
              maxLength={500}
              placeholder="一行一个答案"
              onChange={handlers.handleLotteryAnswersInput}
            />
            <div className={styles.editorHint}>每行对应 1 张卡片，创建后会随机打乱并固定映射。</div>
          </div>

          <div className={styles.editorRow}>
            <div className={styles.editorLabel}>次数</div>
            <input
              className={styles.editorInput}
              type="number"
              value={formState.lotteryDrawLimitInput}
              onChange={handlers.handleLotteryDrawLimitInput}
            />
          </div>

          <div className={styles.switchRow}>
            <div className={styles.switchText}>指定使用人</div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={formState.lotteryAllowAssignedUser}
                onChange={(e) => handlers.handleLotteryAllowAssignedUserChange(e.target.checked)}
              />
              <span className={styles.switchSlider} />
            </label>
          </div>

          {formState.lotteryAllowAssignedUser && pageData.lotteryDetail?.eligibleUsers?.length > 0 && (
            <div className={styles.editorField}>
              <div className={styles.editorLabel}>指定成员</div>
              <select
                className={styles.editorSelect}
                value={pageData.lotteryDetail.eligibleUsers.findIndex((u: any) => u.userId === formState.lotteryAssignedUserId) || 0}
                onChange={handlers.handleLotteryAssignedUserChange}
              >
                {pageData.lotteryDetail.eligibleUsers.map((member: any, index: number) => (
                  <option key={member.userId} value={index}>
                    {member.nickname} / {member.seatLabel}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className={styles.publishBtn} onClick={handlers.handleLotteryPublish}>
            {isRecreateMode ? "重新创建" : "立即创建"}
          </button>
        </div>
      );

    default:
      return null;
  }
}

// 渲染活动视图
function renderActiveView(
  toolType: ToolType,
  pageData: any,
  heroView: any,
  uiState: any,
  handlers: any,
) {
  const styles = require("./page.module.css");

  switch (toolType) {
    case "seat-draw":
      if (!pageData.seatDrawDetail) return null;
      
      const seatDrawDetail = pageData.seatDrawDetail;
      const seatDrawMachineClass = buildSeatDrawMachineClass(seatDrawDetail.displaySlots);
      
      return (
        <div className={styles.activeView}>
          <div className={styles.heroCard}>
            <div className={styles.heroEyebrow}>{heroView?.eyebrowText}</div>
            <div className={styles.heroTitle}>{heroView?.titleText}</div>
            <div className={styles.heroSubtitle}>{heroView?.subtitleText}</div>

            {/* 老虎机动画区域 */}
            <div className={seatDrawMachineClass}>
              <div className={styles["machine-handle-left"]} />
              <div className={styles.machineShell}>
                <div className={styles.machineWindow}>
                  {seatDrawDetail.displaySlots.map((slot: any) => (
                    <div
                      key={slot.id}
                      className={styles.slot}
                    >
                      <span className={slot.isPlaceholder ? styles["slot-placeholder"] : ""}>
                        {slot.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles["machine-handle-right"]} />
            </div>

            {/* 操作按钮 */}
            <div className={styles.heroFooter}>
              {pageData.isAdmin ? (
                <>
                  {seatDrawDetail.phase === "ready" && (
                    <button
                      className={styles.heroPrimaryBtn}
                      onClick={handlers.handleSeatDrawRun}
                      disabled={seatDrawDetail.remainingCount === 0}
                    >
                      开始抽号
                    </button>
                  )}
                  {seatDrawDetail.phase === "rolling" && (
                    <>
                      <button
                        className={`${styles.heroPrimaryBtn} ${styles.heroBtnDisabled}`}
                        disabled
                      >
                        抽号中...
                      </button>
                      <button className={`${styles.heroPrimaryBtn} ${styles.heroBtnSecondary}`} disabled>
                        再抽一次
                      </button>
                    </>
                  )}
                  {seatDrawDetail.phase === "result" && (
                    <>
                      <button
                        className={`${styles.heroPrimaryBtn} ${styles.heroBtnDisabled}`}
                        disabled
                      >
                        抽号已结束
                      </button>
                      <button
                        className={`${styles.heroPrimaryBtn} ${styles.heroBtnSecondary}`}
                        onClick={handlers.handleSeatDrawRun}
                        disabled={!seatDrawDetail.canDrawAgain}
                      >
                        再抽一次
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className={styles.heroStatus}>
                  {seatDrawDetail.phase === "ready" ? "抽号即将开始" :
                   seatDrawDetail.phase === "rolling" ? "抽号即将开始" : "已结束"}
                </div>
              )}
            </div>
          </div>

          {/* 更多操作 */}
          {pageData.isAdmin && (
            <button
              className={seatDrawDetail.phase === "rolling" ? `${styles.moreAction} ${styles.moreActionDisabled}` : styles.moreAction}
              onClick={seatDrawDetail.phase !== "rolling" ? handlers.handleOpenActionSheet : undefined}
            >
              更多操作
            </button>
          )}

          {/* 结果记录 */}
          <div className={styles.resultCard}>
            <div className={styles.resultTitle}>{heroView?.resultTitle}</div>
            {seatDrawDetail.resultRounds.length === 0 ? (
              <div className={styles.resultEmpty}>暂无记录</div>
            ) : (
              seatDrawDetail.resultRounds.map((round: any, index: number) => (
                <div key={index} className={styles.resultItem}>
                  <span>{index + 1}.</span>
                  <span>{round.displayText}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );

    case "vote":
      if (!pageData.voteDetail) return null;
      
      const voteDetail = pageData.voteDetail;
      const voteOptionCards = buildVoteOptionCards(pageData, uiState.voteSelectedOptionIds);
      
      return (
        <div className={styles.activeView}>
          <div className={styles.heroCard}>
            <div className={styles.heroEyebrow}>{heroView?.eyebrowText}</div>
            <div className={styles.heroTitle}>{heroView?.titleText}</div>
            <div className={styles.heroSubtitle}>{heroView?.subtitleText}</div>

            {/* 投票进度 */}
            <div className={styles.voteProgress}>
              已投 {voteDetail.submittedCount} / {voteDetail.participantCount}
            </div>

            {/* 投票选项 */}
            <div className={styles.voteOptions}>
              {voteOptionCards.map((optionCard: any) => (
                <div
                  key={optionCard.id}
                  className={optionCard.className}
                  data-option-id={optionCard.id}
                  onClick={() => handlers.handleVoteOptionSelect(optionCard.id)}
                >
                  <div className={styles.voteOptionCopy}>
                    <div className={styles.voteOptionTitle}>{optionCard.title}</div>
                    <div className={styles.voteOptionLabel}>{optionCard.label}</div>
                  </div>
                  {optionCard.showCheckbox && (
                    <div className={optionCard.checkboxClassName}>
                      <span className={styles.voteOptionCheckmark}>✓</span>
                    </div>
                  )}
                  {optionCard.showResult && (
                    <div className={styles.voteOptionResult}>
                      <div className={styles.voteOptionResultCount}>
                        <span className={styles.voteOptionResultNumber}>{optionCard.supportCountText}</span>
                        <span>票</span>
                      </div>
                      <div className={styles.voteOptionResultRate}>{optionCard.supportRateText}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 查看结果标签 */}
            {uiState.voteViewerResultLabel && (
              <div className={styles.voteViewerResultLabel}>
                {uiState.voteViewerResultLabel}
              </div>
            )}

            {/* 操作按钮 */}
            <div className={styles.heroFooter}>
              {pageData.isAdmin && (
                <button
                  className={styles.heroGhostBtn}
                  onClick={handlers.handleVoteEnd}
                  disabled={voteDetail.phase !== "active"}
                >
                  {voteDetail.phase === "active" ? "终止" : "已结束"}
                </button>
              )}
              {voteDetail.viewerEligible && (
                <>
                  <button
                    className={`${styles.heroPrimaryBtn} ${pageData.isAdmin ? styles.heroBtnSecondary : ""} ${uiState.voteApproveDisabled ? styles.heroBtnDisabled : ""}`}
                    data-choice="approve"
                    onClick={() => handlers.handleVoteSubmit("approve")}
                    disabled={uiState.voteApproveDisabled || voteDetail.phase !== "active"}
                  >
                    {voteDetail.viewerHasSubmitted ? "已投" : voteDetail.phase === "ended" ? "已结束" : "确定"}
                  </button>
                  <button
                    className={`${styles.heroGhostBtn} ${uiState.voteAbstainDisabled ? styles.heroBtnDisabled : ""}`}
                    data-choice="abstain"
                    onClick={() => handlers.handleVoteSubmit("abstain")}
                    disabled={uiState.voteAbstainDisabled || voteDetail.phase !== "active"}
                  >
                    弃权
                  </button>
                </>
              )}
            </div>
          </div>

          {pageData.isAdmin && (
            <button
              className={styles.moreAction}
              onClick={handlers.handleOpenActionSheet}
            >
              更多操作
            </button>
          )}

          {/* 结果展示 */}
          <div className={styles.resultCard}>
            <div className={styles.resultTitle}>{heroView?.resultTitle}</div>
            {voteDetail.phase === "ended" ? (
              <div className={styles.voteFinalList}>
                {voteDetail.resultOptions.map((option: any, index: number) => (
                  <div key={option.id} className={styles.voteFinalItem}>
                    <div className={styles.voteFinalLabel}>{index + 1}. {option.label}</div>
                    <div className={styles.voteFinalCount}>{option.supportCount} 票</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.resultEmpty}>暂无记录</div>
            )}
          </div>
        </div>
      );

    case "wheel":
      if (!pageData.wheelDetail) return null;
      
      const wheelDetail = pageData.wheelDetail;
      const wheelSlices = buildWheelSlices(wheelDetail.items);
      const wheelBackgroundStyle = buildWheelBackgroundStyle(wheelDetail.items);
      
      return (
        <div className={styles.activeView}>
          <div className={styles.heroCard}>
            <div className={styles.heroEyebrow}>{heroView?.eyebrowText}</div>
            <div className={styles.heroTitle}>{heroView?.titleText}</div>
            <div className={styles.heroSubtitle}>{heroView?.subtitleText}</div>

            {/* 本轮结果 */}
            <div className={styles.wheelResult}>
              <div className={styles.wheelResultLabel}>本轮结果</div>
              <div className={styles.wheelResultValue}>
                {uiState.wheelSpinning ? "正在转动" :
                 uiState.wheelShowResult && wheelDetail.resultLabel ? wheelDetail.resultLabel : "-"}
              </div>
            </div>

            {/* 转盘区域 */}
            <div className={styles.wheelStage}>
              <div className={styles.wheelShell}>
                <div className={styles.wheelFrame}>
                  <img className={styles.wheelRingImage} src="/assets/icons/pic_tools_zhuanpan_ring.svg" alt="" />
                  
                  <div
                    className={`${styles.wheelDisc} ${uiState.wheelSpinning ? styles.wheelDiscSpinning : ""}`}
                    style={{
                      transform: `rotate(${uiState.wheelRotation}deg)`,
                      transitionDuration: `${uiState.wheelTransitionMs}ms`
                    }}
                  >
                    <div className={styles.wheelDiscSurface}>
                      <div className={styles.wheelDiscBackground} style={wheelBackgroundStyle}>
                        {wheelSlices.map((slice: any) => (
                          <div
                            key={slice.id}
                            className={slice.sliceClassName}
                            style={slice.style}
                          >
                            <div className={styles.wheelSliceLabel} style={{...slice.innerStyle, ...slice.labelStyle}}>
                              {slice.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    className={`${styles.wheelCenterButton} ${wheelDetail.viewerCanSpin ? styles.wheelCenterButtonActionable : styles.wheelCenterButtonDisabled}`}
                    onClick={handlers.handleWheelCenterTap}
                    disabled={!wheelDetail.viewerCanSpin || uiState.wheelSpinning}
                  >
                    <img className={styles.wheelCenterButtonImage} src="/assets/icons/pic_tools_zhuanpan_btn.png" alt="" />
                    <div className={styles.wheelCenterButtonText}>开始</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 更多操作 */}
          {pageData.isAdmin && (
            <button
              className={styles.moreAction}
              onClick={handlers.handleOpenActionSheet}
            >
              更多操作
            </button>
          )}

          {/* 历史记录 */}
          <div className={styles.resultCard}>
            <div className={styles.resultTitle}>{heroView?.resultTitle}</div>
            {!uiState.wheelVisibleHistoryLabels.length ? (
              <div className={styles.resultEmpty}>暂无记录</div>
            ) : (
              uiState.wheelVisibleHistoryLabels.map((label: string, index: number) => (
                <div key={index} className={styles.wheelResultItem}>
                  <span>{index + 1}. {label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );

    case "lottery":
      if (!pageData.lotteryDetail) return null;
      
      const lotteryDetail = pageData.lotteryDetail;
      
      return (
        <div className={styles.activeView}>
          <div className={styles.heroCard}>
            <div className={styles.heroEyebrow}>{heroView?.eyebrowText}</div>
            <div className={styles.heroTitle}>{heroView?.titleText}</div>
            <div className={styles.heroSubtitle}>{heroView?.subtitleText}</div>

            {/* 抽签卡片区域 */}
            <div className={styles.lotteryCardGrid}>
              {lotteryDetail.cards.map((card: any) => (
                <div
                  key={card.id}
                  className={`${styles.lotteryCard} ${
                    card.state === "viewer" ? styles.lotteryCardRevealed : ""
                  } ${card.state === "claimed" ? styles.lotteryCardClaimed : ""} ${
                    card.canClaim ? styles.lotteryCardActionable : styles.lotteryCardDisabled
                  }`}
                  onClick={() => handlers.handleLotteryCardTap(card.id)}
                >
                  <div className={styles.lotteryCardInner}>
                    <div className={styles.lotteryCardBack}>
                      <div className={styles.lotteryCardOrder}>{card.order}</div>
                      <div className={styles.lotteryCardSign}>
                        {card.state === "claimed" ? "已被抽取" : "签"}
                      </div>
                    </div>
                    <div className={styles.lotteryCardFront}>
                      <div className={styles.lotteryCardFrontLabel}>第 {card.order} 签</div>
                      <div className={styles.lotteryCardAnswer}>{card.answer}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 更多操作 */}
          {pageData.isAdmin && (
            <button
              className={styles.moreAction}
              onClick={handlers.handleOpenActionSheet}
            >
              更多操作
            </button>
          )}

          {/* 历史记录 */}
          <div className={styles.resultCard}>
            <div className={styles.resultTitle}>{heroView?.resultTitle}</div>
            {!lotteryDetail.viewerClaimRecords.length ? (
              <div className={styles.resultEmpty}>暂无记录</div>
            ) : (
              lotteryDetail.viewerClaimRecords.map((record: any) => (
                <div key={record.cardId} className={styles.lotteryResultItem}>
                  <div className={styles.lotteryResultOrder}>第 {record.order} 签</div>
                  <div className={styles.lotteryResultAnswer}>{record.answer}</div>
                </div>
              ))
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
}

// 构建转盘切片
function buildWheelSlices(items: string[]) {
  const safeItems = items.slice(0, 10);
  const step = safeItems.length ? 360 / safeItems.length : 360;
  const radius = safeItems.length > 8 ? "144px" : safeItems.length > 6 ? "154px" : "164px";
  const densityClassName = safeItems.length > 8 ? "wheel-slice is-tight" : "wheel-slice";
  const labelWidth = safeItems.length > 8 ? "122px" : safeItems.length > 6 ? "132px" : "142px";
  return safeItems.map((item, index) => {
    const angle = Number((index * step).toFixed(2));
    return {
      id: `slice-${index}`,
      label: item,
      style: { transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius})` },
      innerStyle: { transform: 'translateX(24px)' },
      sliceClassName: densityClassName,
      labelStyle: { width: labelWidth }
    };
  });
}

// 构建转盘背景样式
function buildWheelBackgroundStyle(items: string[]) {
  const safeItems = items.slice(0, 10);
  if (!safeItems.length) {
    return { background: "#ffffff" };
  }

  const step = 360 / safeItems.length;
  const startOffset = -step / 2;
  const segments = safeItems
    .map((_, index) => {
      const start = index * step;
      const end = start + step;
      const color = WHEEL_SLICE_COLORS[index % WHEEL_SLICE_COLORS.length];
      return `${color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
    })
    .join(', ');

  return { background: `conic-gradient(from ${startOffset.toFixed(2)}deg, ${segments})` };
}

// 获取转盘目标旋转角度
function getWheelTargetRotation(itemCount: number, resultIndex: number): number {
  if (!itemCount) {
    return 0;
  }

  const step = 360 / itemCount;
  const targetAngle = resultIndex * step;
  return 360 - targetAngle;
}

// 标准化旋转角度
function normalizeRotation(rotation: number): number {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

// 安全随机选择
async function pickSecureRandomIndex(itemCount: number): Promise<number> {
  if (itemCount <= 1) {
    return 0;
  }
  return Math.floor(Math.random() * itemCount);
}