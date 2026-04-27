import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/src/server/session";
import { withSupabaseTripService } from "@/src/server/trip-service-runner";
import { BusinessError } from "@/src/domain/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; toolType: string }> }
) {
  try {
    const userId = await requireCurrentUser();
    await params;
    const body = await request.json();
    const { action, ...input } = body;

    const result = await withSupabaseTripService(userId, (service) => {
      switch (action) {
      // 随机抽号
      case "publish-seat-draw":
          return service.publishSeatDrawTool(input);
      case "start-seat-draw":
          return service.startSeatDrawRound();
      case "advance-seat-draw":
          return service.advanceSeatDrawRollingFrame();
      case "finalize-seat-draw":
          return service.finalizeSeatDrawRoundIfDue();
      case "draw-seat":
          return service.drawSeat();
      case "reset-seat-draw":
          return service.resetSeatDraw();
      case "close-seat-draw":
          return service.closeSeatDraw();
      case "recreate-seat-draw":
          return service.recreateSeatDrawTool(input);

      // 投票
      case "publish-vote":
          return service.publishVoteTool(input);
      case "submit-vote":
          return service.submitVote(input);
      case "end-vote":
          return service.endVote();
      case "reset-vote":
          return service.resetVote();
      case "close-vote":
          return service.closeVote();
      case "recreate-vote":
          return service.recreateVoteTool(input);

      // 大转盘
      case "publish-wheel":
          return service.publishWheelTool(input);
      case "spin-wheel":
          return service.spinWheel(input.selectedIndex);
      case "reset-wheel":
          return service.resetWheel();
      case "close-wheel":
          return service.closeWheel();
      case "recreate-wheel":
          return service.recreateWheelTool(input);

      // 幸运签
      case "publish-lottery":
          return service.publishLotteryTool(input);
      case "claim-lottery":
          return service.claimLottery(input.cardId);
      case "reset-lottery":
          return service.resetLottery();
      case "close-lottery":
          return service.closeLottery();
      case "recreate-lottery":
          return service.recreateLotteryTool(input);

      default:
          throw new BusinessError("INVALID_ACTION", "未知操作");
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BusinessError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if ((error as any).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; toolType: string }> }
) {
  try {
    const userId = await requireCurrentUser();
    const { toolType } = await params;
    const toolDetailData = await withSupabaseTripService(userId, (service) =>
      service.getToolDetailPageData(toolType as any)
    );
    return NextResponse.json({
      ...toolDetailData,
      isStarted: !!toolDetailData.voteDetail || !!toolDetailData.seatDrawDetail || !!toolDetailData.wheelDetail || !!toolDetailData.lotteryDetail
    });
  } catch (error) {
    if ((error as any).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
