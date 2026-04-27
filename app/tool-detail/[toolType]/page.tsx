"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageNavbar } from "@/components/PageNavbar/PageNavbar";
import { ActionSheet } from "@/components/ActionSheet/ActionSheet";
import { Modal } from "@/components/Modal/Modal";
import styles from "./page.module.css";

/* ========== 类型定义 ========== */

type ToolType = "seat-draw" | "vote" | "wheel" | "lottery";

const VALID_TOOL_TYPES: ToolType[] = ["seat-draw", "vote", "wheel", "lottery"];

const TOOL_TITLES: Record<ToolType, string> = {
  "seat-draw": "随机选号",
  vote: "投票",
  wheel: "大转盘",
  lottery: "幸运签",
};

const TOOL_DESCRIPTIONS: Record<ToolType, string> = {
  "seat-draw": "随机从车上成员里抽取1位或多位小伙伴",
  vote: "发起全员投票，支持单选、多选和最多可选项设置。",
  wheel: "幸运大转盘抽奖",
  lottery: "抽一支幸运签",
};

/* ========== 抽号人数选项 ========== */
const DRAW_COUNT_OPTIONS = [
  { label: "1人", value: 1 },
  { label: "2人", value: 2 },
  { label: "3人", value: 3 },
  { label: "4人", value: 4 },
  { label: "5人", value: 5 },
];

/* ========== 编辑器表单状态 ========== */
interface SeatDrawForm {
  topic: string;
  drawCount: number;
  excludePreviouslyDrawn: boolean;
  excludeAdmin: boolean;
}

interface VoteForm {
  topic: string;
  options: string[];
  selectionMode: "single" | "multiple";
  maxSelections: number;
  excludeAdmin: boolean;
}

interface WheelForm {
  topic: string;
  items: string[];
  allowAssignedUser: boolean;
  assignedUserIndex: number;
}

interface LotteryForm {
  topic: string;
  answers: string[];
  drawCount: number;
  allowAssignedUser: boolean;
  assignedUserIndex: number;
}

/* ========== 主组件 ========== */
export default function ToolDetailPage() {
  const params = useParams();
  const router = useRouter();

  const toolType = params.toolType as ToolType;
  const isValid = VALID_TOOL_TYPES.includes(toolType);

  /* 模拟数据 - 后续接入 API */
  const isAdmin = true;
  const isStarted = false;
  const isDraftEditing = false;

  /* 编辑器表单状态 */
  const [seatDrawForm, setSeatDrawForm] = useState<SeatDrawForm>({
    topic: "",
    drawCount: 1,
    excludePreviouslyDrawn: false,
    excludeAdmin: false,
  });

  const [voteForm, setVoteForm] = useState<VoteForm>({
    topic: "",
    options: [""],
    selectionMode: "single",
    maxSelections: 2,
    excludeAdmin: false,
  });

  const [wheelForm, setWheelForm] = useState<WheelForm>({
    topic: "",
    items: [""],
    allowAssignedUser: false,
    assignedUserIndex: -1,
  });

  const [lotteryForm, setLotteryForm] = useState<LotteryForm>({
    topic: "",
    answers: [""],
    drawCount: 1,
    allowAssignedUser: false,
    assignedUserIndex: -1,
  });

  /* ActionSheet 状态 */
  const [showActionSheet, setShowActionSheet] = useState(false);

  /* Modal 状态 */
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  /* ========== 路由验证 ========== */
  if (!isValid) {
    return (
      <div className={styles.page}>
        <PageNavbar title="工具详情" />
        <div className={styles.invalidWrap}>
          <div className={styles.invalidText}>未知的工具类型</div>
          <button className={styles.backHomeBtn} onClick={() => router.push("/tools")}>
            返回工具列表
          </button>
        </div>
      </div>
    );
  }

  const toolTitle = TOOL_TITLES[toolType];
  const toolDescription = TOOL_DESCRIPTIONS[toolType];

  /* ========== 操作处理 ========== */
  const handleCreateDraft = useCallback(() => {
    // 后续接入 API：创建草稿
    console.log("create draft:", toolType);
  }, [toolType]);

  const handlePublish = useCallback(() => {
    // 后续接入 API：发布工具
    console.log("publish:", toolType);
  }, [toolType]);

  const handleReset = useCallback(() => {
    setShowResetModal(false);
    // 后续接入 API：重置工具
    console.log("reset:", toolType);
  }, [toolType]);

  const handleClose = useCallback(() => {
    setShowCloseModal(false);
    // 后续接入 API：关闭工具
    console.log("close:", toolType);
    router.push("/tools");
  }, [toolType, router]);

  /* ========== 抽号表单操作 ========== */
  const handleSeatDrawTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeatDrawForm((f) => ({ ...f, topic: e.target.value }));
  };

  const handleSeatDrawCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSeatDrawForm((f) => ({ ...f, drawCount: Number(e.target.value) }));
  };

  /* ========== 投票表单操作 ========== */
  const handleVoteTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVoteForm((f) => ({ ...f, topic: e.target.value }));
  };

  const handleVoteOptionChange = (index: number, value: string) => {
    setVoteForm((f) => {
      const options = [...f.options];
      options[index] = value;
      return { ...f, options };
    });
  };

  const handleVoteOptionAdd = () => {
    setVoteForm((f) => ({ ...f, options: [...f.options, ""] }));
  };

  const handleVoteOptionRemove = (index: number) => {
    setVoteForm((f) => ({
      ...f,
      options: f.options.filter((_, i) => i !== index),
    }));
  };

  const handleVoteModeChange = (mode: "single" | "multiple") => {
    setVoteForm((f) => ({ ...f, selectionMode: mode }));
  };

  /* ========== 转盘表单操作 ========== */
  const handleWheelTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWheelForm((f) => ({ ...f, topic: e.target.value }));
  };

  const handleWheelItemChange = (index: number, value: string) => {
    setWheelForm((f) => {
      const items = [...f.items];
      items[index] = value;
      return { ...f, items };
    });
  };

  const handleWheelItemAdd = () => {
    setWheelForm((f) => ({ ...f, items: [...f.items, ""] }));
  };

  const handleWheelItemRemove = (index: number) => {
    setWheelForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }));
  };

  /* ========== 抽签表单操作 ========== */
  const handleLotteryTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLotteryForm((f) => ({ ...f, topic: e.target.value }));
  };

  const handleLotteryAnswerChange = (index: number, value: string) => {
    setLotteryForm((f) => {
      const answers = [...f.answers];
      answers[index] = value;
      return { ...f, answers };
    });
  };

  const handleLotteryAnswerAdd = () => {
    setLotteryForm((f) => ({ ...f, answers: [...f.answers, ""] }));
  };

  const handleLotteryAnswerRemove = (index: number) => {
    setLotteryForm((f) => ({
      ...f,
      answers: f.answers.filter((_, i) => i !== index),
    }));
  };

  /* ========== ActionSheet 操作 ========== */
  const actionSheetActions = [
    { label: "重置", onClick: () => setShowResetModal(true) },
    { label: "关闭", color: "#d34f3d", onClick: () => setShowCloseModal(true) },
  ];

  /* ========== 渲染编辑器 ========== */
  const renderEditor = () => {
    switch (toolType) {
      case "seat-draw":
        return (
          <div className={styles.editorCard}>
            <div className={styles.editorRow}>
              <div className={styles.editorLabel}>主题名称</div>
              <input
                className={styles.editorInput}
                value={seatDrawForm.topic}
                maxLength={20}
                placeholder="请输入主题名称，20个字以内"
                onChange={handleSeatDrawTopicChange}
              />
            </div>

            <div className={styles.editorRow}>
              <div className={styles.editorLabel}>抽号人数</div>
              <select
                className={styles.editorSelect}
                value={seatDrawForm.drawCount}
                onChange={handleSeatDrawCountChange}
              >
                {DRAW_COUNT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.switchRow}>
              <div className={styles.switchText}>多次抽取剔除重复号码</div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={seatDrawForm.excludePreviouslyDrawn}
                  onChange={(e) =>
                    setSeatDrawForm((f) => ({
                      ...f,
                      excludePreviouslyDrawn: e.target.checked,
                    }))
                  }
                />
                <span className={styles.switchSlider} />
              </label>
            </div>

            <div className={styles.switchRow}>
              <div className={styles.switchText}>不包含管理员</div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={seatDrawForm.excludeAdmin}
                  onChange={(e) =>
                    setSeatDrawForm((f) => ({
                      ...f,
                      excludeAdmin: e.target.checked,
                    }))
                  }
                />
                <span className={styles.switchSlider} />
              </label>
            </div>

            <button className={styles.publishBtn} onClick={handlePublish}>
              立即创建
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
                value={voteForm.topic}
                maxLength={30}
                placeholder="请输入主题名称"
                onChange={handleVoteTopicChange}
              />
            </div>

            <div className={styles.editorField}>
              <div className={styles.editorLabel}>投票选项</div>
              <div className={styles.optionList}>
                {voteForm.options.map((opt, idx) => (
                  <div key={idx} className={styles.optionItem}>
                    <input
                      className={styles.optionInput}
                      value={opt}
                      placeholder={`选项 ${idx + 1}`}
                      onChange={(e) => handleVoteOptionChange(idx, e.target.value)}
                    />
                    {voteForm.options.length > 1 && (
                      <button
                        className={styles.optionRemoveBtn}
                        onClick={() => handleVoteOptionRemove(idx)}
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
                {voteForm.options.length < 10 && (
                  <button className={styles.optionAddBtn} onClick={handleVoteOptionAdd}>
                    + 添加选项
                  </button>
                )}
              </div>
            </div>

            <div className={styles.modeRow}>
              <div className={styles.editorLabel}>投票方式</div>
              <div className={styles.modeSwitches}>
                <button
                  className={`${styles.modeChip} ${
                    voteForm.selectionMode === "single" ? styles.modeChipActive : ""
                  }`}
                  onClick={() => handleVoteModeChange("single")}
                >
                  单选
                </button>
                <button
                  className={`${styles.modeChip} ${
                    voteForm.selectionMode === "multiple" ? styles.modeChipActive : ""
                  }`}
                  onClick={() => handleVoteModeChange("multiple")}
                >
                  多选
                </button>
              </div>
            </div>

            {voteForm.selectionMode === "multiple" && (
              <div className={styles.editorRow}>
                <div className={styles.editorLabel}>最多可选</div>
                <input
                  className={styles.editorInput}
                  type="number"
                  value={voteForm.maxSelections}
                  placeholder="请输入最多可选项数"
                  onChange={(e) =>
                    setVoteForm((f) => ({
                      ...f,
                      maxSelections: Number(e.target.value),
                    }))
                  }
                />
              </div>
            )}

            <div className={styles.switchRow}>
              <div className={styles.switchText}>去除管理员</div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={voteForm.excludeAdmin}
                  onChange={(e) =>
                    setVoteForm((f) => ({ ...f, excludeAdmin: e.target.checked }))
                  }
                />
                <span className={styles.switchSlider} />
              </label>
            </div>

            <button className={styles.publishBtn} onClick={handlePublish}>
              立即创建
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
                value={wheelForm.topic}
                maxLength={30}
                placeholder="请输入主题名称"
                onChange={handleWheelTopicChange}
              />
            </div>

            <div className={styles.editorField}>
              <div className={styles.editorLabel}>奖品项</div>
              <div className={styles.optionList}>
                {wheelForm.items.map((item, idx) => (
                  <div key={idx} className={styles.optionItem}>
                    <input
                      className={styles.optionInput}
                      value={item}
                      placeholder={`奖品 ${idx + 1}`}
                      onChange={(e) => handleWheelItemChange(idx, e.target.value)}
                    />
                    {wheelForm.items.length > 2 && (
                      <button
                        className={styles.optionRemoveBtn}
                        onClick={() => handleWheelItemRemove(idx)}
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
                {wheelForm.items.length < 10 && (
                  <button className={styles.optionAddBtn} onClick={handleWheelItemAdd}>
                    + 添加奖品
                  </button>
                )}
              </div>
              <div className={styles.editorHint}>至少 2 项，最多 10 项。</div>
            </div>

            <div className={styles.switchRow}>
              <div className={styles.switchText}>使用人</div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={wheelForm.allowAssignedUser}
                  onChange={(e) =>
                    setWheelForm((f) => ({
                      ...f,
                      allowAssignedUser: e.target.checked,
                    }))
                  }
                />
                <span className={styles.switchSlider} />
              </label>
            </div>

            {wheelForm.allowAssignedUser && (
              <div className={styles.editorField}>
                <div className={styles.editorLabel}>指定成员</div>
                <select className={styles.editorSelect}>
                  <option value="-1">请选择使用成员</option>
                  <option value="0">成员A</option>
                  <option value="1">成员B</option>
                </select>
              </div>
            )}

            <button className={styles.publishBtn} onClick={handlePublish}>
              立即创建
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
                value={lotteryForm.topic}
                maxLength={30}
                placeholder="请输入主题名称"
                onChange={handleLotteryTopicChange}
              />
            </div>

            <div className={styles.editorField}>
              <div className={styles.editorLabel}>答案列表</div>
              <div className={styles.optionList}>
                {lotteryForm.answers.map((ans, idx) => (
                  <div key={idx} className={styles.optionItem}>
                    <input
                      className={styles.optionInput}
                      value={ans}
                      placeholder={`答案 ${idx + 1}`}
                      onChange={(e) => handleLotteryAnswerChange(idx, e.target.value)}
                    />
                    {lotteryForm.answers.length > 1 && (
                      <button
                        className={styles.optionRemoveBtn}
                        onClick={() => handleLotteryAnswerRemove(idx)}
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
                {lotteryForm.answers.length < 10 && (
                  <button className={styles.optionAddBtn} onClick={handleLotteryAnswerAdd}>
                    + 添加答案
                  </button>
                )}
              </div>
            </div>

            <div className={styles.editorRow}>
              <div className={styles.editorLabel}>抽取次数</div>
              <input
                className={styles.editorInput}
                type="number"
                value={lotteryForm.drawCount}
                placeholder="请输入抽取次数"
                onChange={(e) =>
                  setLotteryForm((f) => ({
                    ...f,
                    drawCount: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className={styles.switchRow}>
              <div className={styles.switchText}>使用人</div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={lotteryForm.allowAssignedUser}
                  onChange={(e) =>
                    setLotteryForm((f) => ({
                      ...f,
                      allowAssignedUser: e.target.checked,
                    }))
                  }
                />
                <span className={styles.switchSlider} />
              </label>
            </div>

            {lotteryForm.allowAssignedUser && (
              <div className={styles.editorField}>
                <div className={styles.editorLabel}>指定成员</div>
                <select className={styles.editorSelect}>
                  <option value="-1">请选择使用成员</option>
                  <option value="0">成员A</option>
                  <option value="1">成员B</option>
                </select>
              </div>
            )}

            <button className={styles.publishBtn} onClick={handlePublish}>
              立即创建
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  /* ========== 渲染展示界面（已开启状态） ========== */
  const renderActiveView = () => {
    switch (toolType) {
      case "seat-draw":
        return (
          <div className={styles.activeView}>
            <div className={styles.heroCard}>
              <div className={styles.heroEyebrow}>随机选号</div>
              <div className={styles.heroTitle}>抽号</div>
              <div className={styles.heroSubtitle}>
                随机从车上成员里抽取小伙伴
              </div>

              {/* 老虎机动画区域 */}
              <div className={styles.machine}>
                <div className={styles.machineHandleLeft} />
                <div className={styles.machineShell}>
                  <div className={styles.machineWindow}>
                    <div className={styles.slot}>
                      <span className={styles.slotPlaceholder}>?</span>
                    </div>
                    <div className={styles.slot}>
                      <span className={styles.slotPlaceholder}>?</span>
                    </div>
                    <div className={styles.slot}>
                      <span className={styles.slotPlaceholder}>?</span>
                    </div>
                  </div>
                </div>
                <div className={styles.machineHandleRight} />
              </div>

              {/* 操作按钮 */}
              <div className={styles.heroFooter}>
                {isAdmin ? (
                  <>
                    <button className={styles.heroPrimaryBtn}>开始抽号</button>
                  </>
                ) : (
                  <div className={styles.heroStatus}>抽号即将开始</div>
                )}
              </div>
            </div>

            {/* 更多操作 */}
            {isAdmin && (
              <button
                className={styles.moreAction}
                onClick={() => setShowActionSheet(true)}
              >
                更多操作
              </button>
            )}

            {/* 结果记录 */}
            <div className={styles.resultCard}>
              <div className={styles.resultTitle}>抽号记录</div>
              <div className={styles.resultEmpty}>暂无记录</div>
            </div>
          </div>
        );

      case "vote":
        return (
          <div className={styles.activeView}>
            <div className={styles.heroCard}>
              <div className={styles.heroEyebrow}>投票</div>
              <div className={styles.heroTitle}>全员投票</div>
              <div className={styles.heroSubtitle}>
                请选择你支持的选项
              </div>

              {/* 投票进度 */}
              <div className={styles.voteProgress}>已投 0 / 0</div>

              {/* 投票选项 */}
              <div className={styles.voteOptions}>
                <div className={styles.voteOption}>
                  <div className={styles.voteOptionCopy}>
                    <div className={styles.voteOptionTitle}>选项A</div>
                    <div className={styles.voteOptionLabel}>0 票</div>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className={styles.heroFooter}>
                {isAdmin && (
                  <button className={styles.heroGhostBtn}>终止</button>
                )}
                <button className={styles.heroPrimaryBtn}>确定</button>
              </div>
            </div>

            {isAdmin && (
              <button
                className={styles.moreAction}
                onClick={() => setShowActionSheet(true)}
              >
                更多操作
              </button>
            )}

            <div className={styles.resultCard}>
              <div className={styles.resultTitle}>投票结果</div>
              <div className={styles.resultEmpty}>暂无记录</div>
            </div>
          </div>
        );

      case "wheel":
        return (
          <div className={styles.activeView}>
            <div className={styles.heroCard}>
              <div className={styles.heroEyebrow}>大转盘</div>
              <div className={styles.heroTitle}>幸运大转盘</div>
              <div className={styles.heroSubtitle}>
                转动转盘试试手气
              </div>

              {/* 本轮结果 */}
              <div className={styles.wheelResult}>
                <div className={styles.wheelResultLabel}>本轮结果</div>
                <div className={styles.wheelResultValue}>-</div>
              </div>

              {/* 转盘区域 */}
              <div className={styles.wheelStage}>
                <div className={styles.wheelShell}>
                  <div className={styles.wheelFrame}>
                    <div className={styles.wheelDisc}>
                      <div className={styles.wheelDiscSurface}>
                        <div className={styles.wheelSlice} style={{ background: "#ffebb5" }}>
                          <span className={styles.wheelSliceLabel}>奖品1</span>
                        </div>
                        <div className={styles.wheelSlice} style={{ background: "#eaffba" }}>
                          <span className={styles.wheelSliceLabel}>奖品2</span>
                        </div>
                      </div>
                    </div>
                    <button className={styles.wheelCenterBtn}>开始</button>
                  </div>
                </div>
              </div>

              <div className={styles.heroFooter}>
                <button className={styles.heroPrimaryBtn}>开始抽奖</button>
              </div>
            </div>

            {isAdmin && (
              <button
                className={styles.moreAction}
                onClick={() => setShowActionSheet(true)}
              >
                更多操作
              </button>
            )}

            <div className={styles.resultCard}>
              <div className={styles.resultTitle}>抽奖记录</div>
              <div className={styles.resultEmpty}>暂无记录</div>
            </div>
          </div>
        );

      case "lottery":
        return (
          <div className={styles.activeView}>
            <div className={styles.heroCard}>
              <div className={styles.heroEyebrow}>幸运签</div>
              <div className={styles.heroTitle}>抽签</div>
              <div className={styles.heroSubtitle}>
                抽一支幸运签
              </div>

              {/* 翻牌区域 */}
              <div className={styles.lotteryCards}>
                <div className={styles.lotteryCard}>
                  <div className={styles.lotteryCardFront}>?</div>
                </div>
                <div className={styles.lotteryCard}>
                  <div className={styles.lotteryCardFront}>?</div>
                </div>
                <div className={styles.lotteryCard}>
                  <div className={styles.lotteryCardFront}>?</div>
                </div>
              </div>

              <div className={styles.heroFooter}>
                <button className={styles.heroPrimaryBtn}>开始抽签</button>
              </div>
            </div>

            {isAdmin && (
              <button
                className={styles.moreAction}
                onClick={() => setShowActionSheet(true)}
              >
                更多操作
              </button>
            )}

            <div className={styles.resultCard}>
              <div className={styles.resultTitle}>抽签记录</div>
              <div className={styles.resultEmpty}>暂无记录</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ========== 主渲染 ========== */
  return (
    <div className={styles.page}>
      <PageNavbar title={toolTitle} />

      <div className={styles.content}>
        {/* 未开启 + 管理员 + 未编辑草稿 */}
        {!isStarted && isAdmin && !isDraftEditing && (
          <div className={styles.emptyWrap}>
            <div className={styles.emptyHint}>{toolDescription}</div>
            <button className={styles.createBtn} onClick={handleCreateDraft}>
              创建玩法
            </button>
          </div>
        )}

        {/* 未开启 + 管理员 + 编辑草稿 */}
        {!isStarted && isAdmin && isDraftEditing && (
          <div className={styles.editorWrap}>{renderEditor()}</div>
        )}

        {/* 未开启 + 普通用户 */}
        {!isStarted && !isAdmin && (
          <div className={styles.emptyWrap}>
            <div className={styles.viewerEmpty}>玩法暂未开启</div>
          </div>
        )}

        {/* 已开启 */}
        {isStarted && <div className={styles.activeWrap}>{renderActiveView()}</div>}
      </div>

      {/* ActionSheet */}
      <ActionSheet
        visible={showActionSheet}
        actions={actionSheetActions}
        onClose={() => setShowActionSheet(false)}
      />

      {/* 重置确认弹窗 */}
      <Modal
        visible={showResetModal}
        title="重置确认"
        content="确定要重置当前工具吗？所有数据将被清除。"
        confirmText="确定"
        cancelText="取消"
        onConfirm={handleReset}
        onCancel={() => setShowResetModal(false)}
      />

      {/* 关闭确认弹窗 */}
      <Modal
        visible={showCloseModal}
        title="关闭确认"
        content="确定要关闭当前工具吗？关闭后将无法恢复。"
        confirmText="确定"
        cancelText="取消"
        onConfirm={handleClose}
        onCancel={() => setShowCloseModal(false)}
      />
    </div>
  );
}
