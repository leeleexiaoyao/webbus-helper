import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/src/server/session";
import { getStore } from "@/src/server/repositories/sqlite-store";
import { TripService } from "@/src/domain/trip-service";
import { BusinessError } from "@/src/domain/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; toolType: string }> }
) {
  try {
    const userId = await requireCurrentUser();
    await params; // 确保tripId被解析，但我们不需要它，因为tripService会根据当前用户的状态自动处理
    const body = await request.json();
    const store = getStore(userId);
    const service = new TripService(store);
    const { action, ...input } = body;

    switch (action) {
      // 随机抽号
      case "publish-seat-draw":
        return NextResponse.json(service.publishSeatDrawTool(input));
      case "start-seat-draw":
        return NextResponse.json(service.startSeatDrawRound());
      case "advance-seat-draw":
        return NextResponse.json(service.advanceSeatDrawRollingFrame());
      case "finalize-seat-draw":
        return NextResponse.json(service.finalizeSeatDrawRoundIfDue());
      case "draw-seat":
        return NextResponse.json(service.drawSeat());
      case "reset-seat-draw":
        return NextResponse.json(service.resetSeatDraw());
      case "close-seat-draw":
        return NextResponse.json(service.closeSeatDraw());
      case "recreate-seat-draw":
        return NextResponse.json(service.recreateSeatDrawTool(input));

      // 投票
      case "publish-vote":
        return NextResponse.json(service.publishVoteTool(input));
      case "submit-vote":
        return NextResponse.json(service.submitVote(input));
      case "end-vote":
        return NextResponse.json(service.endVote());
      case "reset-vote":
        return NextResponse.json(service.resetVote());
      case "close-vote":
        return NextResponse.json(service.closeVote());
      case "recreate-vote":
        return NextResponse.json(service.recreateVoteTool(input));

      // 大转盘
      case "publish-wheel":
        return NextResponse.json(service.publishWheelTool(input));
      case "spin-wheel":
        return NextResponse.json(service.spinWheel(input));
      case "reset-wheel":
        return NextResponse.json(service.resetWheel());
      case "close-wheel":
        return NextResponse.json(service.closeWheel());
      case "recreate-wheel":
        return NextResponse.json(service.recreateWheelTool(input));

      // 幸运签
      case "publish-lottery":
        return NextResponse.json(service.publishLotteryTool(input));
      case "claim-lottery":
        return NextResponse.json(service.claimLottery(input));
      case "reset-lottery":
        return NextResponse.json(service.resetLottery());
      case "close-lottery":
        return NextResponse.json(service.closeLottery());
      case "recreate-lottery":
        return NextResponse.json(service.recreateLotteryTool(input));

      default:
        return NextResponse.json({ error: "未知操作" }, { status: 400 });
    }
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
    const store = getStore(userId);
    const service = new TripService(store);

    const toolDetailData = service.getToolDetailPageData(toolType as any);
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
